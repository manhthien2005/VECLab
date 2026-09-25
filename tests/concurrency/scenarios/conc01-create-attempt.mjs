import { PsqlSession } from '../lib/session.mjs';

const SCENARIO_ID = 'CONC-01';
const USER_ID = '11111111-1111-4111-8111-00000000c001';
const ATTEMPT_ID = 'c0000001-0000-4000-8000-000000000001';

/**
 * Pure helper for computing scenario final pass/fail status.
 * Requires both core race/invariant success AND cleanup success.
 */
export function computeScenarioStatus({ coreSuccess, cleanupPassed, hasError }) {
  return (coreSuccess && cleanupPassed && !hasError) ? 'PASS' : 'FAIL';
}

export async function runScenario(containerName, supervisor) {
  const result = {
    id: SCENARIO_ID,
    status: 'FAIL',
    session_a_backend_pid: 0,
    session_b_backend_pid: 0,
    distinct_backend_pids: false,
    overlap_proven: false,
    wait_event_type: null,
    waiting_lock_observed: false,
    session_a_outcome: 'unknown',
    session_b_outcome: 'unknown',
    session_b_sqlstate: null,
    invariants: [],
    cleanup_passed: false
  };

  const sessionA = new PsqlSession(containerName, `${SCENARIO_ID}_SessionA`);
  const sessionB = new PsqlSession(containerName, `${SCENARIO_ID}_SessionB`);

  const cleanup = () => {
    supervisor.execSql(`
      DELETE FROM public.attempt_events WHERE attempt_id = '${ATTEMPT_ID}';
      DELETE FROM public.attempts WHERE id = '${ATTEMPT_ID}';
      DELETE FROM auth.users WHERE id = '${USER_ID}';
    `);
  };

  let coreSuccess = false;
  let scenarioError = null;

  try {
    // Clean any stale fixture before setup
    cleanup();

    // Ensure actor user exists
    supervisor.execSql(`
      INSERT INTO auth.users (id, email) VALUES ('${USER_ID}', 'conc01@example.test')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Verify target attempt is absent
    const initialCount = parseInt(supervisor.execSql(`SELECT count(*) FROM public.attempts WHERE id = '${ATTEMPT_ID}';`), 10);
    if (initialCount !== 0) {
      throw new Error(`Target attempt ${ATTEMPT_ID} is not absent before start`);
    }

    // Start Session A and Session B
    const pidA = await sessionA.start();
    const pidB = await sessionB.start();
    supervisor.trackPid(pidA);
    supervisor.trackPid(pidB);

    result.session_a_backend_pid = pidA;
    result.session_b_backend_pid = pidB;
    result.distinct_backend_pids = pidA !== pidB && pidA > 0 && pidB > 0;

    if (!result.distinct_backend_pids) {
      throw new Error(`Sessions must have distinct positive backend PIDs: A=${pidA}, B=${pidB}`);
    }

    // Session A: BEGIN; create_attempt; emit A_READY while leaving uncommitted
    sessionA.send(`
      BEGIN;
      SELECT public.create_attempt(
        p_attempt_id => '${ATTEMPT_ID}',
        p_actor_user_id => '${USER_ID}',
        p_scenario_key => 'acid-neutralization',
        p_scenario_release_id => 'acid-neutralization@1.0.0',
        p_content_locale => 'vi',
        p_initial_state => '{"phase":"ready"}'::jsonb,
        p_current_projection => '{"phase":"ready"}'::jsonb,
        p_projection_version => 1
      );
      \\echo VECLAB_CONCURRENCY:${SCENARIO_ID}:A:READY
    `);

    const aReadyOutput = await sessionA.waitForMarker(`VECLAB_CONCURRENCY:${SCENARIO_ID}:A:READY`);
    if (aReadyOutput.includes('"committed"')) {
      result.session_a_outcome = 'committed';
    } else {
      result.session_a_outcome = aReadyOutput.trim();
      throw new Error(`Session A did not return outcome committed: ${aReadyOutput}`);
    }

    // Session B: BEGIN; create_attempt with same ID; emit ERRCODE :SQLSTATE; ROLLBACK; emit B_DONE
    sessionB.send(`
      BEGIN;
      \\set ON_ERROR_STOP off
      SELECT public.create_attempt(
        p_attempt_id => '${ATTEMPT_ID}',
        p_actor_user_id => '${USER_ID}',
        p_scenario_key => 'acid-neutralization',
        p_scenario_release_id => 'acid-neutralization@1.0.0',
        p_content_locale => 'vi',
        p_initial_state => '{"phase":"ready"}'::jsonb,
        p_current_projection => '{"phase":"ready"}'::jsonb,
        p_projection_version => 1
      );
      \\echo VECLAB_CONCURRENCY:${SCENARIO_ID}:B:ERRCODE :SQLSTATE
      \\set ON_ERROR_STOP on
      ROLLBACK;
      \\echo VECLAB_CONCURRENCY:${SCENARIO_ID}:B:DONE
    `);

    // Poll supervisor pg_stat_activity and pg_locks until Session B is waiting on a lock
    const lockWait = await supervisor.checkLockWait(pidB);
    if (!lockWait.waiting) {
      throw new Error('CONCURRENCY_NOT_PROVEN: Session B did not enter an observable lock wait before timeout');
    }

    result.overlap_proven = true;
    result.waiting_lock_observed = true;
    result.wait_event_type = lockWait.wait_event_type || 'Lock';

    // Release Session A only after lock wait is proven
    sessionA.send(`COMMIT; \\echo VECLAB_CONCURRENCY:${SCENARIO_ID}:A:DONE\n`);
    await sessionA.waitForMarker(`VECLAB_CONCURRENCY:${SCENARIO_ID}:A:DONE`);

    // Await Session B completion and capture SQLSTATE
    const bDoneOutput = await sessionB.waitForMarker(`VECLAB_CONCURRENCY:${SCENARIO_ID}:B:DONE`);
    const match = bDoneOutput.match(new RegExp(`VECLAB_CONCURRENCY:${SCENARIO_ID}:B:ERRCODE\\s+([0-9A-Z]{5})`));
    const capturedSqlState = match ? match[1] : null;

    result.session_b_sqlstate = capturedSqlState;
    if (capturedSqlState === '23505') {
      result.session_b_outcome = 'SQLSTATE_23505';
    } else {
      result.session_b_outcome = capturedSqlState ? `SQLSTATE_${capturedSqlState}` : 'NO_SQLSTATE';
      throw new Error(`Expected Session B SQLSTATE 23505, got: ${capturedSqlState}`);
    }

    // Invariants
    const attemptCount = parseInt(supervisor.execSql(`SELECT count(*) FROM public.attempts WHERE id = '${ATTEMPT_ID}';`), 10);
    const rowInfo = supervisor.execSql(`SELECT status, revision, last_sequence FROM public.attempts WHERE id = '${ATTEMPT_ID}';`);
    const eventCount = parseInt(supervisor.execSql(`SELECT count(*) FROM public.attempt_events WHERE attempt_id = '${ATTEMPT_ID}';`), 10);

    const [status, rev, seq] = rowInfo.split('|');
    const invSingleAttempt = { name: 'exactly_one_attempt_exists', pass: attemptCount === 1 };
    const invStatus = { name: 'attempt_in_progress', pass: status === 'in_progress' };
    const invRevSeq = { name: 'revision_and_sequence_zero', pass: rev === '0' && seq === '0' };
    const invZeroEvents = { name: 'zero_events_exist', pass: eventCount === 0 };

    result.invariants.push(invSingleAttempt, invStatus, invRevSeq, invZeroEvents);
    const allInvariantsPass = result.invariants.length > 0 && result.invariants.every(inv => inv.pass);

    coreSuccess = result.distinct_backend_pids &&
                  result.overlap_proven &&
                  result.session_a_outcome === 'committed' &&
                  result.session_b_outcome === 'SQLSTATE_23505' &&
                  allInvariantsPass;

    return result;
  } catch (err) {
    scenarioError = err;
    result.error = err.message || String(err);
    err.scenarioResult = result;
    throw err;
  } finally {
    await sessionA.close().catch(() => sessionA.terminate());
    await sessionB.close().catch(() => sessionB.terminate());
    supervisor.untrackPid(result.session_a_backend_pid);
    supervisor.untrackPid(result.session_b_backend_pid);

    try {
      cleanup();
      const remainingAttempts = parseInt(supervisor.execSql(`SELECT count(*) FROM public.attempts WHERE id = '${ATTEMPT_ID}';`), 10);
      const remainingEvents = parseInt(supervisor.execSql(`SELECT count(*) FROM public.attempt_events WHERE attempt_id = '${ATTEMPT_ID}';`), 10);
      const remainingUsers = parseInt(supervisor.execSql(`SELECT count(*) FROM auth.users WHERE id = '${USER_ID}';`), 10);

      result.cleanup_passed = (remainingAttempts === 0 && remainingEvents === 0 && remainingUsers === 0);
    } catch {
      result.cleanup_passed = false;
    }

    result.status = computeScenarioStatus({
      coreSuccess,
      cleanupPassed: result.cleanup_passed,
      hasError: Boolean(scenarioError)
    });
  }
}
