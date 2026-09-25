BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(75);

-- ---------------------------------------------------------------------------
-- 1. Catalog assertions: RLS enabled on all three tables
-- ---------------------------------------------------------------------------
SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.profiles'::regclass),
  true,
  'Table public.profiles has RLS enabled'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.attempts'::regclass),
  true,
  'Table public.attempts has RLS enabled'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.attempt_events'::regclass),
  true,
  'Table public.attempt_events has RLS enabled'
);

-- ---------------------------------------------------------------------------
-- 2. Table privileges: authenticated has SELECT only
-- ---------------------------------------------------------------------------
SELECT table_privs_are('public', 'attempts', 'authenticated', ARRAY['SELECT']);
SELECT table_privs_are('public', 'attempt_events', 'authenticated', ARRAY['SELECT']);
SELECT table_privs_are('public', 'profiles', 'authenticated', ARRAY['SELECT']);

-- Explicit checks that authenticated lacks INSERT, UPDATE, DELETE
SELECT ok(NOT has_table_privilege('authenticated', 'public.attempts', 'INSERT'), 'authenticated lacks INSERT on attempts');
SELECT ok(NOT has_table_privilege('authenticated', 'public.attempts', 'UPDATE'), 'authenticated lacks UPDATE on attempts (EXISTING-SQL-09)');
SELECT ok(NOT has_table_privilege('authenticated', 'public.attempts', 'DELETE'), 'authenticated lacks DELETE on attempts');

SELECT ok(NOT has_table_privilege('authenticated', 'public.attempt_events', 'INSERT'), 'authenticated lacks INSERT on attempt_events');
SELECT ok(NOT has_table_privilege('authenticated', 'public.attempt_events', 'UPDATE'), 'authenticated lacks UPDATE on attempt_events');
SELECT ok(NOT has_table_privilege('authenticated', 'public.attempt_events', 'DELETE'), 'authenticated lacks DELETE on attempt_events');

SELECT ok(NOT has_table_privilege('authenticated', 'public.profiles', 'INSERT'), 'authenticated lacks INSERT on profiles');
SELECT ok(NOT has_table_privilege('authenticated', 'public.profiles', 'UPDATE'), 'authenticated lacks UPDATE on profiles');
SELECT ok(NOT has_table_privilege('authenticated', 'public.profiles', 'DELETE'), 'authenticated lacks DELETE on profiles');

-- ---------------------------------------------------------------------------
-- 3. Table privileges: anon has NO rights on user data (EXISTING-SQL-08)
-- ---------------------------------------------------------------------------
SELECT table_privs_are('public', 'attempts', 'anon', ARRAY[]::name[]);
SELECT table_privs_are('public', 'attempt_events', 'anon', ARRAY[]::name[]);
SELECT table_privs_are('public', 'profiles', 'anon', ARRAY[]::name[]);

SELECT ok(NOT has_table_privilege('anon', 'public.attempts', 'SELECT'), 'anon lacks SELECT on attempts (EXISTING-SQL-08)');
SELECT ok(NOT has_table_privilege('anon', 'public.attempts', 'INSERT'), 'anon lacks INSERT on attempts');
SELECT ok(NOT has_table_privilege('anon', 'public.attempts', 'UPDATE'), 'anon lacks UPDATE on attempts');
SELECT ok(NOT has_table_privilege('anon', 'public.attempts', 'DELETE'), 'anon lacks DELETE on attempts');

SELECT ok(NOT has_table_privilege('anon', 'public.attempt_events', 'SELECT'), 'anon lacks SELECT on attempt_events');
SELECT ok(NOT has_table_privilege('anon', 'public.attempt_events', 'INSERT'), 'anon lacks INSERT on attempt_events');
SELECT ok(NOT has_table_privilege('anon', 'public.attempt_events', 'UPDATE'), 'anon lacks UPDATE on attempt_events');
SELECT ok(NOT has_table_privilege('anon', 'public.attempt_events', 'DELETE'), 'anon lacks DELETE on attempt_events');

