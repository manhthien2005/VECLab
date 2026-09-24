-- profiles: minimal application data attached to an auth identity.
--
-- Source of truth:
--   docs/data-and-state-model.md §5.2 (logical schema), §5.3 (constraints)
--   docs/data-and-state-model.md §22 invariant 8 (owner cannot be changed)
--
-- Deliberately absent per §5.3: role (MVP has learners only), password,
-- refresh token, JWT, and a duplicated email column (email is read from the
-- auth identity).

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  -- Server provisioning is idempotent and falls back to the localized default
  -- when sign-up did not collect a display name (§5.3). Rendering escapes it.
  display_name text not null default 'Người học',
  -- UI/content locale, independent of the attempt's frozen `content_locale`
  -- (docs/data-and-state-model.md §3.2).
  locale text not null default 'vi',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- §5.3: 1-80 characters after trim.
  check (char_length(btrim(display_name)) between 1 and 80)
);

comment on table public.profiles is
  'Minimal learner profile keyed to auth.users (docs/data-and-state-model.md §5).';
comment on column public.profiles.user_id is
  'Identity owned by Supabase Auth; cascade delete removes the profile with the account (§5.2).';
comment on column public.profiles.locale is
  'Interface locale for this learner; defaults to vi (§5.2).';
