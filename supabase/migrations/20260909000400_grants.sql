-- Grants: the RLS complement. Grants decide WHAT a role may touch; RLS decides
-- WHICH ROWS. Supabase treats them as two separate layers
-- (docs/data-and-state-model.md §17.5).
--
-- SECURITY BOUNDARY (docs/system-architecture.md §2.3, §11.3):
--   A browser role (anon, authenticated) MUST NOT be able to write
--     attempts.current_state, attempts.current_projection,
--     attempts.final_report_snapshot, attempts.revision,
--     attempts.last_sequence, attempts.projection_version,
--     attempts.status / completed_at / user_id / scenario_key /
--     scenario_release_id,
--   or attempt_events.result_payload (indeed any attempt_events row).
--   Those columns hold server-computed truth. Every path that writes them is a
--   SECURITY DEFINER RPC in 20260909000600, callable only by the server, which
--   runs the deterministic TypeScript engine OUTSIDE the database transaction
--   (docs/data-and-state-model.md §12) and passes only its verified output.
--   This is enforced by column-level grants below: no table-wide UPDATE grant
--   exists for anon/authenticated, so an `update attempts set revision = ...`
--   from a browser session fails with permission denied before RLS is even
--   consulted.
--
-- Matrix implemented (docs/verification-and-acceptance.md §13.1):
--   anon                    -> no rights on user tables (deny everything)
--   authenticated           -> SELECT own rows (profiles, attempts, attempt_events)
--   service_role / server   -> explicit, after ownership and revision checks

-- ---------------------------------------------------------------------------
-- Browser roles: read-only, own rows only.
-- ---------------------------------------------------------------------------

-- `anon` gets nothing on user data (§17.5). Public scenario content is served
-- from the versioned in-repo registry, never from a user table
-- (docs/system-architecture.md §17).
revoke all on public.profiles, public.attempts, public.attempt_events from anon;
revoke all on all sequences in schema public from anon;

-- `authenticated`: SELECT only. No INSERT (attempt creation goes through the
-- controlled server service, §17.2), no UPDATE (would reach trusted columns),
-- no DELETE (hard delete goes through the server service, §20).
revoke all on public.profiles, public.attempts, public.attempt_events from authenticated;
grant select on public.profiles to authenticated;
grant select on public.attempts to authenticated;
grant select on public.attempt_events to authenticated;

-- Explicitly deny the trusted-column write surface for browser roles. These
-- revokes are redundant after `revoke all` above but are stated so a future
-- migration that widens a grant cannot silently reopen them.
revoke insert, update, delete, truncate, references, trigger
  on public.attempts from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public.attempt_events from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public.profiles from anon, authenticated;

-- USAGE on the enums so SELECT results decode for browser roles.
grant usage on type public.attempt_status to anon, authenticated;
grant usage on type public.attempt_event_kind to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Server role.
-- ---------------------------------------------------------------------------

-- Dedicated server-side role for the trusted write path. It owns nothing and is
-- granted everything it needs explicitly, so a leaked `authenticated` JWT can
-- never reach the trusted columns even in principle
-- (docs/system-architecture.md §2.3, §17).
do $$
begin
  if not exists (
    select 1 from pg_roles where rolname = 'veclab_server'
  ) then
    -- NOLOGIN: this role is assumed by SECURITY DEFINER functions only, never
    -- connected to directly. The functions themselves are reachable through the
    -- Supabase service_role key, which exists only in server environment
    -- (docs/system-architecture.md §11.3).
    create role veclab_server nologin noinherit;
  end if;
end
$$;

grant usage on schema public to veclab_server;
grant usage on type public.attempt_status to veclab_server;
grant usage on type public.attempt_event_kind to veclab_server;
grant select, insert, update, delete on public.profiles to veclab_server;
grant select, insert, update, delete on public.attempts to veclab_server;
grant select, insert on public.attempt_events to veclab_server;

-- The service role is the wire identity Supabase gives the server client
-- (docs/data-and-state-model.md §17.5). It is not trusted by ownership alone:
-- the RPCs still re-check owner, status, release and revision under a row lock
-- (docs/data-and-state-model.md §12).
grant veclab_server to service_role;

-- EXECUTE on the RPCs is granted to service_role and veclab_server only, in
-- 20260909000600. PUBLIC, anon and authenticated are revoked there so the
-- default PostgreSQL behaviour of granting EXECUTE to PUBLIC is closed.
