'use client'

import { useCallback, useReducer } from 'react'

import type {
  WaterTreatmentAction,
  WaterTreatmentResult,
} from '@/app/simulate/water-treatment/actions.js'

/**
 * WT-10: hook gọi POST /api/water-treatment/run thay vì server action trực tiếp.
 *
 * Lý do transport swap: chemistry solver từ `runWaterTreatmentAction` được wrap qua
 * BFF route (`src/app/api/water-treatment/run/route.ts`) để áp dụng cùng BFF hygiene
 * (zod.strict body validation, `MAX_ACTION_BODY_BYTES` size guard, `guardedResponse`
 * turning solver throws thành 500 + không leak message) mà các route khác đã dùng.
 * Chemistry solver vẫn chạy end-to-end (không mock) — chỉ là cách gọi thay đổi.
 *
 * Hợp đồng public của hook (signature + state shape + error message) được giữ nguyên
 * để workbench UI không cần thay đổi; chỉ swap transport layer.
 *
 * Lỗi giờ phân biệt hai dạng:
 *   - HTTP transport failure (`fetch` reject) → message "Lỗi không xác định" (giữ nguyên
 *     behavior cũ: caller chỉ thấy string error qua `state.error`).
 *   - HTTP status không phải 200 → response.json() parse body lấy `error` field (ví dụ
 *     `body_invalid`, `body_too_large`, `internal_error`) làm message. Solver-bug
 *     message không bao giờ tới client vì `guardedResponse` đã filter ở server side.
 */

const RUN_ENDPOINT = '/api/water-treatment/run'

/** Composition mẫu Fe/Zn/Pb (mg/L). */
export type Composition = { Fe: number; Zn: number; Pb: number }

/** Trạng thái attempt hiện tại. */
export type AttemptState = {
  /** Composition đã pick. Mặc định empty (chưa pick). */
  readonly composition: Composition
  /** pH hiện tại. Mặc định 7 (trung tính) khi chưa đo. */
  readonly pH: number
  /** History các action result, mới nhất cuối. */
  readonly history: ReadonlyArray<WaterTreatmentResult>
  /** Đang chờ server action trả về. */
  readonly isRunning: boolean
  /** Lỗi nếu có. */
  readonly error: string | null
}

type Action =
  | { type: 'set-composition'; composition: Composition }
  | { type: 'reset' }
  | { type: 'start-run' }
  | { type: 'run-complete'; result: WaterTreatmentResult }
  | { type: 'run-error'; error: string }

const INITIAL: AttemptState = {
  composition: { Fe: 0, Zn: 0, Pb: 0 },
  pH: 7,
  history: [],
  isRunning: false,
  error: null,
}

function reducer(state: AttemptState, action: Action): AttemptState {
  switch (action.type) {
    case 'set-composition':
      return {
        ...state,
        composition: action.composition,
        history: [],
        error: null,
      }
    case 'reset':
      return { ...INITIAL }
    case 'start-run':
      return { ...state, isRunning: true, error: null }
    case 'run-complete':
      return {
        ...state,
        isRunning: false,
        pH: action.result.pH,
        history: [...state.history, action.result],
      }
    case 'run-error':
      return { ...state, isRunning: false, error: action.error }
  }
}

export function useWaterTreatmentAttempt() {
  const [state, dispatch] = useReducer(reducer, INITIAL)

  const setComposition = useCallback((composition: Composition) => {
    dispatch({ type: 'set-composition', composition })
  }, [])

  const reset = useCallback(() => dispatch({ type: 'reset' }), [])

  const run = useCallback(
    async (
      action: WaterTreatmentAction,
      options?: { dose_mL?: number; volume_mL?: number },
    ): Promise<WaterTreatmentResult | null> => {
      dispatch({ type: 'start-run' })
      try {
        const response = await fetch(RUN_ENDPOINT, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            action,
            composition: state.composition,
            pH: state.pH,
            dose_mL: options?.dose_mL ?? 0,
            volume_mL: options?.volume_mL ?? 1000,
          }),
        })

        if (!response.ok) {
          // Server side đã giới hạn body chỉ chứa `{ error: <code> }` cho mọi
          // non-200 (body_invalid / body_not_json / body_too_large / internal_error).
          // Parse lấy `error` để message hữu ích; fallback nếu body không phải JSON.
          let message = `HTTP ${response.status}`
          try {
            const errBody = (await response.json()) as { error?: unknown }
            if (typeof errBody.error === 'string') message = errBody.error
          } catch {
            // ignore — body parse failed, giữ HTTP status làm message
          }
          dispatch({ type: 'run-error', error: message })
          return null
        }

        const result = (await response.json()) as WaterTreatmentResult
        dispatch({ type: 'run-complete', result })
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Lỗi không xác định'
        dispatch({ type: 'run-error', error: message })
        return null
      }
    },
    [state.composition, state.pH],
  )

  return { state, setComposition, reset, run }
}
