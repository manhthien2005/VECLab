BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(30);

-- Fixtures: deterministic test users
INSERT INTO auth.users (id, email) VALUES
  ('22222222-2222-4222-8222-000000000001', 'alice.events@example.test'),
  ('22222222-2222-4222-8222-000000000002', 'bob.events@example.test')
ON CONFLICT (id) DO NOTHING;

-- Helper functions
CREATE OR REPLACE FUNCTION pg_temp.make_attempt(
  p_id uuid,
  p_user uuid
) RETURNS jsonb LANGUAGE plpgsql AS $$
BEGIN
  RETURN public.create_attempt(
    p_attempt_id          => p_id,
    p_actor_user_id       => p_user,
    p_scenario_key        => 'acid-neutralization',
    p_scenario_release_id => 'acid-neutralization@1.0.0',
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
  p_expected_revision integer,
  p_action_id uuid,
  p_fingerprint text,
  p_state_after jsonb DEFAULT '{"phase":"mixed"}'::jsonb
) RETURNS jsonb LANGUAGE plpgsql AS $$
BEGIN
  RETURN public.commit_attempt_event(
    p_attempt_id          => p_attempt_id,
    p_actor_user_id       => p_user_id,
    p_scenario_release_id => 'acid-neutralization@1.0.0',
    p_expected_revision   => p_expected_revision,
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

-- Setup Attempt A for Alice
SELECT is(
  (pg_temp.make_attempt(
    'b0000002-0000-4000-8000-000000000001',
    '22222222-2222-4222-8222-000000000001'
  ) ->> 'outcome'),
  'committed',
  'Attempt A created for Alice'
);

-- ---------------------------------------------------------------------------
-- 1. Valid first commit (EXISTING-SQL-03, EXISTING-SQL-10)
-- ---------------------------------------------------------------------------
SELECT is(
  (pg_temp.commit_evt(
    'b0000002-0000-4000-8000-000000000001',
    '22222222-2222-4222-8222-000000000001',
    0,
    'c0000002-0000-4000-8000-000000000001',
    'fp-alpha'
  ) ->> 'outcome'),
  'committed',
  'First event commit returns outcome committed'
);

-- Sequence equals 1 (EXISTING-SQL-10)
SELECT is(
  (SELECT sequence FROM public.attempt_events WHERE attempt_id = 'b0000002-0000-4000-8000-000000000001'),
  1,
  'First event sequence equals 1 (EXISTING-SQL-10)'
);

-- Revision and snapshot advance together (EXISTING-SQL-03)
SELECT results_eq(
  $$ SELECT revision, last_sequence FROM public.attempts WHERE id = 'b0000002-0000-4000-8000-000000000001' $$,
  $$ VALUES (1, 1) $$,
  'Attempt revision and last_sequence advance to 1 together (EXISTING-SQL-03)'
);

SELECT is(
  (SELECT count(*)::integer FROM public.attempt_events WHERE attempt_id = 'b0000002-0000-4000-8000-000000000001'),
  1,
  'Attempt has exactly 1 event committed'
);

-- Mutual consistency of state and sequence
SELECT results_eq(
  $$ SELECT a.last_sequence, a.revision, a.current_state, e.sequence, e.state_after
       FROM public.attempts a
       JOIN public.attempt_events e ON e.attempt_id = a.id
      WHERE a.id = 'b0000002-0000-4000-8000-000000000001' $$,
  $$ VALUES (1, 1, '{"phase":"mixed"}'::jsonb, 1, '{"phase":"mixed"}'::jsonb) $$,
  'Attempt and event remain mutually consistent in sequence, revision, and state'
);

-- ---------------------------------------------------------------------------
-- 2. Idempotent replay: identical action_id + request_fingerprint (EXISTING-SQL-04)
-- ---------------------------------------------------------------------------
SELECT is(
  (pg_temp.commit_evt(
    'b0000002-0000-4000-8000-000000000001',
    '22222222-2222-4222-8222-000000000001',
    0,
    'c0000002-0000-4000-8000-000000000001',
    'fp-alpha'
  ) ->> 'outcome'),
  'idempotent_replay',
  'Replay of identical action_id and fingerprint returns idempotent_replay (EXISTING-SQL-04)'
);

SELECT is(
  (SELECT count(*)::integer FROM public.attempt_events WHERE attempt_id = 'b0000002-0000-4000-8000-000000000001'),
  1,
  'Idempotent replay produces no duplicate event'
);

SELECT results_eq(
  $$ SELECT revision, last_sequence FROM public.attempts WHERE id = 'b0000002-0000-4000-8000-000000000001' $$,
  $$ VALUES (1, 1) $$,
  'Attempt revision and last_sequence remain unchanged after replay'
);

-- ---------------------------------------------------------------------------
-- 3. Idempotency conflict: same action_id, different request_fingerprint
-- ---------------------------------------------------------------------------
SELECT is(
  (pg_temp.commit_evt(
    'b0000002-0000-4000-8000-000000000001',
    '22222222-2222-4222-8222-000000000001',
    1,
    'c0000002-0000-4000-8000-000000000001',
    'fp-alpha-different'
  ) ->> 'outcome'),
  'idempotency_conflict',
  'Same action_id with different fingerprint returns outcome idempotency_conflict'
);

SELECT is(
  (SELECT count(*)::integer FROM public.attempt_events WHERE attempt_id = 'b0000002-0000-4000-8000-000000000001'),
  1,
  'Idempotency conflict appends no second event'
);

SELECT results_eq(
  $$ SELECT revision, last_sequence FROM public.attempts WHERE id = 'b0000002-0000-4000-8000-000000000001' $$,
  $$ VALUES (1, 1) $$,
  'Attempt revision and last_sequence remain unchanged after idempotency conflict'
);

-- ---------------------------------------------------------------------------
-- 4. Stale expected_revision rejection (EXISTING-SQL-05)
-- ---------------------------------------------------------------------------
SELECT is(
  (pg_temp.commit_evt(
    'b0000002-0000-4000-8000-000000000001',
    '22222222-2222-4222-8222-000000000001',
    0,
    'c0000002-0000-4000-8000-000000000002',
    'fp-beta'
  ) ->> 'outcome'),
  'revision_conflict',
  'Stale expected_revision returns outcome revision_conflict (EXISTING-SQL-05)'
);

SELECT is(
  (pg_temp.commit_evt(
    'b0000002-0000-4000-8000-000000000001',
    '22222222-2222-4222-8222-000000000001',
    0,
    'c0000002-0000-4000-8000-000000000002',
    'fp-beta'
  ) ->> 'currentRevision'),
  '1',
  'Revision conflict payload includes currentRevision 1'
);

SELECT is(
  (SELECT count(*)::integer FROM public.attempt_events WHERE attempt_id = 'b0000002-0000-4000-8000-000000000001'),
  1,
  'Stale revision writes no event'
);

SELECT results_eq(
  $$ SELECT revision, last_sequence FROM public.attempts WHERE id = 'b0000002-0000-4000-8000-000000000001' $$,
  $$ VALUES (1, 1) $$,
  'Attempt revision and last_sequence stay unchanged on stale revision rejection'
);

-- ---------------------------------------------------------------------------
-- 5. Non-owner commit rejection (EXISTING-SQL-06)
-- ---------------------------------------------------------------------------
SELECT is(
  (pg_temp.commit_evt(
    'b0000002-0000-4000-8000-000000000001',
    '22222222-2222-4222-8222-000000000002',
    1,
    'c0000002-0000-4000-8000-000000000003',
    'fp-gamma'
  ) ->> 'outcome'),
  'forbidden',
  'Non-owner commit returns outcome forbidden (EXISTING-SQL-06)'
);

SELECT is(
  (pg_temp.commit_evt(
    'b0000002-0000-4000-8000-000000000001',
    '22222222-2222-4222-8222-000000000002',
    1,
    'c0000002-0000-4000-8000-000000000003',
    'fp-gamma'
  ) ->> 'reason'),
  'not_owner',
  'Non-owner commit returns reason not_owner (EXISTING-SQL-06)'
);

SELECT is(
  (SELECT count(*)::integer FROM public.attempt_events
    WHERE attempt_id = 'b0000002-0000-4000-8000-000000000001'
      AND request_fingerprint = 'fp-gamma'),
  0,
  'Non-owner commit writes no event'
);

SELECT results_eq(
  $$ SELECT revision, last_sequence FROM public.attempts WHERE id = 'b0000002-0000-4000-8000-000000000001' $$,
  $$ VALUES (1, 1) $$,
  'Attempt revision and last_sequence stay unchanged on non-owner rejection'
);

-- ---------------------------------------------------------------------------
-- 6. Independent revision and sequence progression between attempts (EXISTING-SQL-11)
-- ---------------------------------------------------------------------------
-- Setup Attempt B for Bob
SELECT is(
  (pg_temp.make_attempt(
    'b0000002-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-000000000002'
  ) ->> 'outcome'),
  'committed',
  'Attempt B created for Bob'
);

-- First commit on Bob's attempt: sequence starts at 1 (EXISTING-SQL-10)
SELECT is(
  (pg_temp.commit_evt(
    'b0000002-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-000000000002',
    0,
    'c0000002-0000-4000-8000-000000000004',
    'fp-delta'
  ) ->> 'sequence'),
  '1',
  'First event sequence for Bob attempt starts at 1 (EXISTING-SQL-10)'
);

SELECT results_eq(
  $$ SELECT revision, last_sequence FROM public.attempts WHERE id = 'b0000002-0000-4000-8000-000000000002' $$,
  $$ VALUES (1, 1) $$,
  'Bob attempt is at revision 1 and last_sequence 1'
);

-- Alice attempt is unaffected
SELECT results_eq(
  $$ SELECT revision, last_sequence FROM public.attempts WHERE id = 'b0000002-0000-4000-8000-000000000001' $$,
  $$ VALUES (1, 1) $$,
  'Alice attempt revision and last_sequence unaffected by Bob commit'
);

SELECT is(
  (SELECT count(*)::integer FROM public.attempt_events WHERE attempt_id = 'b0000002-0000-4000-8000-000000000001'),
  1,
  'Alice event count unaffected by Bob commit'
);

-- Second commit on Bob's attempt: sequence advances to 2
SELECT is(
  (pg_temp.commit_evt(
    'b0000002-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-000000000002',
    1,
    'c0000002-0000-4000-8000-000000000005',
    'fp-epsilon',
    '{"phase":"titrated"}'::jsonb
  ) ->> 'sequence'),
  '2',
  'Second event sequence for Bob attempt advances to 2'
);

SELECT results_eq(
  $$ SELECT revision, last_sequence FROM public.attempts WHERE id = 'b0000002-0000-4000-8000-000000000002' $$,
  $$ VALUES (2, 2) $$,
  'Bob attempt advances to revision 2 and last_sequence 2 (EXISTING-SQL-11)'
);

-- Alice attempt remains unaffected
SELECT results_eq(
  $$ SELECT revision, last_sequence FROM public.attempts WHERE id = 'b0000002-0000-4000-8000-000000000001' $$,
  $$ VALUES (1, 1) $$,
  'Alice attempt stays at revision 1 after Bob second commit (EXISTING-SQL-11)'
);

SELECT is(
  (SELECT count(*)::integer FROM public.attempt_events WHERE attempt_id = 'b0000002-0000-4000-8000-000000000001'),
  1,
  'Alice event count stays at 1 after Bob second commit (EXISTING-SQL-11)'
);

-- Mutual consistency on Bob's second commit
SELECT results_eq(
  $$ SELECT a.last_sequence, a.revision, a.current_state, e.sequence, e.state_after
       FROM public.attempts a
       JOIN public.attempt_events e ON e.attempt_id = a.id AND e.sequence = 2
      WHERE a.id = 'b0000002-0000-4000-8000-000000000002' $$,
  $$ VALUES (2, 2, '{"phase":"titrated"}'::jsonb, 2, '{"phase":"titrated"}'::jsonb) $$,
  'Bob attempt and event 2 remain mutually consistent in sequence, revision, and state'
);

SELECT * FROM finish();

ROLLBACK;
