-- Behavioral validation of the attempt lifecycle RPCs against real PostgreSQL.
--
-- NOT part of the shipped migrations. Applying a migration cleanly proves only
-- that it parses; the guarantees this project depends on are behavioral
-- (docs/data-and-state-model.md §12, docs/system-architecture.md §5.1):
--
--   * a duplicate request fingerprint must NOT create a second event
--   * a stale expected_revision must be rejected, not applied
--   * one learner must not read another learner's attempt (RLS)
--   * `anon` must have no rights on user data
--   * an event and its snapshot advance must commit atomically
--
-- Run after the migrations:
--   psql -v ON_ERROR_STOP=1 -f tests/sql/00_auth_stub.sql
--   for f in supabase/migrations/*.sql; do psql -v ON_ERROR_STOP=1 -f "$f"; done
--   psql -v ON_ERROR_STOP=1 -f tests/sql/10_rpc_behavior.sql
--
-- Every check is a `do` block that raises on failure, so ON_ERROR_STOP=1 turns
-- any broken invariant into a non-zero exit. A passing run prints only PASS
-- lines, which keeps the signal readable in CI.
--
-- Identifiers are written inline rather than via psql `\set` variables: a
-- `do $$ ... $$` block reaches the server as a literal string, so psql variable
-- interpolation never happens inside it and `:'var'` would fail there.
--
--   alice  11111111-1111-4111-8111-111111111111
--   bob    22222222-2222-4222-8222-222222222222
--   aA     aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa   (alice's attempt)
--   aB     bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb   (bob's attempt)
--   act1   c0000000-0000-4000-8000-000000000001
--   act2   c0000000-0000-4000-8000-000000000002

-- `notice` rather than `warning`: the PASS lines below are raised as notices, so
-- a higher level would hide the harness's own success signal and leave only the
-- final \echo, which cannot say WHICH check passed.

-- Reset any prior run so the harness is idempotent: CI re-runs it against the
-- same database, and without this a leftover attempt at revision 1 makes check 1
-- fail with "opened at revision 1" and points at create_attempt for a defect it
-- does not have. Only the rows this file creates are touched.
delete from public.attempt_events
  where attempt_id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                       'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
delete from public.attempts
  where id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
               'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'alice@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'bob@example.test')
on conflict (id) do nothing;

-- One commit call with the payload a server would send. Only the fields the
-- invariants under test depend on are varied per check.
create or replace function pg_temp.commit_evt(
  p_attempt_id uuid,
  p_actor_user_id uuid,
  p_expected_revision integer,
  p_action_id uuid,
  p_request_fingerprint text,
  p_action_type text default 'add_base'
) returns jsonb
language plpgsql
as $fn$
begin
  return public.commit_attempt_event(
    p_attempt_id          => p_attempt_id,
    p_actor_user_id       => p_actor_user_id,
    p_scenario_release_id => 'acid-neutralization@1.0.0',
    p_expected_revision   => p_expected_revision,
    p_action_id           => p_action_id,
    p_request_fingerprint => p_request_fingerprint,
    p_event_kind          => 'domain_action',
    p_action_type         => p_action_type,
    p_input_payload       => '{"volumeL":0.001}'::jsonb,
    p_normalized_input    => '{"volumeL":0.001}'::jsonb,
    p_result_payload      => '{"nextState":{}}'::jsonb,
    p_calculation_trace   => '[]'::jsonb,
    p_observations        => '[]'::jsonb,
    p_warnings            => '[]'::jsonb,
    p_resource_delta      => '{"reagents":{},"waterLiters":0,"operationCount":1,"relativeCostIndexDelta":null,"safetyPenalties":[],"secondaryWaste":{}}'::jsonb,
    p_state_before_hash   => encode(sha256('before'::bytea), 'hex'),
    p_state_after         => '{"phase":"mixed"}'::jsonb,
    p_state_after_hash    => encode(sha256('after'::bytea), 'hex'),
    p_undo_of_sequence    => null,
    p_occurred_at         => now(),
    p_current_projection  => '{"phase":"mixed"}'::jsonb,
    p_projection_version  => 1
  );
end
$fn$;

create or replace function pg_temp.make_attempt(
  p_attempt_id uuid,
  p_user_id uuid
) returns jsonb
language plpgsql
as $fn$
begin
  return public.create_attempt(
    p_attempt_id          => p_attempt_id,
    p_actor_user_id       => p_user_id,
    p_scenario_key        => 'acid-neutralization',
    p_scenario_release_id => 'acid-neutralization@1.0.0',
    p_content_locale      => 'vi',
    p_initial_state       => '{"phase":"ready"}'::jsonb,
    p_current_projection  => '{"phase":"ready"}'::jsonb,
    p_projection_version  => 1
  );
end
$fn$;

-- 1. create_attempt opens an in_progress attempt at revision 0.
do $chk$
declare v jsonb; v_row public.attempts%rowtype;
begin
  v := pg_temp.make_attempt('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                            '11111111-1111-4111-8111-111111111111');
  select * into v_row from public.attempts
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  if v_row.id is null then
    raise exception 'create_attempt did not persist a row';
  end if;
  if v_row.status <> 'in_progress' then
    raise exception 'attempt opened with status %, expected in_progress', v_row.status;
  end if;
  if v_row.revision <> 0 then
    raise exception 'attempt opened at revision %, expected 0', v_row.revision;
  end if;
  raise notice 'PASS 1: create_attempt opens in_progress at revision 0 (outcome=%)', v->>'outcome';
end $chk$;

-- 2. create_attempt is idempotent on the attempt id: a retry must not create a
--    second attempt.
do $chk$
declare v jsonb; n bigint;
begin
  v := pg_temp.make_attempt('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                            '11111111-1111-4111-8111-111111111111');
  select count(*) into n from public.attempts
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  if n <> 1 then
    raise exception 'duplicate create_attempt produced % rows, expected 1', n;
  end if;
  raise notice 'PASS 2: retried create_attempt stays one row (outcome=%)', v->>'outcome';
end $chk$;

-- 3. A first event commits and advances the revision by exactly one, together
--    with its snapshot. Atomicity is what makes replay safe (§12.2).
do $chk$
declare v jsonb; v_row public.attempts%rowtype; n bigint;
begin
  v := pg_temp.commit_evt('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                          '11111111-1111-4111-8111-111111111111',
                          0,
                          'c0000000-0000-4000-8000-000000000001',
                          'fp-alpha');
  select * into v_row from public.attempts
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  select count(*) into n from public.attempt_events
    where attempt_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  if n <> 1 then raise exception 'expected 1 event, got %', n; end if;
  if v_row.revision <> 1 then
    raise exception 'revision advanced to %, expected 1', v_row.revision;
  end if;
  if (v->>'sequence')::int <> 1 then
    raise exception 'sequence is %, expected 1', v->>'sequence';
  end if;
  if v_row.last_sequence <> 1 then
    raise exception 'snapshot last_sequence is %, expected 1', v_row.last_sequence;
  end if;
  raise notice 'PASS 3: event and snapshot advance together (rev=%, seq=%)',
    v_row.revision, v_row.last_sequence;
end $chk$;

-- 4. THE CORE IDEMPOTENCY GUARANTEE. Replaying the same request_fingerprint
--    must not append a second event, so a network retry cannot double-dose the
--    simulation.
do $chk$
declare v jsonb; n bigint; v_rev integer;
begin
  v := pg_temp.commit_evt('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                          '11111111-1111-4111-8111-111111111111',
                          0,
                          'c0000000-0000-4000-8000-000000000001',
                          'fp-alpha');
  select count(*) into n from public.attempt_events
    where attempt_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  select revision into v_rev from public.attempts
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  if n <> 1 then
    raise exception 'DUPLICATE EVENT: replaying fp-alpha produced % events, expected 1', n;
  end if;
  if v_rev <> 1 then
    raise exception 'replay advanced revision to %, expected it to stay 1', v_rev;
  end if;
  raise notice 'PASS 4: duplicate fingerprint is idempotent (outcome=%, events=%)',
    v->>'outcome', n;
end $chk$;

-- 5. A stale expected_revision must be REJECTED. Applying it silently would let
--    a second device overwrite the first device's work.
--
--    The RPC signals refusal by RETURN VALUE (outcome = 'revision_conflict'),
--    not by raising: no event is written, nothing rolls back, and the caller
--    receives the current revision plus summary so the UI can refresh before
--    retrying with a NEW action id (docs/data-and-state-model.md §13). Asserting
--    on the outcome and on the event count is therefore the stronger check —
--    expecting an exception would miss a conflict that writes rows.
do $chk$
declare v jsonb; n bigint; v_rev integer;
begin
  v := pg_temp.commit_evt('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                          '11111111-1111-4111-8111-111111111111',
                          0,  -- stale: the attempt is already at revision 1
                          'c0000000-0000-4000-8000-000000000002',
                          'fp-beta');
  if (v->>'outcome') <> 'revision_conflict' then
    raise exception 'STALE REVISION ACCEPTED: outcome was %, expected revision_conflict',
      v->>'outcome';
  end if;
  select count(*) into n from public.attempt_events
    where attempt_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  if n <> 1 then
    raise exception 'stale revision WROTE % events, expected the count to stay 1', n;
  end if;
  select revision into v_rev from public.attempts
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  if v_rev <> 1 then
    raise exception 'stale revision moved revision to %, expected to stay 1', v_rev;
  end if;
  if (v->>'currentRevision')::int <> 1 then
    raise exception 'conflict payload currentRevision is %, expected 1', v->>'currentRevision';
  end if;
  raise notice 'PASS 5: stale revision refused, nothing written (outcome=%, currentRevision=%)',
    v->>'outcome', v->>'currentRevision';
end $chk$;

-- 6. Ownership: another learner must not commit to this attempt. Also a
--    return-value refusal (outcome = 'forbidden', reason = 'not_owner').
do $chk$
declare v jsonb; n bigint;
begin
  v := pg_temp.commit_evt('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                          '22222222-2222-4222-8222-222222222222',  -- bob, not owner
                          1,
                          'c0000000-0000-4000-8000-000000000003',
                          'fp-gamma');
  if (v->>'outcome') <> 'forbidden' or (v->>'reason') <> 'not_owner' then
    raise exception 'OWNERSHIP BYPASS: outcome=% reason=%, expected forbidden/not_owner',
      v->>'outcome', coalesce(v->>'reason', 'null');
  end if;
  select count(*) into n from public.attempt_events
    where attempt_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and request_fingerprint = 'fp-gamma';
  if n <> 0 then
    raise exception 'non-owner commit wrote % event(s)', n;
  end if;
  raise notice 'PASS 6: non-owner commit refused (outcome=%, reason=%)',
    v->>'outcome', v->>'reason';
end $chk$;

-- Bob needs his own attempt before check 7 can distinguish "RLS hides alice"
-- from "RLS hides everything". Asserting on the returned outcome rather than
-- discarding it with `perform` is what makes a silent creation failure visible:
-- without that, check 7 reports RLS as too strict and points at the wrong
-- control.
do $chk$
declare v jsonb;
begin
  v := pg_temp.make_attempt('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
                            '22222222-2222-4222-8222-222222222222');
  if (v->>'outcome') <> 'committed' then
    raise exception 'bob attempt creation returned outcome %, expected committed', v->>'outcome';
  end if;
end $chk$;

-- 7. RLS: as bob, alice's attempt must be invisible while bob sees his own.
--    `set local` only applies inside a transaction, so the impersonation is
--    wrapped in an explicit one; outside it the setting would silently not
--    apply and this check would pass for the wrong reason.

begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';

do $chk$
declare n bigint;
begin
  select count(*) into n from public.attempts
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  if n <> 0 then
    raise exception 'RLS LEAK: bob sees % row(s) of alice attempt', n;
  end if;
  select count(*) into n from public.attempt_events
    where attempt_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  if n <> 0 then
    raise exception 'RLS LEAK: bob sees % of alice events', n;
  end if;
  select count(*) into n from public.attempts
    where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  if n <> 1 then
    raise exception 'RLS TOO STRICT: bob cannot see his own attempt (% rows)', n;
  end if;
  raise notice 'PASS 7: RLS hides alice attempt from bob; bob sees his own';
end $chk$;
commit;

-- 8. anon has no rights on user data at all (§17.5).
begin;
set local role anon;
do $chk$
declare raised boolean := false;
begin
  begin
    perform count(*) from public.attempts;
  exception when insufficient_privilege then
    raised := true;
  end;
  if not raised then
    raise exception 'ANON PRIVILEGE LEAK: anon could read attempts';
  end if;
  raise notice 'PASS 8: anon cannot read attempts (insufficient_privilege)';
end $chk$;
commit;

-- 9. No UPDATE grant on attempts for authenticated: revision is the
--    optimistic-lock token and may only move through the RPC.
do $chk$
declare has_update boolean;
begin
  select exists (
    select 1 from information_schema.role_table_grants g
    where g.grantee = 'authenticated'
      and g.table_schema = 'public'
      and g.table_name = 'attempts'
      and g.privilege_type = 'UPDATE'
  ) into has_update;
  if has_update then
    raise exception 'GRANT LEAK: authenticated holds UPDATE on attempts';
  end if;
  raise notice 'PASS 9: authenticated has no UPDATE grant on attempts';
end $chk$;

-- 10. Per-attempt event sequence starts at 1 and is independent per attempt.
do $chk$
declare v jsonb;
begin
  v := pg_temp.commit_evt('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
                          '22222222-2222-4222-8222-222222222222',
                          0,
                          'c0000000-0000-4000-8000-000000000004',
                          'fp-delta');
  if (v->>'sequence')::int <> 1 then
    raise exception 'first sequence for bob attempt is %, expected 1', v->>'sequence';
  end if;
  raise notice 'PASS 10: per-attempt sequence starts at 1 (seq=%)', v->>'sequence';
end $chk$;

-- 11. A second distinct action on bob's attempt advances sequence and revision
--     in lockstep, and the earlier alice attempt is unaffected.
do $chk$
declare v jsonb; bob_rev integer; alice_rev integer; alice_events bigint;
begin
  v := pg_temp.commit_evt('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
                          '22222222-2222-4222-8222-222222222222',
                          1,
                          'c0000000-0000-4000-8000-000000000005',
                          'fp-epsilon');
  if (v->>'sequence')::int <> 2 then
    raise exception 'second sequence is %, expected 2', v->>'sequence';
  end if;
  select revision into bob_rev from public.attempts
    where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  select revision, 0 into alice_rev, alice_events from public.attempts
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  if bob_rev <> 2 then
    raise exception 'bob revision is %, expected 2', bob_rev;
  end if;
  if alice_rev <> 1 then
    raise exception 'alice revision moved to %, expected to stay 1', alice_rev;
  end if;
  select count(*) into alice_events from public.attempt_events
    where attempt_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  if alice_events <> 1 then
    raise exception 'alice event count changed to %, expected 1', alice_events;
  end if;
  raise notice 'PASS 11: attempts advance independently (bob rev=%, alice rev=%)',
    bob_rev, alice_rev;
end $chk$;

\echo 'ALL RPC BEHAVIOR CHECKS PASSED'
