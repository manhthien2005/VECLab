-- Server-only trusted-write surface (SECURITY DEFINER RPCs).
--
-- Source of truth:
--   docs/data-and-state-model.md §12    (server calculation + atomic commit RPC)
--   docs/data-and-state-model.md §12.1  (idempotency), §12.2 (failure = rollback)
--   docs/data-and-state-model.md §13    (optimistic concurrency)
--   docs/data-and-state-model.md §14.1  (branch), §14.2 (undo), §14.3 (reset/stop)
--   docs/data-and-state-model.md §15    (complete + final report snapshot)
--   docs/data-and-state-model.md §20    (hard delete)
--   docs/system-architecture.md §2.3, §9 (call flow), §11.3 (server-only RPC)
--   docs/verification-and-acceptance.md §10.1-§10.4 (atomicity, idempotency,
--                                                    concurrency, immutability)
--
-- WHY RPCs AND NOT DIRECT TABLE WRITES: the deterministic TypeScript engine runs
-- OUTSIDE the database transaction (docs/data-and-state-model.md §12). The
-- database therefore never computes chemistry, scores or projections; it only
-- guards the invariants that make the server-computed result durable:
-- ownership, exact scenario release, attempt status, idempotency on
-- (attempt_id, action_id), expected revision, sequence continuity and the
-- completed-state invariant. Everything else it rejects.
--
-- ORDER OF CHECKS inside commit_attempt_event (docs/system-architecture.md §9):
--   1. row exists            -> 'not_found'
--   2. owner matches         -> 'forbidden' (reason 'not_owner')
--   3. release matches       -> 'forbidden' (reason 'release_mismatch')
--   4. (attempt_id, action_id) already committed
--        same fingerprint    -> 'idempotent_replay' with the EXISTING event
--        other fingerprint   -> 'idempotency_conflict' with existingEventId
--   5. status in_progress    -> 'forbidden' (reason 'not_in_progress')
--   6. expected_revision     -> 'revision_conflict' with currentRevision + summary
--   7. insert event (sequence = last_sequence + 1) and update the attempt
--
-- Step 4 precedes step 6 as required by docs/verification-and-acceptance.md
-- §10.2 and docs/system-architecture.md §9 ("if the action id already exists
-- with the same fingerprint, return the old event even when the expected
-- revision is stale"). Step 4 also precedes step 5 so that a retried lifecycle
-- action (complete/stop) replays its stored event instead of being reported as
-- an invalid transition; a genuinely new action_id on a completed or stopped
-- attempt is still rejected at step 5.
--
-- NO PARTIAL WRITES: every rejection path returns before any INSERT/UPDATE, and
-- every unexpected condition raises an exception, which aborts the transaction
-- and rolls back (docs/data-and-state-model.md §12.2).
--
-- HARD DELETE (docs/data-and-state-model.md §20) is the only mutation that is
-- not an RPC: cascade already removes events with the attempt, and delete
-- authorization is a pure ownership test, so delete_attempt() is a thin
-- SECURITY DEFINER wrapper rather than a second delete path.

-- ---------------------------------------------------------------------------
-- Event count ceiling.
-- docs/system-architecture.md §17: endpoints carry body-size, event-count and
-- rate limits; a release contract must not produce a valid attempt above 500
-- events. Enforced here so no server code path can exceed it.
-- ---------------------------------------------------------------------------
create or replace function public.veclab_max_attempt_events()
returns integer
language sql
immutable
set search_path = public, pg_temp
as $$
  select 500
$$;

comment on function public.veclab_max_attempt_events() is
  'Hard ceiling on events per attempt (docs/system-architecture.md §17).';

-- ---------------------------------------------------------------------------
-- commit_attempt_event: append one accepted event and advance the attempt
-- snapshot in a single transaction (docs/data-and-state-model.md §12).
-- ---------------------------------------------------------------------------
create or replace function public.commit_attempt_event(
  p_attempt_id uuid,
  p_actor_user_id uuid,
  p_scenario_release_id text,
  p_expected_revision integer,
  p_action_id uuid,
  p_request_fingerprint text,
  p_event_kind public.attempt_event_kind,
  p_action_type text,
  p_input_payload jsonb,
  p_normalized_input jsonb,
  p_result_payload jsonb,
  p_calculation_trace jsonb,
  p_observations jsonb,
  p_warnings jsonb,
  p_resource_delta jsonb,
  p_state_before_hash text,
  p_state_after jsonb,
  p_state_after_hash text,
  p_undo_of_sequence integer,
  p_occurred_at timestamptz,
  p_current_projection jsonb,
  p_projection_version integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_attempt public.attempts%rowtype;
  v_existing record;
  v_event_id uuid := gen_random_uuid();
  v_sequence integer;
  v_new_revision integer;
  v_updated integer;
begin
  if p_attempt_id is null or p_actor_user_id is null or p_action_id is null then
    raise exception 'commit_attempt_event requires attempt id, actor user id and action id'
      using errcode = 'invalid_parameter_value';
  end if;

  if p_expected_revision is null or p_expected_revision < 0 then
    raise exception 'commit_attempt_event requires a non-negative expected revision'
      using errcode = 'invalid_parameter_value';
  end if;

  -- Row lock: serializes concurrent commits on the same attempt so sequence and
  -- revision cannot diverge (docs/data-and-state-model.md §13).
  select a.*
    into v_attempt
    from public.attempts a
   where a.id = p_attempt_id
   for update;

  if not found then
    return jsonb_build_object(
      'outcome', 'not_found',
      'attemptId', p_attempt_id
    );
  end if;

  -- Ownership re-check under the lock. `auth.uid()` is null for the service
  -- role, so the caller passes the user id it already authenticated; the row is
  -- the authority, never the payload (docs/data-and-state-model.md §22 inv. 8).
  if v_attempt.user_id <> p_actor_user_id then
    return jsonb_build_object(
      'outcome', 'forbidden',
      'reason', 'not_owner',
      'attemptId', p_attempt_id
    );
  end if;

  -- Exact release re-check: an attempt never mixes releases (§12, §21.2).
  if v_attempt.scenario_release_id <> p_scenario_release_id then
    return jsonb_build_object(
      'outcome', 'forbidden',
      'reason', 'release_mismatch',
      'attemptId', p_attempt_id,
      'attemptReleaseId', v_attempt.scenario_release_id,
      'requestedReleaseId', p_scenario_release_id
    );
  end if;

  -- Idempotency (docs/data-and-state-model.md §12.1). Runs BEFORE the revision
  -- check and BEFORE the status check, see the header comment.
  select e.id, e.request_fingerprint, e.sequence, to_jsonb(e.*) as event_json
    into v_existing
    from public.attempt_events e
   where e.attempt_id = p_attempt_id
     and e.action_id = p_action_id;

  if found then
    if v_existing.request_fingerprint = p_request_fingerprint then
      return jsonb_build_object(
        'outcome', 'idempotent_replay',
        'attemptId', p_attempt_id,
        'eventId', v_existing.id,
        'sequence', v_existing.sequence,
        'revision', v_attempt.revision,
        'lastSequence', v_attempt.last_sequence,
        'event', v_existing.event_json
      );
    end if;

    -- Same action id, different payload: never create a second event
    -- (§12.1; docs/verification-and-acceptance.md §10.2).
    return jsonb_build_object(
      'outcome', 'idempotency_conflict',
      'attemptId', p_attempt_id,
      'existingEventId', v_existing.id,
      'existingSequence', v_existing.sequence
    );
  end if;

  -- Completed and stopped attempts accept no ordinary action (§4.2,
  -- docs/verification-and-acceptance.md §10.4).
  if v_attempt.status <> 'in_progress' then
    return jsonb_build_object(
      'outcome', 'forbidden',
      'reason', 'not_in_progress',
      'attemptId', p_attempt_id,
      'status', v_attempt.status::text
    );
  end if;

  -- Optimistic concurrency (docs/data-and-state-model.md §13): stale revision
  -- writes nothing and returns the newest revision plus summary so the UI can
  -- refresh before retrying with a NEW action id.
  if v_attempt.revision <> p_expected_revision then
    return jsonb_build_object(
      'outcome', 'revision_conflict',
      'attemptId', p_attempt_id,
      'currentRevision', v_attempt.revision,
      'expectedRevision', p_expected_revision,
      'summary', v_attempt.current_projection
    );
  end if;

  -- Undo provenance (docs/data-and-state-model.md §14.2): only the last action
  -- may be undone, `undo_last` carries the sequence it undoes, and nothing else
  -- may carry one. The table check constraint is the backstop; validating here
  -- gives a precise error instead of a constraint name.
  if p_event_kind = 'undo_last' then
    if p_undo_of_sequence is null then
      raise exception 'undo_last requires undo_of_sequence (docs/data-and-state-model.md §7.3)'
        using errcode = 'invalid_parameter_value';
    end if;
    if p_undo_of_sequence >= v_attempt.last_sequence + 1 then
      raise exception 'cannot undo sequence %, attempt % has only % committed events (docs/data-and-state-model.md §14.2)',
        p_undo_of_sequence, p_attempt_id, v_attempt.last_sequence
        using errcode = 'object_not_in_prerequisite_state';
    end if;
  elsif p_undo_of_sequence is not null then
    raise exception 'event kind % must not carry undo_of_sequence (docs/data-and-state-model.md §7.3)',
      p_event_kind::text
      using errcode = 'invalid_parameter_value';
  end if;

  if p_occurred_at is null or p_state_after is null or p_request_fingerprint is null then
    raise exception 'commit_attempt_event requires occurred_at, state_after and request_fingerprint'
      using errcode = 'invalid_parameter_value';
  end if;

  if v_attempt.last_sequence >= public.veclab_max_attempt_events() then
    raise exception 'attempt % reached the % event ceiling (docs/system-architecture.md §17)',
      p_attempt_id, public.veclab_max_attempt_events()
      using errcode = 'program_limit_exceeded';
  end if;

  -- Sequence is derived from the locked row, never from the payload
  -- (docs/data-and-state-model.md §22 invariants 1 and 5).
  v_sequence := v_attempt.last_sequence + 1;
  v_new_revision := v_attempt.revision + 1;

  insert into public.attempt_events (
    id, attempt_id, action_id, request_fingerprint, sequence, event_kind,
    action_type, input_payload, normalized_input, result_payload,
    calculation_trace, observations, warnings, resource_delta,
    state_before_hash, state_after, state_after_hash, undo_of_sequence,
    occurred_at, recorded_at
  ) values (
    v_event_id, p_attempt_id, p_action_id, p_request_fingerprint, v_sequence, p_event_kind,
    p_action_type, p_input_payload, p_normalized_input, p_result_payload,
    p_calculation_trace, p_observations, p_warnings, p_resource_delta,
    p_state_before_hash, p_state_after, p_state_after_hash, p_undo_of_sequence,
    p_occurred_at, now()
  );

  -- Snapshot advance in the SAME transaction (§12). Revision increments exactly
  -- once per successful mutation (§22 invariant 3); current_state becomes the
  -- event's state_after (§22 invariant 2) and current_projection is the
  -- projector output for that same state (§22 invariant 11).
  update public.attempts
     set current_state = p_state_after,
         current_projection = p_current_projection,
         projection_version = p_projection_version,
         revision = v_new_revision,
         last_sequence = v_sequence,
         updated_at = now()
   where id = p_attempt_id
     and revision = v_attempt.revision;

  get diagnostics v_updated = row_count;
  if v_updated <> 1 then
    -- Unreachable while holding the row lock; raising guarantees no event is
    -- ever committed without its snapshot update (§12.2).
    raise exception 'attempt % snapshot update did not apply; rolling back the event', p_attempt_id
      using errcode = 'serialization_failure';
  end if;

  return jsonb_build_object(
    'outcome', 'committed',
    'attemptId', p_attempt_id,
    'eventId', v_event_id,
    'sequence', v_sequence,
    'revision', v_new_revision
  );
end
$$;

comment on function public.commit_attempt_event is
  'Server-only atomic append of one accepted event plus snapshot advance (docs/data-and-state-model.md §12).';

-- ---------------------------------------------------------------------------
-- create_attempt: open a new in_progress attempt (docs/data-and-state-model.md
-- §6, §17.2). Idempotent on the attempt id so a retried create cannot produce a
-- duplicate row.
-- ---------------------------------------------------------------------------
create or replace function public.create_attempt(
  p_attempt_id uuid,
  p_actor_user_id uuid,
  p_scenario_key text,
  p_scenario_release_id text,
  p_content_locale text,
  p_initial_state jsonb,
  p_current_projection jsonb,
  p_projection_version integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_existing public.attempts%rowtype;
begin
  if p_attempt_id is null or p_actor_user_id is null
     or p_scenario_key is null or p_scenario_release_id is null
     or p_initial_state is null then
    raise exception 'create_attempt requires attempt id, actor user id, scenario key, release id and initial state'
      using errcode = 'invalid_parameter_value';
  end if;

  select a.*
    into v_existing
    from public.attempts a
   where a.id = p_attempt_id
   for update;

  if found then
    -- Retry of a create that already landed: return the stored attempt when the
    -- request describes the same attempt, otherwise refuse to guess.
    if v_existing.user_id = p_actor_user_id
       and v_existing.scenario_release_id = p_scenario_release_id then
      return jsonb_build_object(
        'outcome', 'idempotent_replay',
        'attempt', to_jsonb(v_existing)
      );
    end if;
    return jsonb_build_object(
      'outcome', 'forbidden',
      'reason', 'attempt_id_conflict',
      'attemptId', p_attempt_id
    );
  end if;

  insert into public.attempts (
    id, user_id, scenario_key, scenario_release_id, content_locale, status,
    revision, last_sequence, initial_state, current_state, current_projection,
    projection_version, created_at, updated_at
  ) values (
    p_attempt_id, p_actor_user_id, p_scenario_key, p_scenario_release_id,
    coalesce(p_content_locale, 'vi'), 'in_progress',
    -- Fresh attempt: revision 0, no events yet (§14.1). current_state equals
    -- initial_state until the first event lands (§22 invariant 2).
    0, 0, p_initial_state, p_initial_state, p_current_projection,
    p_projection_version, now(), now()
  );

  return jsonb_build_object(
    'outcome', 'committed',
    'attempt', (select to_jsonb(a) from public.attempts a where a.id = p_attempt_id)
  );
end
$$;

comment on function public.create_attempt is
  'Server-only attempt creation, idempotent on attempt id (docs/data-and-state-model.md §6, §17.2).';

-- ---------------------------------------------------------------------------
-- complete_attempt: append the terminal lifecycle event AND write the immutable
-- final report snapshot atomically (docs/data-and-state-model.md §15, §4.2).
--
-- The completed invariant is enforced three times over: here (status flip with
-- completed_at and snapshot in one statement), by the table check constraint
-- (§6.2) and by attempts_immutability_guard, which refuses any later change to
-- the snapshot (§6.5, §22 invariant 10). A recompute therefore can never
-- overwrite a stored report (docs/verification-and-acceptance.md §10.4).
-- ---------------------------------------------------------------------------
create or replace function public.complete_attempt(
  p_attempt_id uuid,
  p_actor_user_id uuid,
  p_scenario_release_id text,
  p_expected_revision integer,
  p_action_id uuid,
  p_request_fingerprint text,
  p_input_payload jsonb,
  p_normalized_input jsonb,
  p_result_payload jsonb,
  p_calculation_trace jsonb,
  p_observations jsonb,
  p_warnings jsonb,
  p_resource_delta jsonb,
  p_state_before_hash text,
  p_state_after jsonb,
  p_state_after_hash text,
  p_occurred_at timestamptz,
  p_current_projection jsonb,
  p_projection_version integer,
  p_final_report_snapshot jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_commit jsonb;
  v_outcome text;
  v_updated integer;
begin
  if p_final_report_snapshot is null then
    -- §4.2: final_report_snapshot is mandatory when completed. Refusing here
    -- means the row can never reach 'completed' without a report.
    raise exception 'complete_attempt requires final_report_snapshot (docs/data-and-state-model.md §4.2)'
      using errcode = 'invalid_parameter_value';
  end if;

  -- Lifecycle action type for completion (§7.6).
  v_commit := public.commit_attempt_event(
    p_attempt_id,
    p_actor_user_id,
    p_scenario_release_id,
    p_expected_revision,
    p_action_id,
    p_request_fingerprint,
    'lifecycle'::public.attempt_event_kind,
    'completed',
    p_input_payload,
    p_normalized_input,
    p_result_payload,
    p_calculation_trace,
    p_observations,
    p_warnings,
    p_resource_delta,
    p_state_before_hash,
    p_state_after,
    p_state_after_hash,
    null,
    p_occurred_at,
    p_current_projection,
    p_projection_version
  );

  v_outcome := v_commit ->> 'outcome';

  -- Any rejection (including revision_conflict) leaves the attempt untouched:
  -- commit_attempt_event returns before writing (§12.2).
  if v_outcome <> 'committed' then
    return v_commit;
  end if;

  -- Status flip. Deliberately does NOT touch revision: the single increment for
  -- this mutation already happened inside commit_attempt_event
  -- (docs/data-and-state-model.md §22 invariant 3).
  update public.attempts
     set status = 'completed',
         completed_at = coalesce(p_occurred_at, now()),
         final_report_snapshot = p_final_report_snapshot,
         updated_at = now()
   where id = p_attempt_id
     and status = 'in_progress'
     and revision = (v_commit ->> 'revision')::integer
     and final_report_snapshot is null;

  get diagnostics v_updated = row_count;
  if v_updated <> 1 then
    raise exception 'attempt % could not be marked completed; rolling back', p_attempt_id
      using errcode = 'object_not_in_prerequisite_state';
  end if;

  return v_commit || jsonb_build_object(
    'status', 'completed',
    'completedAt', coalesce(p_occurred_at, now())
  );
end
$$;

comment on function public.complete_attempt is
  'Server-only completion: terminal event plus immutable report snapshot in one transaction (docs/data-and-state-model.md §15).';

-- ---------------------------------------------------------------------------
-- stop_attempt: mark the attempt stopped through a controlled mutation, leaving
-- the timeline intact (docs/data-and-state-model.md §14.2, §14.3, §4).
--
-- Reset is this call plus create_attempt for the new attempt: the old attempt is
-- never overwritten (§14.3).
-- ---------------------------------------------------------------------------
create or replace function public.stop_attempt(
  p_attempt_id uuid,
  p_actor_user_id uuid,
  p_scenario_release_id text,
  p_expected_revision integer,
  p_action_id uuid,
  p_request_fingerprint text,
  p_action_type text,
  p_input_payload jsonb,
  p_normalized_input jsonb,
  p_result_payload jsonb,
  p_calculation_trace jsonb,
  p_observations jsonb,
  p_warnings jsonb,
  p_resource_delta jsonb,
  p_state_before_hash text,
  p_state_after jsonb,
  p_state_after_hash text,
  p_occurred_at timestamptz,
  p_current_projection jsonb,
  p_projection_version integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_commit jsonb;
  v_updated integer;
begin
  -- Minimal lifecycle action types are completed/stopped/stopped_by_reset
  -- (docs/data-and-state-model.md §7.6).
  if p_action_type not in ('stopped', 'stopped_by_reset') then
    raise exception 'stop_attempt accepts action_type stopped or stopped_by_reset, got %', p_action_type
      using errcode = 'invalid_parameter_value';
  end if;

  v_commit := public.commit_attempt_event(
    p_attempt_id,
    p_actor_user_id,
    p_scenario_release_id,
    p_expected_revision,
    p_action_id,
    p_request_fingerprint,
    'lifecycle'::public.attempt_event_kind,
    p_action_type,
    p_input_payload,
    p_normalized_input,
    p_result_payload,
    p_calculation_trace,
    p_observations,
    p_warnings,
    p_resource_delta,
    p_state_before_hash,
    p_state_after,
    p_state_after_hash,
    null,
    p_occurred_at,
    p_current_projection,
    p_projection_version
  );

  if v_commit ->> 'outcome' <> 'committed' then
    return v_commit;
  end if;

  update public.attempts
     set status = 'stopped',
         updated_at = now()
   where id = p_attempt_id
     and status = 'in_progress'
     and revision = (v_commit ->> 'revision')::integer;

  get diagnostics v_updated = row_count;
  if v_updated <> 1 then
    raise exception 'attempt % could not be marked stopped; rolling back', p_attempt_id
      using errcode = 'object_not_in_prerequisite_state';
  end if;

  return v_commit || jsonb_build_object('status', 'stopped');
end
$$;

comment on function public.stop_attempt is
  'Server-only controlled stop/reset of an attempt (docs/data-and-state-model.md §14.3).';

-- ---------------------------------------------------------------------------
-- branch_attempt: open a new attempt from a committed point of a parent attempt
-- (docs/data-and-state-model.md §14.1).
--
-- Parent must be the same owner and the exact same scenario_release_id, and must
-- already be terminal (the lifecycle only branches from completed or stopped,
-- §4). The new attempt copies initial_state and takes the parent event's
-- state_after as its current_state, starting at revision 0 / last_sequence 0.
-- No parent events are copied; branch_origin_snapshot and
-- inherited_timeline_snapshot are stored so a report never depends on the parent
-- still existing (§14.1, §22 invariant 9).
-- ---------------------------------------------------------------------------
create or replace function public.branch_attempt(
  p_attempt_id uuid,
  p_actor_user_id uuid,
  p_parent_attempt_id uuid,
  p_parent_sequence integer,
  p_scenario_release_id text,
  p_content_locale text,
  p_current_state jsonb,
  p_current_projection jsonb,
  p_projection_version integer,
  p_branch_origin_snapshot jsonb,
  p_inherited_timeline_snapshot jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_parent public.attempts%rowtype;
  v_origin_event public.attempt_events%rowtype;
  v_existing public.attempts%rowtype;
begin
  if p_attempt_id is null or p_actor_user_id is null or p_parent_attempt_id is null
     or p_parent_sequence is null or p_scenario_release_id is null
     or p_branch_origin_snapshot is null then
    raise exception 'branch_attempt requires attempt id, actor, parent id, parent sequence, release id and origin snapshot'
      using errcode = 'invalid_parameter_value';
  end if;

  if p_parent_sequence <= 0 then
    raise exception 'parent sequence must be a committed event sequence (> 0), got %', p_parent_sequence
      using errcode = 'invalid_parameter_value';
  end if;

  select a.*
    into v_existing
    from public.attempts a
   where a.id = p_attempt_id
   for update;

  if found then
    if v_existing.parent_attempt_id = p_parent_attempt_id
       and v_existing.parent_sequence = p_parent_sequence
       and v_existing.user_id = p_actor_user_id then
      return jsonb_build_object('outcome', 'idempotent_replay', 'attempt', to_jsonb(v_existing));
    end if;
    return jsonb_build_object(
      'outcome', 'forbidden',
      'reason', 'attempt_id_conflict',
      'attemptId', p_attempt_id
    );
  end if;

  select a.*
    into v_parent
    from public.attempts a
   where a.id = p_parent_attempt_id
   for update;

  if not found then
    return jsonb_build_object(
      'outcome', 'not_found',
      'attemptId', p_parent_attempt_id
    );
  end if;

  if v_parent.user_id <> p_actor_user_id then
    return jsonb_build_object(
      'outcome', 'forbidden',
      'reason', 'not_owner',
      'attemptId', p_parent_attempt_id
    );
  end if;

  -- Exact release, never a mix of sub-versions (§14.1, §21.2).
  if v_parent.scenario_release_id <> p_scenario_release_id then
    return jsonb_build_object(
      'outcome', 'forbidden',
      'reason', 'release_mismatch',
      'attemptId', p_parent_attempt_id,
      'attemptReleaseId', v_parent.scenario_release_id,
      'requestedReleaseId', p_scenario_release_id
    );
  end if;

  -- §4 lifecycle: a branch is opened only from a terminal parent (completed or
  -- stopped); an in_progress attempt is resumed, not branched.
  if v_parent.status = 'in_progress' then
    return jsonb_build_object(
      'outcome', 'forbidden',
      'reason', 'parent_not_terminal',
      'attemptId', p_parent_attempt_id,
      'status', v_parent.status::text
    );
  end if;

  select e.*
    into v_origin_event
    from public.attempt_events e
   where e.attempt_id = p_parent_attempt_id
     and e.sequence = p_parent_sequence;

  if not found then
    return jsonb_build_object(
      'outcome', 'not_found',
      'attemptId', p_parent_attempt_id,
      'reason', 'parent_sequence_missing',
      'parentSequence', p_parent_sequence
    );
  end if;

  -- The branch origin state is read from the stored event, not from the payload:
  -- a client cannot invent a branch point (§14.1, §22 invariant 9).
  insert into public.attempts (
    id, user_id, scenario_key, scenario_release_id, content_locale, status,
    revision, last_sequence, initial_state, current_state, current_projection,
    projection_version, parent_attempt_id, parent_sequence,
    branch_origin_snapshot, inherited_timeline_snapshot, created_at, updated_at
  ) values (
    p_attempt_id, p_actor_user_id, v_parent.scenario_key, p_scenario_release_id,
    coalesce(p_content_locale, v_parent.content_locale), 'in_progress',
    0, 0, v_parent.initial_state, v_origin_event.state_after, p_current_projection,
    p_projection_version, v_parent.id, p_parent_sequence,
    p_branch_origin_snapshot, p_inherited_timeline_snapshot, now(), now()
  );

  return jsonb_build_object(
    'outcome', 'committed',
    'attempt', (select to_jsonb(a) from public.attempts a where a.id = p_attempt_id)
  );
end
$$;

comment on function public.branch_attempt is
  'Server-only branch from a committed parent event (docs/data-and-state-model.md §14.1).';

-- ---------------------------------------------------------------------------
-- delete_attempt: hard delete with cascade (docs/data-and-state-model.md §20,
-- §4.2). Ownership is the only authorization test; no soft delete, no recycle
-- bin. Called by the controlled server service after UI confirmation.
-- ---------------------------------------------------------------------------
create or replace function public.delete_attempt(
  p_attempt_id uuid,
  p_actor_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_attempt public.attempts%rowtype;
begin
  if p_attempt_id is null or p_actor_user_id is null then
    raise exception 'delete_attempt requires attempt id and actor user id'
      using errcode = 'invalid_parameter_value';
  end if;

  select a.*
    into v_attempt
    from public.attempts a
   where a.id = p_attempt_id
   for update;

  if not found then
    return jsonb_build_object('outcome', 'not_found', 'attemptId', p_attempt_id);
  end if;

  if v_attempt.user_id <> p_actor_user_id then
    return jsonb_build_object(
      'outcome', 'forbidden',
      'reason', 'not_owner',
      'attemptId', p_attempt_id
    );
  end if;

  -- Branch children keep their immutable origin snapshot, so removing the parent
  -- cannot break a branch report (§14.1): on delete set null plus the stored
  -- snapshot. Events cascade away with the attempt (§20).
  delete from public.attempts where id = p_attempt_id;

  return jsonb_build_object('outcome', 'committed', 'attemptId', p_attempt_id);
end
$$;

comment on function public.delete_attempt is
  'Server-only hard delete of an attempt and its events (docs/data-and-state-model.md §20).';

-- ---------------------------------------------------------------------------
-- Server-side reads.
--
-- Browser roles read through PostgREST + RLS (20260909000500_rls.sql). The
-- server path needs the same rows without depending on `auth.uid()`, because the
-- service role carries no user claim (docs/system-architecture.md §9, §11.3).
-- Both functions take the authenticated user id resolved by the server and
-- return nothing for an attempt that user does not own — the same denial RLS
-- gives a browser.
-- ---------------------------------------------------------------------------

create or replace function public.get_attempt(
  p_attempt_id uuid,
  p_actor_user_id uuid,
  p_include_events boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_attempt public.attempts%rowtype;
begin
  select a.*
    into v_attempt
    from public.attempts a
   where a.id = p_attempt_id;

  if not found or v_attempt.user_id <> p_actor_user_id then
    -- Indistinguishable from a missing row on purpose: a guessed UUID must not
    -- confirm existence (docs/verification-and-acceptance.md §13.2).
    return jsonb_build_object('outcome', 'not_found', 'attemptId', p_attempt_id);
  end if;

  if coalesce(p_include_events, false) then
    return jsonb_build_object(
      'outcome', 'found',
      'attempt', to_jsonb(v_attempt),
      'events', coalesce(
        (select jsonb_agg(to_jsonb(e) order by e.sequence)
           from public.attempt_events e
          where e.attempt_id = p_attempt_id),
        '[]'::jsonb
      )
    );
  end if;

  return jsonb_build_object('outcome', 'found', 'attempt', to_jsonb(v_attempt));
end
$$;

comment on function public.get_attempt is
  'Server-side ownership-checked attempt read (docs/system-architecture.md §9).';

create or replace function public.list_attempts(
  p_actor_user_id uuid,
  p_scenario_release_id text default null,
  p_status public.attempt_status default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_limit integer;
  v_offset integer;
begin
  if p_actor_user_id is null then
    raise exception 'list_attempts requires the authenticated user id'
      using errcode = 'invalid_parameter_value';
  end if;

  -- Attempt lists are paginated as data grows (docs/system-architecture.md §16)
  -- and capped by PostgREST max_rows regardless.
  v_limit := least(greatest(coalesce(p_limit, 50), 1), 200);
  v_offset := greatest(coalesce(p_offset, 0), 0);

  return jsonb_build_object(
    'outcome', 'found',
    'attempts', coalesce(
      (select jsonb_agg(t order by t ->> 'updatedAt' desc)
         from (
           select jsonb_build_object(
                    'id', a.id,
                    'scenarioKey', a.scenario_key,
                    'scenarioReleaseId', a.scenario_release_id,
                    'contentLocale', a.content_locale,
                    'status', a.status::text,
                    'revision', a.revision,
                    'lastSequence', a.last_sequence,
                    'projectionVersion', a.projection_version,
                    'currentProjection', a.current_projection,
                    'parentAttemptId', a.parent_attempt_id,
                    'parentSequence', a.parent_sequence,
                    'createdAt', a.created_at,
                    'updatedAt', a.updated_at,
                    'completedAt', a.completed_at
                  ) as t
             from public.attempts a
            where a.user_id = p_actor_user_id
              and (p_scenario_release_id is null or a.scenario_release_id = p_scenario_release_id)
              and (p_status is null or a.status = p_status)
            order by a.updated_at desc
            limit v_limit
            offset v_offset
         ) s),
      '[]'::jsonb
    )
  );
end
$$;

comment on function public.list_attempts is
  'Server-side paginated attempt summary list for one owner (docs/system-architecture.md §16).';

-- ---------------------------------------------------------------------------
-- EXECUTE grants: server only.
--
-- PostgreSQL grants EXECUTE to PUBLIC by default. Every function above is
-- SECURITY DEFINER, so leaving that default in place would let any anon or
-- authenticated caller write trusted columns through the RPC — the exact hole
-- docs/system-architecture.md §2.3 forbids. Revoke from PUBLIC first, then grant
-- to the server identities only (docs/data-and-state-model.md §17.5: service
-- role is server-only and never sent to the client).
-- ---------------------------------------------------------------------------
revoke execute on function public.veclab_max_attempt_events() from public, anon, authenticated;
revoke execute on function public.commit_attempt_event(
  uuid, uuid, text, integer, uuid, text, public.attempt_event_kind, text,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text, jsonb, text,
  integer, timestamptz, jsonb, integer
) from public, anon, authenticated;
revoke execute on function public.create_attempt(
  uuid, uuid, text, text, text, jsonb, jsonb, integer
) from public, anon, authenticated;
revoke execute on function public.complete_attempt(
  uuid, uuid, text, integer, uuid, text,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text, jsonb, text,
  timestamptz, jsonb, integer, jsonb
) from public, anon, authenticated;
revoke execute on function public.stop_attempt(
  uuid, uuid, text, integer, uuid, text, text,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text, jsonb, text,
  timestamptz, jsonb, integer
) from public, anon, authenticated;
revoke execute on function public.branch_attempt(
  uuid, uuid, uuid, integer, text, text, jsonb, jsonb, integer, jsonb, jsonb
) from public, anon, authenticated;
revoke execute on function public.delete_attempt(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.get_attempt(uuid, uuid, boolean) from public, anon, authenticated;
revoke execute on function public.list_attempts(uuid, text, public.attempt_status, integer, integer)
  from public, anon, authenticated;

grant execute on function public.veclab_max_attempt_events() to service_role, veclab_server;
grant execute on function public.commit_attempt_event(
  uuid, uuid, text, integer, uuid, text, public.attempt_event_kind, text,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text, jsonb, text,
  integer, timestamptz, jsonb, integer
) to service_role, veclab_server;
grant execute on function public.create_attempt(
  uuid, uuid, text, text, text, jsonb, jsonb, integer
) to service_role, veclab_server;
grant execute on function public.complete_attempt(
  uuid, uuid, text, integer, uuid, text,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text, jsonb, text,
  timestamptz, jsonb, integer, jsonb
) to service_role, veclab_server;
grant execute on function public.stop_attempt(
  uuid, uuid, text, integer, uuid, text, text,
  jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text, jsonb, text,
  timestamptz, jsonb, integer
) to service_role, veclab_server;
grant execute on function public.branch_attempt(
  uuid, uuid, uuid, integer, text, text, jsonb, jsonb, integer, jsonb, jsonb
) to service_role, veclab_server;
grant execute on function public.delete_attempt(uuid, uuid) to service_role, veclab_server;
grant execute on function public.get_attempt(uuid, uuid, boolean) to service_role, veclab_server;
grant execute on function public.list_attempts(uuid, text, public.attempt_status, integer, integer)
  to service_role, veclab_server;