-- ---------------------------------------------------------------------------
-- 4. Server-only RPC EXECUTE revocations from anon & authenticated
-- ---------------------------------------------------------------------------
-- commit_attempt_event
SELECT ok(NOT has_function_privilege('anon', 'public.commit_attempt_event(uuid,uuid,text,integer,uuid,text,public.attempt_event_kind,text,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,text,jsonb,text,integer,timestamptz,jsonb,integer)', 'EXECUTE'), 'anon cannot EXECUTE commit_attempt_event');
SELECT ok(NOT has_function_privilege('authenticated', 'public.commit_attempt_event(uuid,uuid,text,integer,uuid,text,public.attempt_event_kind,text,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,text,jsonb,text,integer,timestamptz,jsonb,integer)', 'EXECUTE'), 'authenticated cannot EXECUTE commit_attempt_event');

-- create_attempt
SELECT ok(NOT has_function_privilege('anon', 'public.create_attempt(uuid,uuid,text,text,text,jsonb,jsonb,integer)', 'EXECUTE'), 'anon cannot EXECUTE create_attempt');
SELECT ok(NOT has_function_privilege('authenticated', 'public.create_attempt(uuid,uuid,text,text,text,jsonb,jsonb,integer)', 'EXECUTE'), 'authenticated cannot EXECUTE create_attempt');

-- complete_attempt
SELECT ok(NOT has_function_privilege('anon', 'public.complete_attempt(uuid,uuid,text,integer,uuid,text,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,text,jsonb,text,timestamptz,jsonb,integer,jsonb)', 'EXECUTE'), 'anon cannot EXECUTE complete_attempt');
SELECT ok(NOT has_function_privilege('authenticated', 'public.complete_attempt(uuid,uuid,text,integer,uuid,text,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,text,jsonb,text,timestamptz,jsonb,integer,jsonb)', 'EXECUTE'), 'authenticated cannot EXECUTE complete_attempt');

-- stop_attempt
SELECT ok(NOT has_function_privilege('anon', 'public.stop_attempt(uuid,uuid,text,integer,uuid,text,text,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,text,jsonb,text,timestamptz,jsonb,integer)', 'EXECUTE'), 'anon cannot EXECUTE stop_attempt');
SELECT ok(NOT has_function_privilege('authenticated', 'public.stop_attempt(uuid,uuid,text,integer,uuid,text,text,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,text,jsonb,text,timestamptz,jsonb,integer)', 'EXECUTE'), 'authenticated cannot EXECUTE stop_attempt');

-- branch_attempt
SELECT ok(NOT has_function_privilege('anon', 'public.branch_attempt(uuid,uuid,uuid,integer,text,text,jsonb,jsonb,integer,jsonb,jsonb)', 'EXECUTE'), 'anon cannot EXECUTE branch_attempt');
SELECT ok(NOT has_function_privilege('authenticated', 'public.branch_attempt(uuid,uuid,uuid,integer,text,text,jsonb,jsonb,integer,jsonb,jsonb)', 'EXECUTE'), 'authenticated cannot EXECUTE branch_attempt');

-- delete_attempt
SELECT ok(NOT has_function_privilege('anon', 'public.delete_attempt(uuid,uuid)', 'EXECUTE'), 'anon cannot EXECUTE delete_attempt');
SELECT ok(NOT has_function_privilege('authenticated', 'public.delete_attempt(uuid,uuid)', 'EXECUTE'), 'authenticated cannot EXECUTE delete_attempt');

-- get_attempt
SELECT ok(NOT has_function_privilege('anon', 'public.get_attempt(uuid,uuid,boolean)', 'EXECUTE'), 'anon cannot EXECUTE get_attempt');
SELECT ok(NOT has_function_privilege('authenticated', 'public.get_attempt(uuid,uuid,boolean)', 'EXECUTE'), 'authenticated cannot EXECUTE get_attempt');

