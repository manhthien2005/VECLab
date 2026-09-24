-- attempt_events: every accepted state transition, in order.
--
-- Source of truth:
--   docs/data-and-state-model.md §7.3 (logical schema — reproduced exactly),
--   §7.4 (why state_after is stored), §7.5 (calculation trace shape),
--   §7.6 (request fingerprint and integrity hashes), §18 (index).
--
-- Append-only. No UPDATE and no DELETE path exists for browser roles: the
-- grants in 20260909000400 and the policies in 20260909000500 leave writes
-- exclusively to the security-definer RPCs, whose owner bypasses RLS by design
-- (docs/system-architecture.md §2.3, §11.3; docs/data-and-state-model.md §17.3).

create table if not exists public.attempt_events (
  id uuid primary key,
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  -- Client-generated before the request so a retry cannot create a second event
  -- (§3.1, §12.1). Unique per attempt.
  action_id uuid not null,
  -- SHA-256 over the RFC 8785/JCS canonical payload {attemptId,
  -- scenarioReleaseId, actionType, normalizedParameters, canonicalUnits}
  -- (§7.6; docs/system-architecture.md §5.1). Proves payload equality on retry,
  -- not payload trustworthiness.
  request_fingerprint text not null,
  sequence integer not null,
  event_kind public.attempt_event_kind not null,
  action_type text not null,
  input_payload jsonb not null,
  -- Canonical units only (§2.3). User-chosen units live in input_payload.
  normalized_input jsonb not null,
  -- Trusted column: server-computed engine result, never client-supplied.
  result_payload jsonb not null,
  -- Explanation-only data; contains no secret and no token (§7.5,
  -- docs/system-architecture.md §5.1).
  calculation_trace jsonb not null,
  observations jsonb not null,
  warnings jsonb not null,
  resource_delta jsonb not null,
  -- JCS + SHA-256 integrity aids, not security signatures (§7.6).
  state_before_hash text not null,
  -- Full state after the action: fast resume, branch origin, mid-timeline
  -- report rendering without replay (§7.4).
  state_after jsonb not null,
  state_after_hash text not null,
  -- For `undo_last` only: the sequence being undone (§14.2).
  undo_of_sequence integer null,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique (attempt_id, sequence),
  unique (attempt_id, action_id),
  check (sequence > 0),
  -- Undo provenance invariant (§7.3).
  check (
    (event_kind = 'undo_last' and undo_of_sequence is not null)
    or
    (event_kind in ('domain_action', 'lifecycle') and undo_of_sequence is null)
  ),
  -- An undone event must precede the undo that records it (§14.2).
  check (undo_of_sequence is null or undo_of_sequence < sequence)
);

-- §18: event list is loaded fully only when opening an attempt or report.
create index if not exists attempt_events_attempt_sequence_idx
  on public.attempt_events (attempt_id, sequence);

comment on table public.attempt_events is
  'Append-only log of accepted transitions (docs/data-and-state-model.md §7).';
comment on column public.attempt_events.request_fingerprint is
  'SHA-256 over the JCS canonical request payload; used for idempotency comparison only (docs/data-and-state-model.md §7.6).';
comment on column public.attempt_events.result_payload is
  'Trusted column. Server-computed engine result; browsers have no INSERT/UPDATE grant (docs/system-architecture.md §2.3).';
comment on column public.attempt_events.calculation_trace is
  'Explanation data with no secrets or tokens (docs/system-architecture.md §5.1).';
