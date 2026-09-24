-- VECLab enum types.
--
-- Source of truth:
--   docs/data-and-state-model.md §4.1  (attempt_status)
--   docs/data-and-state-model.md §7.2  (attempt_event_kind)
--   docs/data-and-state-model.md §21.1 (every schema change is a versioned migration)
--
-- PostgreSQL has no `CREATE TYPE IF NOT EXISTS`, so each type is created inside a
-- guarded DO block. Re-running the whole chain against a fresh or an already
-- migrated database is therefore a no-op rather than an error.
--
-- All objects in this chain are created in `public` and referenced with an
-- explicit `public.` qualifier, so the chain applies identically whatever
-- `search_path` the connecting role happens to carry.

-- Attempt lifecycle: in_progress -> completed | stopped.
-- `removed` in the lifecycle diagram (docs/data-and-state-model.md §4) is the
-- absence of a row (hard delete), never an enum value (§4.2).
do $$
begin
  if to_regtype('public.attempt_status') is null then
    create type public.attempt_status as enum (
      'in_progress',
      'completed',
      'stopped'
    );
  end if;
end
$$;

-- Accepted state transitions, appended by the server-only commit RPC only
-- (docs/data-and-state-model.md §7.2, §12).
do $$
begin
  if to_regtype('public.attempt_event_kind') is null then
    create type public.attempt_event_kind as enum (
      'domain_action',
      'undo_last',
      'lifecycle'
    );
  end if;
end
$$;