-- list_attempts
SELECT ok(NOT has_function_privilege('anon', 'public.list_attempts(uuid,text,public.attempt_status,integer,integer)', 'EXECUTE'), 'anon cannot EXECUTE list_attempts');
SELECT ok(NOT has_function_privilege('authenticated', 'public.list_attempts(uuid,text,public.attempt_status,integer,integer)', 'EXECUTE'), 'authenticated cannot EXECUTE list_attempts');

-- veclab_max_attempt_events
SELECT ok(NOT has_function_privilege('anon', 'public.veclab_max_attempt_events()', 'EXECUTE'), 'anon cannot EXECUTE veclab_max_attempt_events');
SELECT ok(NOT has_function_privilege('authenticated', 'public.veclab_max_attempt_events()', 'EXECUTE'), 'authenticated cannot EXECUTE veclab_max_attempt_events');

-- ---------------------------------------------------------------------------
-- 5. Server-only RPC EXECUTE grants to service_role & veclab_server
-- ---------------------------------------------------------------------------
SELECT ok(has_function_privilege('service_role', 'public.commit_attempt_event(uuid,uuid,text,integer,uuid,text,public.attempt_event_kind,text,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,text,jsonb,text,integer,timestamptz,jsonb,integer)', 'EXECUTE'), 'service_role can EXECUTE commit_attempt_event');
SELECT ok(has_function_privilege('veclab_server', 'public.commit_attempt_event(uuid,uuid,text,integer,uuid,text,public.attempt_event_kind,text,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,text,jsonb,text,integer,timestamptz,jsonb,integer)', 'EXECUTE'), 'veclab_server can EXECUTE commit_attempt_event');

SELECT ok(has_function_privilege('service_role', 'public.create_attempt(uuid,uuid,text,text,text,jsonb,jsonb,integer)', 'EXECUTE'), 'service_role can EXECUTE create_attempt');
SELECT ok(has_function_privilege('veclab_server', 'public.create_attempt(uuid,uuid,text,text,text,jsonb,jsonb,integer)', 'EXECUTE'), 'veclab_server can EXECUTE create_attempt');

SELECT ok(has_function_privilege('service_role', 'public.complete_attempt(uuid,uuid,text,integer,uuid,text,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,text,jsonb,text,timestamptz,jsonb,integer,jsonb)', 'EXECUTE'), 'service_role can EXECUTE complete_attempt');
SELECT ok(has_function_privilege('veclab_server', 'public.complete_attempt(uuid,uuid,text,integer,uuid,text,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,text,jsonb,text,timestamptz,jsonb,integer,jsonb)', 'EXECUTE'), 'veclab_server can EXECUTE complete_attempt');

SELECT ok(has_function_privilege('service_role', 'public.stop_attempt(uuid,uuid,text,integer,uuid,text,text,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,text,jsonb,text,timestamptz,jsonb,integer)', 'EXECUTE'), 'service_role can EXECUTE stop_attempt');
SELECT ok(has_function_privilege('veclab_server', 'public.stop_attempt(uuid,uuid,text,integer,uuid,text,text,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,text,jsonb,text,timestamptz,jsonb,integer)', 'EXECUTE'), 'veclab_server can EXECUTE stop_attempt');

SELECT ok(has_function_privilege('service_role', 'public.branch_attempt(uuid,uuid,uuid,integer,text,text,jsonb,jsonb,integer,jsonb,jsonb)', 'EXECUTE'), 'service_role can EXECUTE branch_attempt');
SELECT ok(has_function_privilege('veclab_server', 'public.branch_attempt(uuid,uuid,uuid,integer,text,text,jsonb,jsonb,integer,jsonb,jsonb)', 'EXECUTE'), 'veclab_server can EXECUTE branch_attempt');

SELECT ok(has_function_privilege('service_role', 'public.delete_attempt(uuid,uuid)', 'EXECUTE'), 'service_role can EXECUTE delete_attempt');
SELECT ok(has_function_privilege('veclab_server', 'public.delete_attempt(uuid,uuid)', 'EXECUTE'), 'veclab_server can EXECUTE delete_attempt');

