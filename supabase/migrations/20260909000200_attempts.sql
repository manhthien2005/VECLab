-- attempts: metadata, current snapshot and final result of one cloud attempt.
--
-- Source of truth:
--   docs/data-and-state-model.md §6.2 (logical schema — reproduced exactly),
--   §6.3 (field meanings), §6.4 (never stored), §6.5 (immutability constraints),
--   §18 (indexes), §22 (mandatory invariants).
--
-- Not stored here (§6.4): passwords/tokens, PDF binaries, whole source PDFs,
-- transient form input, UI layout state not needed for resume.

create table if not exists public.attempts (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Immutable after creation (§6.5): scenario_key, scenario_release_id and
  -- user_id are only ever written by the server-only RPCs, never by a browser.
  scenario_key text not null,
  scenario_release_id text not null,
  content_locale text not null default 'vi',
  status public.attempt_status not null default 'in_progress',
  -- Optimistic concurrency token; incremented exactly once per successful
  -- domain/lifecycle mutation (§22 invariant 3, §13).
  revision integer not null default 0,
  -- Sequence of the last committed event, or 0 when none (§22 invariant 1).
  last_sequence integer not null default 0,
  -- Immutable state captured at creation; a branch copies the parent's value
  -- (§14.1).
  initial_state jsonb not null,
  -- State after the last event; must equal that event's state_after
  -- (§22 invariant 2).
  current_state jsonb not null,
  -- Single summary for dashboard/goal/resource, produced from current_state by
  -- a versioned projector inside the same commit (§22 invariant 11).
  current_projection jsonb not null,
  projection_version integer not null,
  -- Branch provenance (§14.1): parent link plus immutable snapshots so a report
  -- never depends on the parent still existing.
  parent_attempt_id uuid null references public.attempts(id) on delete set null,
  parent_sequence integer null,
  branch_origin_snapshot jsonb null,
  inherited_timeline_snapshot jsonb null,
  -- Immutable report data; mandatory exactly when status = 'completed'
  -- (§15.1, §22 invariant 6).
  final_report_snapshot jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz null,
  check (revision >= 0),
  check (last_sequence >= 0),
  -- Completed-state invariant (§4.2, §6.2).
  check (
    (status = 'completed' and completed_at is not null and final_report_snapshot is not null)
    or
    (status <> 'completed' and completed_at is null)
  ),
  -- A branch point must be an already-committed sequence (§14.1).
  check (parent_sequence is null or parent_sequence > 0),
  -- A branch always names a parent; parent metadata without a parent is invalid.
  check (parent_sequence is null or parent_attempt_id is not null)
);

-- §18 indexes plus the lookup paths required by §19 (resume by release,
-- compare two attempts of the same release, list by owner/status).
create index if not exists attempts_user_updated_idx
  on public.attempts (user_id, updated_at desc);

create index if not exists attempts_user_scenario_status_idx
  on public.attempts (user_id, scenario_key, status);

create index if not exists attempts_user_status_idx
  on public.attempts (user_id, status);

create index if not exists attempts_user_release_idx
  on public.attempts (user_id, scenario_release_id);

create index if not exists attempts_scenario_release_idx
  on public.attempts (scenario_key, scenario_release_id);

create index if not exists attempts_parent_idx
  on public.attempts (parent_attempt_id)
  where parent_attempt_id is not null;

comment on table public.attempts is
  'One cloud attempt: metadata, current snapshot, final result (docs/data-and-state-model.md §6).';
comment on column public.attempts.scenario_release_id is
  'Immutable release bundle id, e.g. acid-neutralization@1.0.0 (docs/system-architecture.md §6.2).';
comment on column public.attempts.current_state is
  'Trusted column. Writable only inside the security-definer commit RPC (docs/system-architecture.md §2.3).';
comment on column public.attempts.current_projection is
  'Trusted column, projector output for the same commit (docs/data-and-state-model.md §6.3).';
comment on column public.attempts.final_report_snapshot is
  'Trusted column, immutable once written by complete_attempt (docs/data-and-state-model.md §15).';
comment on column public.attempts.revision is
  'Trusted column and optimistic concurrency token (docs/data-and-state-model.md §13).';
comment on column public.attempts.last_sequence is
  'Trusted column; sequence of the last committed event (docs/data-and-state-model.md §22).';
