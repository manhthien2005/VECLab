import { z } from 'zod'
import { isUUID } from '@/shared/ids.js'
import type { UUID } from '@/domain/process/contracts.js'

/**
 * Request schemas for the simulation BFF (docs/system-architecture.md §9, §17).
 *
 * §17 lists what the server must check, and "schema" is first among them. These are that
 * check, stated once per endpoint instead of re-derived inside each handler.
 *
 * Every object is `.strict()`, which is load-bearing rather than tidy: it makes the
 * fields ABSENT from these schemas unreachable. `resultPayload`, `stateAfter`,
 * `stateAfterHash`, `resourceDelta` and the scores are computed server-side by the locked
 * release engine and written through RPC columns revoked from browser roles, so a body
 * carrying one is not a request this API understands and is rejected outright. Without
 * `strict`, an unknown key would be parsed away silently — which works until someone adds
 * a handler that reads it, at which point the client is supplying trusted output.
 *
 * Validated here, then consumed as a typed value: nothing downstream of a successful parse
 * re-checks a type or coerces a field.
 */

/**
 * A UUID, checked with the project's own predicate.
 *
 * `isUUID` rather than `z.uuid()` so there is one definition of what counts as an id —
 * the same one the guest store and `parseUuidSegment` use. Two patterns that differ in some
 * corner (uppercase, urn prefix, nil) would let an id pass one check and fail another,
 * and a rejected-but-valid id is indistinguishable from a bug.
 */
const uuid = z.custom<UUID>(
  (value): value is UUID => typeof value === 'string' && isUUID(value),
  { message: 'not a uuid' },
)

/**
 * The revision the learner last saw, or null when they have not seen one.
 *
 * Nullable rather than optional, and rejected rather than defaulted when malformed: §6.5's
 * optimistic concurrency depends on this being the revision the learner was LOOKING AT
 * when they confirmed a prediction (§7.1). Silently defaulting a bad value to the stored
 * revision would make the comparison always pass and turn conflict detection into a no-op.
 */
const expectedRevision = z.number().int().nonnegative().nullable()

/**
 * Action parameters: a flat map of scalars.
 *
 * The engine declares each parameter's quantity and validates its value against the locked
 * release, so what is checked here is only that the map cannot carry a nested object or an
 * array where a number or string is expected.
 */
const parameters = z.record(z.string(), z.union([z.number(), z.string(), z.boolean()]))

/**
 * Unit selections: a flat map of strings.
 *
 * Strings because a unit is a name to look up ('mL', 'L'), normalized to canonical units
 * before anything is computed (§2.3). A number here is a malformed body, not an unknown
 * unit — and reporting it as the latter would send a learner looking at their input when
 * the real fault is a broken client.
 */
const unitSelections = z.record(z.string(), z.string())

/** Fields every commit carries, for the same reason on every endpoint. */
const commitFields = {
  attemptId: uuid,
  actionId: uuid,
  expectedRevision,
}

/** `POST /attempts/[attemptId]/actions` (§9). */
export const applyActionSchema = z
  .object({
    ...commitFields,
    actionType: z.string().min(1),
    parameters,
    unitSelections,
  })
  .strict()

/** `POST /attempts/[attemptId]/undo`. */
export const undoActionSchema = z.object(commitFields).strict()

/** `POST /attempts/[attemptId]/complete`. */
export const completeActionSchema = z.object(commitFields).strict()

/** `POST /attempts` — starts an attempt. The server owns the scenario, so there is nothing to send. */
export const startAttemptSchema = z.object({}).strict()

/** Inferred request types, so handlers consume values rather than re-declaring shapes. */
export type ApplyActionRequest = z.infer<typeof applyActionSchema>
export type UndoActionRequest = z.infer<typeof undoActionSchema>
export type CompleteActionRequest = z.infer<typeof completeActionSchema>

/**
 * The identity a commit carries, as the session wants it.
 *
 * `expectedRevision: null` becomes an absent key rather than an explicit null, because
 * `CommitIdentity` marks it optional and `exactOptionalPropertyTypes` rejects `undefined`
 * for an optional property. Omitting it is what tells the session "use the stored
 * revision", which is correct for a caller that has not seen one.
 */
export type CommitIdentityInput = {
  actionId: UUID
  /** Present only when the caller actually saw a revision. */
  expectedRevision?: number
}

/**
 * Parse a commit body.
 *
 * Returns the validated value or a 400 carrying the first offending field. Field NAMES
 * are safe to return — they are the client's own, and naming one is what makes a malformed
 * request diagnosable. Values are not echoed back.
 */
export type ParsedBody<Schema extends z.ZodType> =
  | { ok: true; value: z.infer<Schema> }
  | { ok: false; failure: { status: 400; body: { error: string; field?: string } } }

export function parseBody<Schema extends z.ZodType>(
  schema: Schema,
  body: unknown,
): ParsedBody<Schema> {
  const result = schema.safeParse(body)
  if (result.success) return { ok: true, value: result.data }

  const issue = result.error.issues[0]
  return {
    ok: false,
    failure: {
      status: 400,
      body: {
        // `invalid_union` and friends are zod's own vocabulary; passing the code through
        // costs nothing and saves guessing which check failed from the field name alone.
        error: issue === undefined ? 'body_invalid' : `body_invalid:${issue.code}`,
        ...(issue === undefined || issue.path.length === 0
          ? {}
          : { field: issue.path.map(String).join('.') }),
      },
    },
  }
}

/**
 * Reduce a validated commit body to what the session accepts.
 *
 * Split from `parseBody` because three endpoints share it and each has already validated
 * its own schema; re-checking here would be a second definition of the same rule.
 */
export function toCommitIdentity(request: {
  actionId: UUID
  expectedRevision: number | null
}): CommitIdentityInput {
  return {
    actionId: request.actionId,
    ...(request.expectedRevision === null ? {} : { expectedRevision: request.expectedRevision }),
  }
}

