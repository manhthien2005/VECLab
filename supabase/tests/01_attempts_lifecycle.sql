BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(41);

-- Fixtures: deterministic test users
INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-4111-8111-000000000001', 'alice.lifecycle@example.test'),
  ('11111111-1111-4111-8111-000000000002', 'bob.lifecycle@example.test')
ON CONFLICT (id) DO NOTHING;

-- Helper functions
CREATE OR REPLACE FUNCTION pg_temp.make_attempt(
  p_id uuid,
  p_user uuid,
  p_release text DEFAULT 'acid-neutralization@1.0.0',
  p_key text DEFAULT 'acid-neutralization'
) RETURNS jsonb LANGUAGE plpgsql AS $$
BEGIN
  RETURN public.create_attempt(
    p_attempt_id          => p_id,
    p_actor_user_id       => p_user,
    p_scenario_key        => p_key,
    p_scenario_release_id => p_release,
    p_content_locale      => 'vi',
    p_initial_state       => '{"phase":"ready"}'::jsonb,
    p_current_projection  => '{"phase":"ready"}'::jsonb,
    p_projection_version  => 1
  );
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.commit_evt(
  p_attempt_id uuid,
  p_user_id uuid,
  p_revision integer,
  p_action_id uuid,
  p_fingerprint text,
  p_state_after jsonb DEFAULT '{"phase":"mixed"}'::jsonb
) RETURNS jsonb LANGUAGE plpgsql AS $$
BEGIN
  RETURN public.commit_attempt_event(
    p_attempt_id          => p_attempt_id,
    p_actor_user_id       => p_user_id,
    p_scenario_release_id => 'acid-neutralization@1.0.0',
    p_expected_revision   => p_revision,
    p_action_id           => p_action_id,
    p_request_fingerprint => p_fingerprint,
    p_event_kind          => 'domain_action',
    p_action_type         => 'add_base',
    p_input_payload       => '{"volumeL":0.001}'::jsonb,
    p_normalized_input    => '{"volumeL":0.001}'::jsonb,
    p_result_payload      => '{"nextState":{}}'::jsonb,
    p_calculation_trace   => '[]'::jsonb,
    p_observations        => '[]'::jsonb,
    p_warnings            => '[]'::jsonb,
    p_resource_delta      => '{"reagents":{},"waterLiters":0,"operationCount":1,"relativeCostIndexDelta":null,"safetyPenalties":[],"secondaryWaste":{}}'::jsonb,
    p_state_before_hash   => encode(sha256('before'::bytea), 'hex'),
    p_state_after         => p_state_after,
    p_state_after_hash    => encode(sha256('after'::bytea), 'hex'),
    p_undo_of_sequence    => null,
    p_occurred_at         => now(),
    p_current_projection  => p_state_after,
    p_projection_version  => 1
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 1. Fresh create_attempt produces in_progress, rev 0, seq 0 (EXISTING-SQL-01)
-- ---------------------------------------------------------------------------
SELECT is(
  (pg_temp.make_attempt(
    'a0000001-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-000000000001'
  ) ->> 'outcome'),
  'committed',
  'create_attempt returns outcome committed on fresh creation'
);

SELECT results_eq(
  $$ SELECT status, revision, last_sequence FROM public.attempts WHERE id = 'a0000001-0000-4000-8000-000000000001' $$,
  $$ VALUES ('in_progress'::public.attempt_status, 0, 0) $$,
  'create_attempt opens in_progress attempt with revision 0 and last_sequence 0'
);

-- ---------------------------------------------------------------------------
-- 2. Idempotent retry of create_attempt (EXISTING-SQL-02)
-- ---------------------------------------------------------------------------
SELECT is(
  (pg_temp.make_attempt(
    'a0000001-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-000000000001'
  ) ->> 'outcome'),
  'idempotent_replay',
  'create_attempt retry returns outcome idempotent_replay'
);

SELECT is(
  (SELECT count(*)::integer FROM public.attempts WHERE id = 'a0000001-0000-4000-8000-000000000001'),
  1,
  'create_attempt retry produces no duplicate attempt row'
);

-- ---------------------------------------------------------------------------
-- 3. complete_attempt lifecycle transition and snapshot persistence
-- ---------------------------------------------------------------------------
-- Commit an event first on attempt 1
SELECT is(
  (pg_temp.commit_evt(
    'a0000001-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-000000000001',
    0,
    'c0000001-0000-4000-8000-000000000001',
    'fp-1'
  ) ->> 'outcome'),
  'committed',
  'Event commits successfully before complete_attempt'
);

-- Call complete_attempt
SELECT is(
  (public.complete_attempt(
    p_attempt_id          => 'a0000001-0000-4000-8000-000000000001',
    p_actor_user_id       => '11111111-1111-4111-8111-000000000001',
    p_scenario_release_id => 'acid-neutralization@1.0.0',
    p_expected_revision   => 1,
    p_action_id           => 'c0000001-0000-4000-8000-000000000002',
    p_request_fingerprint => 'fp-complete-1',
    p_input_payload       => '{"complete":true}'::jsonb,
    p_normalized_input    => '{"complete":true}'::jsonb,
    p_result_payload      => '{"score":100}'::jsonb,
    p_calculation_trace   => '[]'::jsonb,
    p_observations        => '[]'::jsonb,
    p_warnings            => '[]'::jsonb,
    p_resource_delta      => '{"reagents":{},"waterLiters":0,"operationCount":1,"relativeCostIndexDelta":null,"safetyPenalties":[],"secondaryWaste":{}}'::jsonb,
    p_state_before_hash   => encode(sha256('b4'::bytea), 'hex'),
    p_state_after         => '{"phase":"completed"}'::jsonb,
    p_state_after_hash    => encode(sha256('aft'::bytea), 'hex'),
    p_occurred_at         => now(),
    p_current_projection  => '{"phase":"completed"}'::jsonb,
    p_projection_version  => 1,
    p_final_report_snapshot => '{"grade":"A","score":100}'::jsonb
  ) ->> 'outcome'),
  'committed',
  'complete_attempt returns outcome committed'
);

SELECT results_eq(
  $$ SELECT status, (completed_at IS NOT NULL), final_report_snapshot
       FROM public.attempts WHERE id = 'a0000001-0000-4000-8000-000000000001' $$,
  $$ VALUES ('completed'::public.attempt_status, true, '{"grade":"A","score":100}'::jsonb) $$,
  'complete_attempt persists completed status, non-null completed_at, and final_report_snapshot'
);

-- ---------------------------------------------------------------------------
-- 4. Completed attempt rejects subsequent mutation
-- ---------------------------------------------------------------------------
SELECT results_eq(
  $$ SELECT
       pg_temp.commit_evt(
         'a0000001-0000-4000-8000-000000000001',
         '11111111-1111-4111-8111-000000000001',
         2,
         'c0000001-0000-4000-8000-000000000099',
         'fp-after-complete'
       ) ->> 'outcome',
       pg_temp.commit_evt(
         'a0000001-0000-4000-8000-000000000001',
         '11111111-1111-4111-8111-000000000001',
         2,
         'c0000001-0000-4000-8000-000000000099',
         'fp-after-complete'
       ) ->> 'reason' $$,
  $$ VALUES ('forbidden'::text, 'not_in_progress'::text) $$,
  'Completed attempt rejects subsequent commit with forbidden/not_in_progress'
);

-- ---------------------------------------------------------------------------
-- 5. stop_attempt lifecycle transition and subsequent mutation rejection
-- ---------------------------------------------------------------------------
-- Create Attempt 2
SELECT is(
  (pg_temp.make_attempt(
    'a0000001-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-000000000001'
  ) ->> 'outcome'),
  'committed',
  'Attempt 2 created for stop_attempt test'
);

-- Add one event to Attempt 2
SELECT is(
  (pg_temp.commit_evt(
    'a0000001-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-000000000001',
    0,
    'c0000001-0000-4000-8000-000000000003',
    'fp-stop-evt',
    '{"phase":"halfway"}'::jsonb
  ) ->> 'outcome'),
  'committed',
  'Event added to Attempt 2'
);

-- Stop Attempt 2
SELECT is(
  (public.stop_attempt(
    p_attempt_id          => 'a0000001-0000-4000-8000-000000000002',
    p_actor_user_id       => '11111111-1111-4111-8111-000000000001',
    p_scenario_release_id => 'acid-neutralization@1.0.0',
    p_expected_revision   => 1,
    p_action_id           => 'c0000001-0000-4000-8000-000000000004',
    p_request_fingerprint => 'fp-stop-action',
    p_action_type         => 'stopped',
    p_input_payload       => '{}'::jsonb,
    p_normalized_input    => '{}'::jsonb,
    p_result_payload      => '{}'::jsonb,
    p_calculation_trace   => '[]'::jsonb,
    p_observations        => '[]'::jsonb,
    p_warnings            => '[]'::jsonb,
    p_resource_delta      => '{"reagents":{},"waterLiters":0,"operationCount":1,"relativeCostIndexDelta":null,"safetyPenalties":[],"secondaryWaste":{}}'::jsonb,
    p_state_before_hash   => encode(sha256('b4'::bytea), 'hex'),
    p_state_after         => '{"phase":"stopped"}'::jsonb,
    p_state_after_hash    => encode(sha256('aft'::bytea), 'hex'),
    p_occurred_at         => now(),
    p_current_projection  => '{"phase":"stopped"}'::jsonb,
    p_projection_version  => 1
  ) ->> 'outcome'),
  'committed',
  'stop_attempt returns outcome committed'
);

SELECT results_eq(
  $$ SELECT status FROM public.attempts WHERE id = 'a0000001-0000-4000-8000-000000000002' $$,
  $$ VALUES ('stopped'::public.attempt_status) $$,
  'stop_attempt transitions attempt status to stopped'
);

-- Subsequent mutation on stopped attempt is rejected
SELECT results_eq(
  $$ SELECT
       pg_temp.commit_evt(
         'a0000001-0000-4000-8000-000000000002',
         '11111111-1111-4111-8111-000000000001',
         2,
         'c0000001-0000-4000-8000-000000000098',
         'fp-after-stop'
       ) ->> 'outcome',
       pg_temp.commit_evt(
         'a0000001-0000-4000-8000-000000000002',
         '11111111-1111-4111-8111-000000000001',
         2,
         'c0000001-0000-4000-8000-000000000098',
         'fp-after-stop'
       ) ->> 'reason' $$,
  $$ VALUES ('forbidden'::text, 'not_in_progress'::text) $$,
  'Stopped attempt rejects subsequent commit with forbidden/not_in_progress'
);

-- ---------------------------------------------------------------------------
-- 6. branch_attempt success copies parent provenance and snapshot
-- ---------------------------------------------------------------------------
SELECT is(
  (public.branch_attempt(
    p_attempt_id                 => 'a0000001-0000-4000-8000-000000000003',
    p_actor_user_id              => '11111111-1111-4111-8111-000000000001',
    p_parent_attempt_id          => 'a0000001-0000-4000-8000-000000000002',
    p_parent_sequence            => 1,
    p_scenario_release_id        => 'acid-neutralization@1.0.0',
    p_content_locale             => 'vi',
    p_current_state              => '{"phase":"halfway"}'::jsonb,
    p_current_projection         => '{"phase":"halfway"}'::jsonb,
    p_projection_version         => 1,
    p_branch_origin_snapshot     => '{"originSequence":1,"parentStatus":"stopped"}'::jsonb,
    p_inherited_timeline_snapshot => '[{"sequence":1,"actionType":"add_base"}]'::jsonb
  ) ->> 'outcome'),
  'committed',
  'branch_attempt returns outcome committed on valid branch'
);

SELECT results_eq(
  $$ SELECT status, revision, last_sequence, parent_attempt_id, parent_sequence,
            branch_origin_snapshot, current_state
       FROM public.attempts WHERE id = 'a0000001-0000-4000-8000-000000000003' $$,
  $$ VALUES (
       'in_progress'::public.attempt_status,
       0,
       0,
       'a0000001-0000-4000-8000-000000000002'::uuid,
       1,
       '{"originSequence":1,"parentStatus":"stopped"}'::jsonb,
       '{"phase":"halfway"}'::jsonb
     ) $$,
  'branch_attempt sets provenance, snapshots, rev 0, seq 0, and origin state_after'
);

-- Idempotent retry of branch_attempt
SELECT is(
  (public.branch_attempt(
    p_attempt_id                 => 'a0000001-0000-4000-8000-000000000003',
    p_actor_user_id              => '11111111-1111-4111-8111-000000000001',
    p_parent_attempt_id          => 'a0000001-0000-4000-8000-000000000002',
    p_parent_sequence            => 1,
    p_scenario_release_id        => 'acid-neutralization@1.0.0',
    p_content_locale             => 'vi',
    p_current_state              => '{"phase":"halfway"}'::jsonb,
    p_current_projection         => '{"phase":"halfway"}'::jsonb,
    p_projection_version         => 1,
    p_branch_origin_snapshot     => '{"originSequence":1,"parentStatus":"stopped"}'::jsonb,
    p_inherited_timeline_snapshot => '[{"sequence":1,"actionType":"add_base"}]'::jsonb
  ) ->> 'outcome'),
  'idempotent_replay',
  'branch_attempt retry returns outcome idempotent_replay'
);

-- ---------------------------------------------------------------------------
-- 7. branch_attempt rejection of invalid conditions
-- ---------------------------------------------------------------------------
-- 7a. Non-existent parent
SELECT is(
  (public.branch_attempt(
    p_attempt_id                 => 'a0000001-0000-4000-8000-000000000091',
    p_actor_user_id              => '11111111-1111-4111-8111-000000000001',
    p_parent_attempt_id          => 'ffffffff-ffff-4fff-8fff-ffffffffffff',
    p_parent_sequence            => 1,
    p_scenario_release_id        => 'acid-neutralization@1.0.0',
    p_content_locale             => 'vi',
    p_current_state              => '{"phase":"ready"}'::jsonb,
    p_current_projection         => '{"phase":"ready"}'::jsonb,
    p_projection_version         => 1,
    p_branch_origin_snapshot     => '{"origin":1}'::jsonb,
    p_inherited_timeline_snapshot => '[]'::jsonb
  ) ->> 'outcome'),
  'not_found',
  'branch_attempt rejects nonexistent parent with outcome not_found'
);

-- Create Bob's attempt (Attempt 4)
SELECT is(
  (pg_temp.make_attempt(
    'a0000001-0000-4000-8000-000000000004',
    '11111111-1111-4111-8111-000000000002'
  ) ->> 'outcome'),
  'committed',
  'Bob attempt 4 created'
);

-- Stop Bob's attempt so it is terminal
SELECT is(
  (public.stop_attempt(
    p_attempt_id          => 'a0000001-0000-4000-8000-000000000004',
    p_actor_user_id       => '11111111-1111-4111-8111-000000000002',
    p_scenario_release_id => 'acid-neutralization@1.0.0',
    p_expected_revision   => 0,
    p_action_id           => 'c0000001-0000-4000-8000-000000000044',
    p_request_fingerprint => 'fp-bob-stop',
    p_action_type         => 'stopped',
    p_input_payload       => '{}'::jsonb,
    p_normalized_input    => '{}'::jsonb,
    p_result_payload      => '{}'::jsonb,
    p_calculation_trace   => '[]'::jsonb,
    p_observations        => '[]'::jsonb,
    p_warnings            => '[]'::jsonb,
    p_resource_delta      => '{"reagents":{},"waterLiters":0,"operationCount":1,"relativeCostIndexDelta":null,"safetyPenalties":[],"secondaryWaste":{}}'::jsonb,
    p_state_before_hash   => encode(sha256('b4'::bytea), 'hex'),
    p_state_after         => '{"phase":"stopped"}'::jsonb,
    p_state_after_hash    => encode(sha256('aft'::bytea), 'hex'),
    p_occurred_at         => now(),
    p_current_projection  => '{"phase":"stopped"}'::jsonb,
    p_projection_version  => 1
  ) ->> 'outcome'),
  'committed',
  'Bob attempt 4 stopped'
);

-- 7b. Alice attempts to branch from Bob's attempt -> forbidden/not_owner
SELECT results_eq(
  $$ SELECT
       public.branch_attempt(
         'a0000001-0000-4000-8000-000000000092',
         '11111111-1111-4111-8111-000000000001',
         'a0000001-0000-4000-8000-000000000004',
         1,
         'acid-neutralization@1.0.0',
         'vi',
         '{"phase":"ready"}'::jsonb,
         '{"phase":"ready"}'::jsonb,
         1,
         '{"origin":1}'::jsonb,
         '[]'::jsonb
       ) ->> 'outcome',
       public.branch_attempt(
         'a0000001-0000-4000-8000-000000000092',
         '11111111-1111-4111-8111-000000000001',
         'a0000001-0000-4000-8000-000000000004',
         1,
         'acid-neutralization@1.0.0',
         'vi',
         '{"phase":"ready"}'::jsonb,
         '{"phase":"ready"}'::jsonb,
         1,
         '{"origin":1}'::jsonb,
         '[]'::jsonb
       ) ->> 'reason' $$,
  $$ VALUES ('forbidden'::text, 'not_owner'::text) $$,
  'branch_attempt rejects branching another owner attempt with forbidden/not_owner'
);

-- 7c. Release mismatch
SELECT results_eq(
  $$ SELECT
       public.branch_attempt(
         'a0000001-0000-4000-8000-000000000093',
         '11111111-1111-4111-8111-000000000001',
         'a0000001-0000-4000-8000-000000000002',
         1,
         'acid-neutralization@2.0.0',
         'vi',
         '{"phase":"ready"}'::jsonb,
         '{"phase":"ready"}'::jsonb,
         1,
         '{"origin":1}'::jsonb,
         '[]'::jsonb
       ) ->> 'outcome',
       public.branch_attempt(
         'a0000001-0000-4000-8000-000000000093',
         '11111111-1111-4111-8111-000000000001',
         'a0000001-0000-4000-8000-000000000002',
         1,
         'acid-neutralization@2.0.0',
         'vi',
         '{"phase":"ready"}'::jsonb,
         '{"phase":"ready"}'::jsonb,
         1,
         '{"origin":1}'::jsonb,
         '[]'::jsonb
       ) ->> 'reason' $$,
  $$ VALUES ('forbidden'::text, 'release_mismatch'::text) $$,
  'branch_attempt rejects release mismatch with forbidden/release_mismatch'
);

-- 7d. Parent in_progress (Attempt 7)
SELECT is(
  (pg_temp.make_attempt(
    'a0000001-0000-4000-8000-000000000007',
    '11111111-1111-4111-8111-000000000001'
  ) ->> 'outcome'),
  'committed',
  'Attempt 7 created in_progress'
);

SELECT results_eq(
  $$ SELECT
       public.branch_attempt(
         'a0000001-0000-4000-8000-000000000094',
         '11111111-1111-4111-8111-000000000001',
         'a0000001-0000-4000-8000-000000000007',
         1,
         'acid-neutralization@1.0.0',
         'vi',
         '{"phase":"ready"}'::jsonb,
         '{"phase":"ready"}'::jsonb,
         1,
         '{"origin":1}'::jsonb,
         '[]'::jsonb
       ) ->> 'outcome',
       public.branch_attempt(
         'a0000001-0000-4000-8000-000000000094',
         '11111111-1111-4111-8111-000000000001',
         'a0000001-0000-4000-8000-000000000007',
         1,
         'acid-neutralization@1.0.0',
         'vi',
         '{"phase":"ready"}'::jsonb,
         '{"phase":"ready"}'::jsonb,
         1,
         '{"origin":1}'::jsonb,
         '[]'::jsonb
       ) ->> 'reason' $$,
  $$ VALUES ('forbidden'::text, 'parent_not_terminal'::text) $$,
  'branch_attempt rejects branching non-terminal parent with forbidden/parent_not_terminal'
);

-- 7e. Parent sequence missing (sequence 99 on Attempt 2)
SELECT results_eq(
  $$ SELECT
       public.branch_attempt(
         'a0000001-0000-4000-8000-000000000095',
         '11111111-1111-4111-8111-000000000001',
         'a0000001-0000-4000-8000-000000000002',
         99,
         'acid-neutralization@1.0.0',
         'vi',
         '{"phase":"ready"}'::jsonb,
         '{"phase":"ready"}'::jsonb,
         1,
         '{"origin":1}'::jsonb,
         '[]'::jsonb
       ) ->> 'outcome',
       public.branch_attempt(
         'a0000001-0000-4000-8000-000000000095',
         '11111111-1111-4111-8111-000000000001',
         'a0000001-0000-4000-8000-000000000002',
         99,
         'acid-neutralization@1.0.0',
         'vi',
         '{"phase":"ready"}'::jsonb,
         '{"phase":"ready"}'::jsonb,
         1,
         '{"origin":1}'::jsonb,
         '[]'::jsonb
       ) ->> 'reason' $$,
  $$ VALUES ('not_found'::text, 'parent_sequence_missing'::text) $$,
  'branch_attempt rejects missing parent sequence with not_found/parent_sequence_missing'
);

-- ---------------------------------------------------------------------------
-- 8 & 9. delete_attempt rejection of non-owner & owner cascade effects
-- ---------------------------------------------------------------------------
-- Verify FK constraint actions according to schema
SELECT is(
  (SELECT confdeltype FROM pg_constraint WHERE conname = 'attempt_events_attempt_id_fkey'),
  'c',
  'attempt_events FK to attempts has ON DELETE CASCADE (confdeltype = c)'
);

SELECT is(
  (SELECT confdeltype FROM pg_constraint WHERE conname = 'attempts_parent_attempt_id_fkey'),
  'n',
  'attempts parent FK to attempts has ON DELETE SET NULL (confdeltype = n)'
);

-- Create Attempt 5 (Alice) with 1 event, then stop it
SELECT is(
  (pg_temp.make_attempt(
    'a0000001-0000-4000-8000-000000000005',
    '11111111-1111-4111-8111-000000000001'
  ) ->> 'outcome'),
  'committed',
  'Attempt 5 created for delete test'
);

SELECT is(
  (pg_temp.commit_evt(
    'a0000001-0000-4000-8000-000000000005',
    '11111111-1111-4111-8111-000000000001',
    0,
    'c0000001-0000-4000-8000-000000000055',
    'fp-del-evt'
  ) ->> 'outcome'),
  'committed',
  'Event added to Attempt 5'
);

-- Non-owner delete rejection
SELECT results_eq(
  $$ SELECT
       public.delete_attempt(
         'a0000001-0000-4000-8000-000000000005',
         '11111111-1111-4111-8111-000000000002'
       ) ->> 'outcome',
       public.delete_attempt(
         'a0000001-0000-4000-8000-000000000005',
         '11111111-1111-4111-8111-000000000002'
       ) ->> 'reason' $$,
  $$ VALUES ('forbidden'::text, 'not_owner'::text) $$,
  'delete_attempt rejects non-owner with forbidden/not_owner'
);

-- Owner delete success
SELECT is(
  (public.delete_attempt(
    'a0000001-0000-4000-8000-000000000005',
    '11111111-1111-4111-8111-000000000001' -- Alice
  ) ->> 'outcome'),
  'committed',
  'delete_attempt returns outcome committed on owner deletion'
);

-- Verify Attempt 5 row is deleted
SELECT is(
  (SELECT count(*)::integer FROM public.attempts WHERE id = 'a0000001-0000-4000-8000-000000000005'),
  0,
  'Attempt 5 row is completely removed'
);

-- Verify Attempt 5 events are cascade-deleted
SELECT is(
  (SELECT count(*)::integer FROM public.attempt_events WHERE attempt_id = 'a0000001-0000-4000-8000-000000000005'),
  0,
  'Attempt 5 events are cascaded and removed'
);

-- ---------------------------------------------------------------------------
-- 10 & 11. get_attempt owner & non-owner / nonexistent indistinguishability
-- ---------------------------------------------------------------------------
-- Owner get_attempt
SELECT is(
  (public.get_attempt(
    'a0000001-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-000000000001'
  ) ->> 'outcome'),
  'found',
  'get_attempt returns outcome found for owner'
);

-- Owner get_attempt with events
SELECT is(
  (jsonb_array_length(
    public.get_attempt(
      'a0000001-0000-4000-8000-000000000001',
      '11111111-1111-4111-8111-000000000001',
      true
    ) -> 'events'
  )),
  2,
  'get_attempt with include_events returns 2 events for Attempt 1'
);

-- Non-existent attempt returns not_found
SELECT is(
  (public.get_attempt(
    'ffffffff-ffff-4fff-8fff-ffffffffffff',
    '11111111-1111-4111-8111-000000000001'
  ) ->> 'outcome'),
  'not_found',
  'get_attempt returns not_found for nonexistent attempt'
);

-- Non-owner get_attempt returns not_found (indistinguishable to avoid confirming existence)
SELECT is(
  (public.get_attempt(
    'a0000001-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-000000000002' -- Bob querying Alice attempt
  ) ->> 'outcome'),
  'not_found',
  'get_attempt returns not_found for non-owner, hiding existence'
);

-- ---------------------------------------------------------------------------
-- 12. list_attempts owner scoping and filtering
-- ---------------------------------------------------------------------------
-- Scoped to owner (Bob has attempt 4)
SELECT is(
  (jsonb_array_length(
    public.list_attempts('11111111-1111-4111-8111-000000000002') -> 'attempts'
  )),
  1,
  'list_attempts for Bob returns exactly 1 attempt'
);

-- Filter by status: Bob has 1 stopped attempt
SELECT is(
  (jsonb_array_length(
    public.list_attempts(
      p_actor_user_id => '11111111-1111-4111-8111-000000000002',
      p_status        => 'stopped'::public.attempt_status
    ) -> 'attempts'
  )),
  1,
  'list_attempts for Bob with status stopped returns 1 attempt'
);

SELECT is(
  (jsonb_array_length(
    public.list_attempts(
      p_actor_user_id => '11111111-1111-4111-8111-000000000002',
      p_status        => 'in_progress'::public.attempt_status
    ) -> 'attempts'
  )),
  0,
  'list_attempts for Bob with status in_progress returns 0 attempts'
);

-- Filter by scenario_release_id for Alice
SELECT is(
  (jsonb_array_length(
    public.list_attempts(
      p_actor_user_id       => '11111111-1111-4111-8111-000000000001',
      p_scenario_release_id => 'acid-neutralization@9.9.9'
    ) -> 'attempts'
  )),
  0,
  'list_attempts for nonexistent release returns 0 attempts'
);

-- Pagination: limit 2
SELECT is(
  (jsonb_array_length(
    public.list_attempts(
      p_actor_user_id => '11111111-1111-4111-8111-000000000001',
      p_limit         => 2
    ) -> 'attempts'
  )),
  2,
  'list_attempts with limit 2 returns exactly 2 attempts'
);

SELECT * FROM finish();

ROLLBACK;
