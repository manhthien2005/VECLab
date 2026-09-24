-- Row Level Security: the defence-in-depth layer under the grants.
--
-- Source of truth:
--   docs/data-and-state-model.md §17.1 (profiles policy), §17.2 (attempts read
--   policy), §17.3 (attempt_events read policy via parent attempt), §17.5,
--   §6.5 (controlled trigger/RPC immutability), §22 invariants 6/8/10.
--   docs/system-architecture.md §11.3 (RLS defence in depth), §2.3.
--   docs/verification-and-acceptance.md §13.1 (authorization matrix).
--
-- RULE ENFORCED HERE: no policy in this file permits any role reachable from a
-- browser (anon, authenticated) to INSERT, UPDATE or DELETE a row in these
-- tables, let alone to touch a trusted column. Browser roles hold SELECT only
-- (20260909000400_grants.sql). Every mutation happens inside the SECURITY
-- DEFINER RPCs of 20260909000600_commit_event_rpc.sql, whose EXECUTE privilege
-- is granted to the server role alone.

alter table public.profiles enable row level security;
alter table public.attempts enable row level security;
alter table public.attempt_events enable row level security;

-- ---------------------------------------------------------------------------
-- FORCE ROW LEVEL SECURITY: deliberately NOT applied.
--
-- `force row level security` only changes the behaviour of the TABLE OWNER. In
-- a Supabase project the owner of these tables is `postgres`, which is exactly
-- the identity that (a) SECURITY DEFINER functions run under and (b) seed.sql
-- and migrations run under. Forcing RLS would therefore block the trusted write
-- path itself, and the only way to re-open it would be a blanket `to postgres
-- using (true)` policy — which restores precisely the accidental-owner-write
-- exposure that FORCE is meant to remove, while making it look authorized.
--
-- The equivalent protection is provided by four controls that do not depend on
-- the owner identity:
--   1. anon/authenticated hold SELECT only, and column-level revokes remove the
--      trusted-column write surface entirely (20260909000400_grants.sql).
--   2. No write policy exists for a browser role (this file).
--   3. EXECUTE on the mutation RPCs is revoked from PUBLIC, anon and
--      authenticated (20260909000600_commit_event_rpc.sql).
--   4. attempts_immutability_guard below rejects the forbidden column changes
--      even from a privileged role, so an accidental owner-level write cannot
--      reassign an attempt, rewrite its frozen release or edit a finished
--      report (docs/data-and-state-model.md §6.5, §22 invariants 8 and 10).
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- profiles (docs/data-and-state-model.md §17.1)
-- ---------------------------------------------------------------------------

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (auth.uid() is not null and auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policy for browser roles: §5.3 provisioning and any
-- later profile mutation run through the controlled server service, which uses
-- the server role (docs/data-and-state-model.md §17.1, §17.5).

-- ---------------------------------------------------------------------------
-- attempts (docs/data-and-state-model.md §17.2)
-- ---------------------------------------------------------------------------

drop policy if exists attempts_select_own on public.attempts;
create policy attempts_select_own
  on public.attempts
  for select
  to authenticated
  using (auth.uid() is not null and auth.uid() = user_id);

-- §17.2: browser role has no direct INSERT/UPDATE/DELETE on attempts. Creation,
-- action commit, completion, reset, branch, import and delete all go through the
-- server-only RPCs after explicit ownership checks.

-- ---------------------------------------------------------------------------
-- attempt_events (docs/data-and-state-model.md §17.3)
-- ---------------------------------------------------------------------------

-- Ownership is mediated through the parent attempt, so an event is readable
-- exactly when its attempt is.
drop policy if exists attempt_events_select_own on public.attempt_events;
create policy attempt_events_select_own
  on public.attempt_events
  for select
  to authenticated
  using (
    auth.uid() is not null
    and exists (
      select 1
      from public.attempts a
      where a.id = attempt_events.attempt_id
        and a.user_id = auth.uid()
    )
  );

-- §17.3: no client INSERT/UPDATE/DELETE on events. The log is append-only and
-- only the commit RPC appends to it (docs/data-and-state-model.md §7.4, §14.2).

-- ---------------------------------------------------------------------------
-- Controlled immutability guard (docs/data-and-state-model.md §6.5)
--
-- "Controlled trigger/RPC blocks changing user_id, scenario_key or
--  scenario_release_id after creation." The commit RPCs never rewrite those
-- columns; this trigger makes the rule unconditional so no other write path —
-- including a privileged one — can violate it. It also pins the two
-- immutability rules that §6.5, §10.4 and §22 require: a completed attempt
-- accepts no further update (hard delete by the owner through the server
-- service is the only exit), and a written final_report_snapshot is never
-- overwritten by a recompute.
-- ---------------------------------------------------------------------------

create or replace function public.attempts_immutability_guard()
returns trigger
language plpgsql
as $$
begin
  if new.user_id <> old.user_id then
    raise exception 'attempt % owner is immutable (docs/data-and-state-model.md §6.5, §22 invariant 8)', old.id
      using errcode = 'insufficient_privilege';
  end if;

  if new.scenario_key <> old.scenario_key
     or new.scenario_release_id <> old.scenario_release_id then
    raise exception 'attempt % scenario release is immutable (docs/data-and-state-model.md §6.5)', old.id
      using errcode = 'insufficient_privilege';
  end if;

  if new.initial_state <> old.initial_state then
    raise exception 'attempt % initial_state is immutable (docs/data-and-state-model.md §6.3)', old.id
      using errcode = 'insufficient_privilege';
  end if;

  if old.final_report_snapshot is not null
     and new.final_report_snapshot is distinct from old.final_report_snapshot then
    raise exception 'attempt % final_report_snapshot is immutable once written (docs/data-and-state-model.md §6.5, §22 invariant 10)', old.id
      using errcode = 'insufficient_privilege';
  end if;

  if old.status = 'completed' and (
       new.status <> old.status
       or new.current_state <> old.current_state
       or new.current_projection <> old.current_projection
       or new.revision <> old.revision
       or new.last_sequence <> old.last_sequence
     ) then
    raise exception 'completed attempt % accepts no further mutation (docs/data-and-state-model.md §4.2, §10.4)', old.id
      using errcode = 'object_not_in_prerequisite_state';
  end if;

  return new;
end
$$;

drop trigger if exists attempts_immutability_guard on public.attempts;
create trigger attempts_immutability_guard
  before update on public.attempts
  for each row
  execute function public.attempts_immutability_guard();

comment on function public.attempts_immutability_guard() is
  'Enforces the immutability constraints of docs/data-and-state-model.md §6.5 for every write path.';
