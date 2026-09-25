import { PsqlSession } from '../lib/session.mjs';

const SCENARIO_ID = 'CONC-03';
const USER_ID = '11111111-1111-4111-8111-00000000c003';
const PARENT_ID = 'c0000003-0000-4000-8000-000000000001';
const CHILD_ID = 'c0000003-0000-4000-8000-000000000002';
const ACTION_ORIGIN = 'c0000003-a001-4000-8000-000000000001';
const ACTION_STOP = 'c0000003-a002-4000-8000-000000000002';

const BRANCH_ORIGIN_SNAPSHOT = '{"originSequence":1,"parentStatus":"stopped"}';
const INHERITED_TIMELINE_SNAPSHOT = '[{"sequence":1,"actionType":"add_base"}]';

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

  let coreSuccess = false;
  let scenarioError = null;

  const sessionA = new PsqlSession(containerName, `${SCENARIO_ID}_SessionA`);
  const sessionB = new PsqlSession(containerName, `${SCENARIO_ID}_SessionB`);

  const cleanup = () => {
    supervisor.execSql(`
      DELETE FROM public.attempt_events WHERE attempt_id IN ('${CHILD_ID}', '${PARENT_ID}') OR action_id IN ('${ACTION_ORIGIN}', '${ACTION_STOP}');
      DELETE FROM public.attempts WHERE id IN ('${CHILD_ID}', '${PARENT_ID}');
      DELETE FROM auth.users WHERE id = '${USER_ID}';
    `);
  };

  try {
    // Clean any stale fixture before setup
    cleanup();

    // Setup terminal parent attempt with origin event and stopped status
    supervisor.execSql(`
      INSERT INTO auth.users (id, email) VALUES ('${USER_ID}', 'conc03@example.test')
      ON CONFLICT (id) DO NOTHING;

      -- Create parent attempt
      SELECT public.create_attempt(
        p_attempt_id => '${PARENT_ID}',
        p_actor_user_id => '${USER_ID}',
        p_scenario_key => 'acid-neutralization',
        p_scenario_release_id => 'acid-neutralization@1.0.0',
        p_content_locale => 'vi',
        p_initial_state => '{"phase":"ready"}'::jsonb,
        p_current_projection => '{"phase":"ready"}'::jsonb,
        p_projection_version => 1
      );

      -- Origin event (sequence 1)
      SELECT public.commit_attempt_event(
        p_attempt_id => '${PARENT_ID}',
        p_actor_user_id => '${USER_ID}',
        p_scenario_release_id => 'acid-neutralization@1.0.0',
        p_expected_revision => 0,
        p_action_id => '${ACTION_ORIGIN}',
        p_request_fingerprint => 'action-origin-fp',
        p_event_kind => 'domain_action',
        p_action_type => 'add_base',
        p_input_payload => '{"volumeL":0.001}'::jsonb,
        p_normalized_input => '{"volumeL":0.001}'::jsonb,
        p_result_payload => '{"nextState":{"phase":"halfway"}}'::jsonb,
        p_calculation_trace => '[]'::jsonb,
        p_observations => '[]'::jsonb,
        p_warnings => '[]'::jsonb,
        p_resource_delta => '{"reagents":{},"waterLiters":0,"operationCount":1,"relativeCostIndexDelta":null,"safetyPenalties":[],"secondaryWaste":{}}'::jsonb,
        p_state_before_hash => encode(sha256('b4'::bytea), 'hex'),
        p_state_after => '{"phase":"halfway"}'::jsonb,
        p_state_after_hash => encode(sha256('aft'::bytea), 'hex'),
        p_undo_of_sequence => null,
        p_occurred_at => now(),
        p_current_projection => '{"phase":"halfway"}'::jsonb,
        p_projection_version => 1
      );

      -- Stop parent to make it terminal (sequence 2)
      SELECT public.stop_attempt(
        p_attempt_id => '${PARENT_ID}',
        p_actor_user_id => '${USER_ID}',
        p_scenario_release_id => 'acid-neutralization@1.0.0',
        p_expected_revision => 1,
        p_action_id => '${ACTION_STOP}',
        p_request_fingerprint => 'action-stop-fp',
        p_action_type => 'stopped',
        p_input_payload => '{}'::jsonb,
        p_normalized_input => '{}'::jsonb,
        p_result_payload => '{}'::jsonb,
        p_calculation_trace => '[]'::jsonb,
        p_observations => '[]'::jsonb,
        p_warnings => '[]'::jsonb,
        p_resource_delta => '{"reagents":{},"waterLiters":0,"operationCount":1,"relativeCostIndexDelta":null,"safetyPenalties":[],"secondaryWaste":{}}'::jsonb,
        p_state_before_hash => encode(sha256('b4-stop'::bytea), 'hex'),
        p_state_after => '{"phase":"stopped"}'::jsonb,
        p_state_after_hash => encode(sha256('aft-stop'::bytea), 'hex'),
        p_occurred_at => now(),
        p_current_projection => '{"phase":"stopped"}'::jsonb,
        p_projection_version => 1
      );
    `);

    // Record parent status, revision, last_sequence before race
    const parentBefore = supervisor.execSql(`SELECT status, revision, last_sequence FROM public.attempts WHERE id = '${PARENT_ID}';`);
    if (parentBefore !== 'stopped|2|2') {
      throw new Error(`Parent attempt setup failed, expected stopped|2|2, got: ${parentBefore}`);
    }

    // Ensure child branch ID is absent before starting
    const childInitialCount = parseInt(supervisor.execSql(`SELECT count(*) FROM public.attempts WHERE id = '${CHILD_ID}';`), 10);
    if (childInitialCount !== 0) {
      throw new Error(`Child attempt ${CHILD_ID} already exists before test`);
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

    // Session A: BEGIN; call branch_attempt using fresh child ID; require outcome committed; emit A_READY
    sessionA.send(`
      BEGIN;
      SELECT public.branch_attempt(
        p_attempt_id => '${CHILD_ID}',
        p_actor_user_id => '${USER_ID}',
        p_parent_attempt_id => '${PARENT_ID}',
        p_parent_sequence => 1,
        p_scenario_release_id => 'acid-neutralization@1.0.0',
        p_content_locale => 'vi',
        p_current_state => '{"phase":"halfway"}'::jsonb,
        p_current_projection => '{"phase":"halfway"}'::jsonb,
        p_projection_version => 1,
        p_branch_origin_snapshot => '${BRANCH_ORIGIN_SNAPSHOT}'::jsonb,
        p_inherited_timeline_snapshot => '${INHERITED_TIMELINE_SNAPSHOT}'::jsonb
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

    // Session B: BEGIN; call branch_attempt with identical arguments; emit ERRCODE :SQLSTATE; ROLLBACK; emit B_DONE
    sessionB.send(`
      BEGIN;
      \\set ON_ERROR_STOP off
      SELECT public.branch_attempt(
        p_attempt_id => '${CHILD_ID}',
        p_actor_user_id => '${USER_ID}',
        p_parent_attempt_id => '${PARENT_ID}',
        p_parent_sequence => 1,
        p_scenario_release_id => 'acid-neutralization@1.0.0',
        p_content_locale => 'vi',
        p_current_state => '{"phase":"halfway"}'::jsonb,
        p_current_projection => '{"phase":"halfway"}'::jsonb,
        p_projection_version => 1,
        p_branch_origin_snapshot => '${BRANCH_ORIGIN_SNAPSHOT}'::jsonb,
        p_inherited_timeline_snapshot => '${INHERITED_TIMELINE_SNAPSHOT}'::jsonb
      );
      \\echo VECLAB_CONCURRENCY:${SCENARIO_ID}:B:ERRCODE :SQLSTATE
      \\set ON_ERROR_STOP on
      ROLLBACK;
      \\echo VECLAB_CONCURRENCY:${SCENARIO_ID}:B:DONE
    `);

    // Prove B is waiting on a PostgreSQL lock while A remains uncommitted
    const lockWait = await supervisor.checkLockWait(pidB);
    if (!lockWait.waiting) {
      throw new Error('CONCURRENCY_NOT_PROVEN: Session B did not enter an observable lock wait before timeout');
    }

    result.overlap_proven = true;
    result.waiting_lock_observed = true;
    result.wait_event_type = lockWait.wait_event_type || 'Lock';

    // Release Session A
    sessionA.send(`COMMIT; \\echo VECLAB_CONCURRENCY:${SCENARIO_ID}:A:DONE\n`);
    await sessionA.waitForMarker(`VECLAB_CONCURRENCY:${SCENARIO_ID}:A:DONE`);

    // Await Session B outcome
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
    const childCount = parseInt(supervisor.execSql(`SELECT count(*) FROM public.attempts WHERE id = '${CHILD_ID}';`), 10);
    const childRow = supervisor.execSql(`SELECT status, revision, last_sequence, parent_attempt_id, parent_sequence FROM public.attempts WHERE id = '${CHILD_ID}';`);
    const [cStatus, cRev, cSeq, cParentId, cParentSeq] = childRow.split('|');

    const originSnapshotActual = supervisor.execSql(`SELECT branch_origin_snapshot::text FROM public.attempts WHERE id = '${CHILD_ID}';`);
    const timelineSnapshotActual = supervisor.execSql(`SELECT inherited_timeline_snapshot::text FROM public.attempts WHERE id = '${CHILD_ID}';`);
    const parentAfter = supervisor.execSql(`SELECT status, revision, last_sequence FROM public.attempts WHERE id = '${PARENT_ID}';`);

    const invSingleChild = { name: 'exactly_one_child_exists', pass: childCount === 1 };
    const invChildStatus = { name: 'child_in_progress', pass: cStatus === 'in_progress' };
    const invChildRevSeq = { name: 'child_revision_and_sequence_zero', pass: cRev === '0' && cSeq === '0' };
    const invChildParent = { name: 'child_parent_reference_valid', pass: cParentId === PARENT_ID && cParentSeq === '1' };
    function deepEqual(a, b) {
      if (a === b) return true;
      if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
      if (Array.isArray(a) !== Array.isArray(b)) return false;
      if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
          if (!deepEqual(a[i], b[i])) return false;
        }
        return true;
      }
      const keysA = Object.keys(a).sort();
      const keysB = Object.keys(b).sort();
      if (keysA.length !== keysB.length) return false;
      for (let i = 0; i < keysA.length; i++) {
        if (keysA[i] !== keysB[i]) return false;
        if (!deepEqual(a[keysA[i]], b[keysB[i]])) return false;
      }
      return true;
    }

    let snapshotsMatch = false;
    try {
      const originActualParsed = JSON.parse(originSnapshotActual);
      const originExpectedParsed = JSON.parse(BRANCH_ORIGIN_SNAPSHOT);
      const timelineActualParsed = JSON.parse(timelineSnapshotActual);
      const timelineExpectedParsed = JSON.parse(INHERITED_TIMELINE_SNAPSHOT);

      snapshotsMatch = deepEqual(originActualParsed, originExpectedParsed) &&
                       deepEqual(timelineActualParsed, timelineExpectedParsed);
    } catch {
      snapshotsMatch = false;
    }

    const invSnapshots = {
      name: 'snapshots_match_expected',
      pass: snapshotsMatch
    };
    const invParentUnchanged = { name: 'parent_state_unchanged', pass: parentAfter === parentBefore };

    result.invariants.push(invSingleChild, invChildStatus, invChildRevSeq, invChildParent, invSnapshots, invParentUnchanged);
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
      const remainingAttempts = parseInt(supervisor.execSql(`SELECT count(*) FROM public.attempts WHERE id IN ('${CHILD_ID}', '${PARENT_ID}');`), 10);
      const remainingEvents = parseInt(supervisor.execSql(`SELECT count(*) FROM public.attempt_events WHERE attempt_id IN ('${CHILD_ID}', '${PARENT_ID}') OR action_id IN ('${ACTION_ORIGIN}', '${ACTION_STOP}');`), 10);
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
