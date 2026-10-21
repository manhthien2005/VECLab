import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { json, readJson, MAX_ACTION_BODY_BYTES } from '@/app/api/_lib/guard.js'
import { guardedResponse } from '@/app/api/_lib/respond.js'
import { runWaterTreatmentAction } from '@/app/simulate/water-treatment/actions.js'

/**
 * POST /api/water-treatment/run — runs one chemistry step of the water-treatment workbench.
 *
 * Public per docs/system-architecture.md §10.1: the chemistry solver is a pure function
 * over its inputs, so a guest caller with no account gets the same result as a logged-in
 * learner. The route mirrors src/app/api/profile/route.ts in everything that is BFF
 * hygiene (`guardedResponse` wraps the handler so a thrown solver bug becomes a 500 with
 * no leaked detail; `readJson` enforces the 64 KiB body cap; zod `.strict` rejects
 * unknown fields), and intentionally omits identity/CSRF that profile adds because the
 * computation is stateless.
 *
 * No persistence: the server action returns a result, the caller stores it. Keeping
 * that contract here is what lets the same `WaterTreatmentResult` be replayed through
 * the guest IndexedDB repository or a future cloud RPC without a second code path.
 */

const compositionSchema = z
  .object({
    Fe: z.number(),
    Zn: z.number(),
    Pb: z.number(),
  })
  .strict()

const inputSchema = z
  .object({
    action: z.enum([
      'measure-initial-ph',
      'add-base',
      'add-acid',
      'stir',
      'settle',
      'filter',
      'measure-final',
    ]),
    composition: compositionSchema,
    pH: z.number(),
    volume_mL: z.number().optional(),
    dose_mL: z.number().optional(),
  })
  .strict()

export async function POST(request: NextRequest): Promise<NextResponse> {
  return guardedResponse('POST /api/water-treatment/run', async () => {
    const parsed = await readJson(request, MAX_ACTION_BODY_BYTES)
    if (!parsed.ok) {
      // `readJson` already returns a GuardFailure-shaped object; pass it through so
      // body_too_large and body_not_json keep their distinct statuses.
      return json(parsed.failure.body, { status: parsed.failure.status })
    }

    const validated = inputSchema.safeParse(parsed.value)
    if (!validated.success) {
      // Same posture as the profile route: echo a generic field error and not the
      // value the caller sent. Solver inputs are numbers, but the rule is structural —
      // no round-trip of untrusted input into an error body.
      return json({ error: 'body_invalid' }, { status: 400 })
    }

    // Build the solver input with only the fields the caller sent: under
    // `exactOptionalPropertyTypes`, `volume_mL?: number` rejects a literal `undefined`,
    // and zod's `.optional()` always emits `T | undefined`. Spreading conditionally
    // keeps the wire and the solver input shape identical when fields are absent,
    // and lets the solver apply its own defaults (`input.volume_mL ?? 1000`).
    const { action, composition, pH, volume_mL, dose_mL } = validated.data
    const solverInput = {
      action,
      composition,
      pH,
      ...(volume_mL !== undefined ? { volume_mL } : {}),
      ...(dose_mL !== undefined ? { dose_mL } : {}),
    }
    const result = await runWaterTreatmentAction(solverInput)
    return json(result, { status: 200 })
  })
}
