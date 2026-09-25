import { PsqlSession } from '../lib/session.mjs';

const SCENARIO_ID = 'CONC-02';
const USER_ID = '11111111-1111-4111-8111-00000000c002';
const ATTEMPT_ID = 'c0000002-0000-4000-8000-000000000001';
const ACTION_A = 'c0000002-a001-4000-8000-000000000001';
const ACTION_B = 'c0000002-b001-4000-8000-000000000001';

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

  try {
    // Clean any stale fixture before setup
    cleanup();

    // Create user and initial valid in_progress attempt at revision 0
    supervisor.execSql(`
      INSERT INTO auth.users (id, email) VALUES ('${USER_ID}', 'conc02@example.test')
      ON CONFLICT (id) DO NOTHING;
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
    `);

    // Verify initial attempt state
    const initialCheck = supervisor.execSql(`SELECT revision, last_sequence, status FROM public.attempts WHERE id = '${ATTEMPT_ID}';`);
    if (initialCheck !== '0|0|in_progress') {
      throw new Error(`Initial attempt state unexpected: ${initialCheck}`);
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

    // Session A: BEGIN; commit_attempt_event for Action A with expected_revision=0; emit A_READY
    sessionA.send(`
      BEGIN;
      SELECT public.commit_attempt_event(
        p_attempt_id => '${ATTEMPT_ID}',
        p_actor_user_id => '${USER_ID}',
        p_scenario_release_id => 'acid-neutralization@1.0.0',
        p_expected_revision => 0,
        p_action_id => '${ACTION_A}',
        p_request_fingerprint => 'action-a-fp',
        p_event_kind => 'domain_action',
        p_action_type => 'add_base',
        p_input_payload => '{"volumeL":0.001}'::jsonb,
        p_normalized_input => '{"volumeL":0.001}'::jsonb,
        p_result_payload => '{"nextState":{"phase":"mixed","pH":7.0}}'::jsonb,
        p_calculation_trace => '[]'::jsonb,
        p_observations => '[]'::jsonb,
        p_warnings => '[]'::jsonb,
        p_resource_delta => '{"reagents":{},"waterLiters":0,"operationCount":1,"relativeCostIndexDelta":null,"safetyPenalties":[],"secondaryWaste":{}}'::jsonb,
        p_state_before_hash => encode(sha256('b4'::bytea), 'hex'),
        p_state_after => '{"phase":"mixed","pH":7.0}'::jsonb,
        p_state_after_hash => encode(sha256('aft-a'::bytea), 'hex'),
        p_undo_of_sequence => null,
        p_occurred_at => now(),
        p_current_projection => '{"phase":"mixed","pH":7.0}'::jsonb,
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

    // Session B: BEGIN; commit_attempt_event for Action B with expected_revision=0 (stale once A commits)
    sessionB.send(`
      BEGIN;
      SELECT public.commit_attempt_event(
        p_attempt_id => '${ATTEMPT_ID}',
        p_actor_user_id => '${USER_ID}',
        p_scenario_release_id => 'acid-neutralization@1.0.0',
        p_expected_revision => 0,
        p_action_id => '${ACTION_B}',
        p_request_fingerprint => 'action-b-fp',
        p_event_kind => 'domain_action',
        p_action_type => 'add_base',
        p_input_payload => '{"volumeL":0.002}'::jsonb,
        p_normalized_input => '{"volumeL":0.002}'::jsonb,
        p_result_payload => '{"nextState":{"phase":"mixed","pH":8.0}}'::jsonb,
        p_calculation_trace => '[]'::jsonb,
        p_observations => '[]'::jsonb,
        p_warnings => '[]'::jsonb,
        p_resource_delta => '{"reagents":{},"waterLiters":0,"operationCount":1,"relativeCostIndexDelta":null,"safetyPenalties":[],"secondaryWaste":{}}'::jsonb,
        p_state_before_hash => encode(sha256('b4'::bytea), 'hex'),
        p_state_after => '{"phase":"mixed","pH":8.0}'::jsonb,
        p_state_after_hash => encode(sha256('aft-b'::bytea), 'hex'),
        p_undo_of_sequence => null,
        p_occurred_at => now(),
        p_current_projection => '{"phase":"mixed","pH":8.0}'::jsonb,
        p_projection_version => 1
      );
      \\echo VECLAB_CONCURRENCY:${SCENARIO_ID}:B:RESULT
      COMMIT;
      \\echo VECLAB_CONCURRENCY:${SCENARIO_ID}:B:DONE
    `);

    // Prove B is waiting on a lock before committing A
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
    const bResultOutput = await sessionB.waitForMarker(`VECLAB_CONCURRENCY:${SCENARIO_ID}:B:RESULT`);
    await sessionB.waitForMarker(`VECLAB_CONCURRENCY:${SCENARIO_ID}:B:DONE`);

    if (bResultOutput.includes('"revision_conflict"')) {
      result.session_b_outcome = 'revision_conflict';
      result.session_b_sqlstate = '00000';
    } else {
      result.session_b_outcome = bResultOutput.trim();
      throw new Error(`Expected Session B outcome revision_conflict, got: ${bResultOutput}`);
    }

    // Invariants
    const attemptRow = supervisor.execSql(`SELECT revision, last_sequence FROM public.attempts WHERE id = '${ATTEMPT_ID}';`);
    const [finalRev, finalSeq] = attemptRow.split('|');

    const eventCount = parseInt(supervisor.execSql(`SELECT count(*) FROM public.attempt_events WHERE attempt_id = '${ATTEMPT_ID}';`), 10);
    const winningAction = supervisor.execSql(`SELECT action_id FROM public.attempt_events WHERE attempt_id = '${ATTEMPT_ID}';`);
    const bEventCount = parseInt(supervisor.execSql(`SELECT count(*) FROM public.attempt_events WHERE attempt_id = '${ATTEMPT_ID}' AND action_id = '${ACTION_B}';`), 10);
    const currentProjection = supervisor.execSql(`SELECT current_projection->>'pH' FROM public.attempts WHERE id = '${ATTEMPT_ID}';`);

    const invRevision = { name: 'revision_advanced_to_one', pass: finalRev === '1' };
    const invSequence = { name: 'sequence_advanced_to_one', pass: finalSeq === '1' };
    const invEventCount = { name: 'exactly_one_event_exists', pass: eventCount === 1 };
    const invWinningAction = { name: 'winning_action_is_action_a', pass: winningAction === ACTION_A };
    const invNoBEvent = { name: 'action_b_created_no_event', pass: bEventCount === 0 };
    const invProjection = { name: 'projection_matches_action_a', pass: currentProjection === '7.0' };

    result.invariants.push(invRevision, invSequence, invEventCount, invWinningAction, invNoBEvent, invProjection);
    const allInvariantsPass = result.invariants.every(inv => inv.pass);

    if (
      result.distinct_backend_pids &&
      result.overlap_proven &&
      result.session_a_outcome === 'committed' &&
      result.session_b_outcome === 'revision_conflict' &&
      allInvariantsPass
    ) {
      result.status = 'PASS';
    }

    return result;
  } finally {
    await sessionA.close().catch(() => sessionA.terminate());
    await sessionB.close().catch(() => sessionB.terminate());
    supervisor.untrackPid(result.session_a_backend_pid);
    supervisor.untrackPid(result.session_b_backend_pid);

    try {
      cleanup();
      const countRemaining = parseInt(supervisor.execSql(`SELECT count(*) FROM public.attempts WHERE id = '${ATTEMPT_ID}';`), 10);
      result.cleanup_passed = countRemaining === 0;
    } catch {
      result.cleanup_passed = false;
    }
  }
}
