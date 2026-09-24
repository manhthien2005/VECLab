BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(11);

-- Fixtures: deterministic test users
INSERT INTO auth.users (id, email) VALUES
  ('44444444-4444-4444-8444-000000000001', 'alice.immutability@example.test'),
  ('44444444-4444-4444-8444-000000000002', 'bob.immutability@example.test')
ON CONFLICT (id) DO NOTHING;

-- In-progress Attempt 1
INSERT INTO public.attempts (
  id, user_id, scenario_key, scenario_release_id, content_locale, status,
  revision, last_sequence, initial_state, current_state, current_projection,
  projection_version, created_at, updated_at
) VALUES (
  'd0000004-0000-4000-8000-000000000001', '44444444-4444-4444-8444-000000000001',
  'acid-neutralization', 'acid-neutralization@1.0.0', 'vi', 'in_progress',
  0, 0, '{"phase":"ready"}'::jsonb, '{"phase":"ready"}'::jsonb, '{"phase":"ready"}'::jsonb,
  1, now(), now()
);

-- Completed Attempt 2
INSERT INTO public.attempts (
  id, user_id, scenario_key, scenario_release_id, content_locale, status,
  revision, last_sequence, initial_state, current_state, current_projection,
  projection_version, final_report_snapshot, completed_at, created_at, updated_at
) VALUES (
  'd0000004-0000-4000-8000-000000000002', '44444444-4444-4444-8444-000000000001',
  'acid-neutralization', 'acid-neutralization@1.0.0', 'vi', 'completed',
  2, 2, '{"phase":"ready"}'::jsonb, '{"phase":"done"}'::jsonb, '{"phase":"done"}'::jsonb,
  1, '{"grade":"A","score":100}'::jsonb, now(), now(), now()
);

-- ---------------------------------------------------------------------------
-- 1. attempts_immutability_guard blocks changing user_id (owner)
-- ---------------------------------------------------------------------------
SELECT throws_ok(
  $$ UPDATE public.attempts
        SET user_id = '44444444-4444-4444-8444-000000000002'
      WHERE id = 'd0000004-0000-4000-8000-000000000001' $$,
  '42501',
  NULL,
  'attempts_immutability_guard blocks changing user_id on existing attempt'
);

-- ---------------------------------------------------------------------------
-- 2. attempts_immutability_guard blocks changing scenario_key
-- ---------------------------------------------------------------------------
SELECT throws_ok(
  $$ UPDATE public.attempts
        SET scenario_key = 'different-key'
      WHERE id = 'd0000004-0000-4000-8000-000000000001' $$,
  '42501',
  NULL,
  'attempts_immutability_guard blocks changing scenario_key on existing attempt'
);

-- ---------------------------------------------------------------------------
-- 3. attempts_immutability_guard blocks changing scenario_release_id
-- ---------------------------------------------------------------------------
SELECT throws_ok(
  $$ UPDATE public.attempts
        SET scenario_release_id = 'acid-neutralization@2.0.0'
      WHERE id = 'd0000004-0000-4000-8000-000000000001' $$,
  '42501',
  NULL,
  'attempts_immutability_guard blocks changing scenario_release_id on existing attempt'
);

-- ---------------------------------------------------------------------------
-- 4. attempts_immutability_guard blocks changing initial_state
-- ---------------------------------------------------------------------------
SELECT throws_ok(
  $$ UPDATE public.attempts
        SET initial_state = '{"phase":"tampered"}'::jsonb
      WHERE id = 'd0000004-0000-4000-8000-000000000001' $$,
  '42501',
  NULL,
  'attempts_immutability_guard blocks changing initial_state on existing attempt'
);

-- ---------------------------------------------------------------------------
-- 5. attempts_immutability_guard blocks overwriting final_report_snapshot
-- ---------------------------------------------------------------------------
SELECT throws_ok(
  $$ UPDATE public.attempts
        SET final_report_snapshot = '{"grade":"F","score":0}'::jsonb
      WHERE id = 'd0000004-0000-4000-8000-000000000002' $$,
  '42501',
  NULL,
  'attempts_immutability_guard blocks overwriting final_report_snapshot once written'
);

-- ---------------------------------------------------------------------------
-- 6. Completed attempt blocks prohibited field mutations (status, current_state,
--    current_projection, revision, last_sequence)
-- ---------------------------------------------------------------------------
-- 6a. Block status mutation
SELECT throws_ok(
  $$ UPDATE public.attempts
        SET status = 'stopped'
      WHERE id = 'd0000004-0000-4000-8000-000000000002' $$,
  '55000',
  NULL,
  'Completed attempt blocks status mutation'
);

-- 6b. Block current_state mutation
SELECT throws_ok(
  $$ UPDATE public.attempts
        SET current_state = '{"phase":"altered"}'::jsonb
      WHERE id = 'd0000004-0000-4000-8000-000000000002' $$,
  '55000',
  NULL,
  'Completed attempt blocks current_state mutation'
);

-- 6c. Block current_projection mutation
SELECT throws_ok(
  $$ UPDATE public.attempts
        SET current_projection = '{"phase":"altered"}'::jsonb
      WHERE id = 'd0000004-0000-4000-8000-000000000002' $$,
  '55000',
  NULL,
  'Completed attempt blocks current_projection mutation'
);

-- 6d. Block revision mutation
SELECT throws_ok(
  $$ UPDATE public.attempts
        SET revision = 99
      WHERE id = 'd0000004-0000-4000-8000-000000000002' $$,
  '55000',
  NULL,
  'Completed attempt blocks revision mutation'
);

-- 6e. Block last_sequence mutation
SELECT throws_ok(
  $$ UPDATE public.attempts
        SET last_sequence = 99
      WHERE id = 'd0000004-0000-4000-8000-000000000002' $$,
  '55000',
  NULL,
  'Completed attempt blocks last_sequence mutation'
);

-- ---------------------------------------------------------------------------
-- 7. Allowed mutations on in_progress attempt still succeed
-- ---------------------------------------------------------------------------
SELECT lives_ok(
  $$ UPDATE public.attempts
        SET updated_at = now()
      WHERE id = 'd0000004-0000-4000-8000-000000000001' $$,
  'Allowed field update on in_progress attempt succeeds'
);

SELECT * FROM finish();

ROLLBACK;
