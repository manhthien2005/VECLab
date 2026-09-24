-- Validation-only stub for Supabase's auth schema.
--
-- NOT part of the shipped migrations. The real project runs on Supabase, where
-- `auth.users` and `auth.uid()` exist. To validate the migration SQL against a
-- plain PostgreSQL 17 container we reproduce just enough of that surface for the
-- migrations to compile and for the RLS policies to be exercisable.
--
-- `auth.uid()` reads a transaction-local setting so a test can impersonate a
-- user with `set local request.jwt.claims = '{"sub":"<uuid>"}'`, which is how
-- Supabase itself passes the authenticated subject to Postgres.

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  created_at timestamptz not null default now()
);

-- Supabase provisions these roles and grants them USAGE on `public` as platform
-- baseline. Plain PostgreSQL has neither, so without this every browser-role
-- query fails with "permission denied for schema public" before it can reach the
-- table-level grants that supabase/migrations/20260909000400_grants.sql defines.
--
-- Creating them here keeps the behavioral checks honest: check 8 (anon denied)
-- then fails on the TABLE grant, which is the control this project actually owns,
-- rather than on a schema grant it does not. Idempotent so the whole chain can be
-- re-run against an already-prepared database.
do $stub$
declare r text;
begin
  foreach r in array array['anon', 'authenticated', 'service_role'] loop
    if not exists (select 1 from pg_roles where rolname = r) then
      execute format('create role %I nologin', r);
    end if;
  end loop;
end $stub$;

grant usage on schema public to anon, authenticated, service_role;
create or replace function auth.uid() returns uuid
language sql
stable
as $$
  select nullif(
    coalesce(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      nullif(
        coalesce(
          nullif(
            (current_setting('request.jwt.claims', true)::jsonb ->> 'sub'),
            ''
          ),
          ''
        ),
        ''
      )
    ),
    ''
  )::uuid
$$;

-- The service_role path used by the server commit RPC. Supabase exposes this as
-- a JWT role claim; here it is a settable flag so tests can cover both paths.
create or replace function auth.role() returns text
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(
      coalesce(
        nullif((current_setting('request.jwt.claims', true)::jsonb ->> 'role'), ''),
        ''
      ),
      ''
    ),
    'authenticated'
  )
$$;
