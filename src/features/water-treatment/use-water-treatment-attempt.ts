'use client'

import { useCallback, useReducer } from 'react'

import { runWaterTreatmentAction, type WaterTreatmentResult } from '@/app/simulate/water-treatment/actions.js'

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
      action: Parameters<typeof runWaterTreatmentAction>[0]['action'],
      options?: { dose_mL?: number; volume_mL?: number },
    ): Promise<WaterTreatmentResult | null> => {
      dispatch({ type: 'start-run' })
      try {
        const result = await runWaterTreatmentAction({
          action,
          composition: state.composition,
          pH: state.pH,
          dose_mL: options?.dose_mL ?? 0,
          volume_mL: options?.volume_mL ?? 1000,
        })
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