SELECT ok(has_function_privilege('service_role', 'public.get_attempt(uuid,uuid,boolean)', 'EXECUTE'), 'service_role can EXECUTE get_attempt');
SELECT ok(has_function_privilege('veclab_server', 'public.get_attempt(uuid,uuid,boolean)', 'EXECUTE'), 'veclab_server can EXECUTE get_attempt');

SELECT ok(has_function_privilege('service_role', 'public.list_attempts(uuid,text,public.attempt_status,integer,integer)', 'EXECUTE'), 'service_role can EXECUTE list_attempts');
SELECT ok(has_function_privilege('veclab_server', 'public.list_attempts(uuid,text,public.attempt_status,integer,integer)', 'EXECUTE'), 'veclab_server can EXECUTE list_attempts');

-- R5C-04: Positive EXECUTE grants on veclab_max_attempt_events helper
SELECT ok(has_function_privilege('service_role', 'public.veclab_max_attempt_events()', 'EXECUTE'), 'service_role can EXECUTE veclab_max_attempt_events');
SELECT ok(has_function_privilege('veclab_server', 'public.veclab_max_attempt_events()', 'EXECUTE'), 'veclab_server can EXECUTE veclab_max_attempt_events');

-- ---------------------------------------------------------------------------
-- 6. Runtime RLS simulation (EXISTING-SQL-07, EXISTING-SQL-08, profiles RLS)
-- ---------------------------------------------------------------------------
-- Insert test users and attempts under postgres
INSERT INTO auth.users (id, email) VALUES
  ('33333333-3333-4333-8333-000000000001', 'alice.rls@example.test'),
  ('33333333-3333-4333-8333-000000000002', 'bob.rls@example.test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (user_id, display_name, locale) VALUES
  ('33333333-3333-4333-8333-000000000001', 'Alice RLS', 'vi'),
  ('33333333-3333-4333-8333-000000000002', 'Bob RLS', 'vi')
ON CONFLICT (user_id) DO NOTHING;

-- Alice's attempt and event
INSERT INTO public.attempts (
  id, user_id, scenario_key, scenario_release_id, content_locale, status,
  revision, last_sequence, initial_state, current_state, current_projection,
  projection_version
) VALUES (
  'b0000003-0000-4000-8000-000000000001', '33333333-3333-4333-8333-000000000001',
  'acid-neutralization', 'acid-neutralization@1.0.0', 'vi', 'in_progress',
  1, 1, '{"phase":"ready"}', '{"phase":"mixed"}', '{"phase":"mixed"}', 1
);

INSERT INTO public.attempt_events (
  id, attempt_id, action_id, request_fingerprint, sequence, event_kind,
  action_type, input_payload, normalized_input, result_payload, calculation_trace,
  observations, warnings, resource_delta, state_before_hash, state_after,
  state_after_hash, occurred_at
) VALUES (
  'c0000003-0000-4000-8000-000000000001', 'b0000003-0000-4000-8000-000000000001',
  'c0000003-0000-4000-8000-000000000002', 'fp-alice-rls', 1, 'domain_action',
  'add_base', '{}', '{}', '{}', '[]', '[]', '[]', '{}', 'h1', '{}', 'h2', now()
);

-- Bob's attempt and event
INSERT INTO public.attempts (
  id, user_id, scenario_key, scenario_release_id, content_locale, status,
  revision, last_sequence, initial_state, current_state, current_projection,
  projection_version
) VALUES (
  'b0000003-0000-4000-8000-000000000002', '33333333-3333-4333-8333-000000000002',
  'acid-neutralization', 'acid-neutralization@1.0.0', 'vi', 'in_progress',
  1, 1, '{"phase":"ready"}', '{"phase":"mixed"}', '{"phase":"mixed"}', 1
);

INSERT INTO public.attempt_events (
  id, attempt_id, action_id, request_fingerprint, sequence, event_kind,
  action_type, input_payload, normalized_input, result_payload, calculation_trace,
  observations, warnings, resource_delta, state_before_hash, state_after,
  state_after_hash, occurred_at
) VALUES (
  'c0000003-0000-4000-8000-000000000003', 'b0000003-0000-4000-8000-000000000002',
  'c0000003-0000-4000-8000-000000000004', 'fp-bob-rls', 1, 'domain_action',
  'add_base', '{}', '{}', '{}', '[]', '[]', '[]', '{}', 'h1', '{}', 'h2', now()
);

-- Impersonate anon
SET LOCAL ROLE anon;
SELECT throws_ok(
  'SELECT count(*) FROM public.attempts',
  '42501',
  NULL,
  'anon cannot read attempts table (EXISTING-SQL-08)'
);
SELECT throws_ok(
  'SELECT count(*) FROM public.attempt_events',
  '42501',
  NULL,
  'anon cannot read attempt_events table'
);
SELECT throws_ok(
  'SELECT count(*) FROM public.profiles',
  '42501',
  NULL,
  'anon cannot read profiles table'
);
RESET ROLE;

-- Impersonate Bob as authenticated
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"33333333-3333-4333-8333-000000000002","role":"authenticated"}';

-- Bob sees his own attempt (EXISTING-SQL-07)
SELECT is(
  (SELECT count(*)::integer FROM public.attempts WHERE id = 'b0000003-0000-4000-8000-000000000002'),
  1,
  'Bob sees own attempt under RLS (EXISTING-SQL-07)'
);

-- Bob sees his own attempt events
SELECT is(
  (SELECT count(*)::integer FROM public.attempt_events WHERE attempt_id = 'b0000003-0000-4000-8000-000000000002'),
  1,
  'Bob sees own attempt events under RLS'
);

-- Bob cannot see Alice's attempt (EXISTING-SQL-07)
SELECT is(
  (SELECT count(*)::integer FROM public.attempts WHERE id = 'b0000003-0000-4000-8000-000000000001'),
  0,
  'Bob cannot see Alice attempt under RLS (EXISTING-SQL-07)'
);

-- Bob cannot see Alice's attempt events (EXISTING-SQL-07)
SELECT is(
  (SELECT count(*)::integer FROM public.attempt_events WHERE attempt_id = 'b0000003-0000-4000-8000-000000000001'),
  0,
  'Bob cannot see Alice attempt events under RLS (EXISTING-SQL-07)'
);

-- Profiles own-row RLS
SELECT is(
  (SELECT count(*)::integer FROM public.profiles WHERE user_id = '33333333-3333-4333-8333-000000000002'),
  1,
  'Bob sees own profile under RLS'
);

SELECT is(
  (SELECT count(*)::integer FROM public.profiles WHERE user_id = '33333333-3333-4333-8333-000000000001'),
  0,
  'Bob cannot see Alice profile under RLS'
);

-- Direct write rejections under authenticated
SELECT throws_ok(
  $$ UPDATE public.attempts SET revision = 99 WHERE id = 'b0000003-0000-4000-8000-000000000002' $$,
  '42501',
  NULL,
  'Direct UPDATE on attempts rejected under authenticated role'
);

SELECT throws_ok(
  $$ INSERT INTO public.attempts (id, user_id, scenario_key, scenario_release_id, initial_state, current_state, current_projection, projection_version)
     VALUES ('b0000003-0000-4000-8000-000000000099', '33333333-3333-4333-8333-000000000002', 'acid-neutralization', 'acid-neutralization@1.0.0', '{}', '{}', '{}', 1) $$,
  '42501',
  NULL,
  'Direct INSERT on attempts rejected under authenticated role'
);

SELECT throws_ok(
  $$ DELETE FROM public.attempts WHERE id = 'b0000003-0000-4000-8000-000000000002' $$,
  '42501',
  NULL,
  'Direct DELETE on attempts rejected under authenticated role'
);

SELECT throws_ok(
  $$ UPDATE public.profiles SET display_name = 'Hacked' WHERE user_id = '33333333-3333-4333-8333-000000000002' $$,
  '42501',
  NULL,
  'Direct UPDATE on profiles rejected under authenticated role'
);

RESET ROLE;

SELECT * FROM finish();

ROLLBACK;
