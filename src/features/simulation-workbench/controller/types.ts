import type { UUID } from '@/domain/process/contracts.js'
import type { AcidNeutralizationState } from '@/domain/experiments/acid-neutralization/state.js'
import type { AcidSetupParams } from '@/domain/experiments/acid-neutralization/setup.js'
import type {
  AcidSession,
  AcidSessionState,
  ActionAvailability,
} from '@/application/simulation/acid-session.js'
import type { AcidProjection } from '@/application/scenarios/acid-projection.js'

/**
 * Controller operating mode (spec §4.6, WB-R3).
 *
 * GUIDED: Teaches laboratory procedure step by step. Commands are issued explicitly.
 * EXPLORE: Frictionless titration. Preparation is automated upon start, and dosing
 *          orchestrates [add_base -> mix -> wait_for_stable_reading -> measure_ph].
 */
export type WorkbenchMode = 'GUIDED' | 'EXPLORE'

/**
 * Operational stages reflecting in-flight commands without owning UI timers or animations.
 */
export type OperationStage =
  | 'idle'
  | 'starting'
  | 'selecting_route'
  | 'calibrating'
  | 'dispensing'
  | 'mixing'
  | 'stabilizing'
  | 'measuring'
  | 'undoing'
  | 'completing'
  | 'reloading'

/**
 * Durable persistence save status.
 */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

/**
 * Lightweight interaction acknowledgement token emitted after each successful durable mutation.
 * Gives future apparatus/visualization components a deterministic signal that a committed
 * action occurred without duplicating domain chemistry.
 */
export type InteractionAcknowledgement = Readonly<{
  actionType: string
  sequence: number
  revision: number
  occurredAt: Date
}>

/**
 * Structured controller error for display and recovery.
 */
export type ControllerError = Readonly<{
  code: string
  message: string
  category?: string | undefined
  stage: OperationStage
  recoverable: boolean
  data?: Record<string, unknown> | undefined
}>

/**
 * Outcome of an orchestration function.
 */
export type OrchestrationResult =
  | {
      ok: true
      state: AcidSessionState
      stage: OperationStage
      acknowledgement: InteractionAcknowledgement
    }
  | {
      ok: false
      error: ControllerError
      stage: OperationStage
      state?: AcidSessionState | undefined
    }

/**
 * The controller's complete state exposed to React components.
 * Separated strictly into authoritative domain read models and allowed local operational state.
 */
export type WorkbenchControllerState = {
  // --- Authoritative Domain Read Models (Read-Only) ---
  readonly sessionState: AcidSessionState | null
  readonly domain: AcidNeutralizationState | null
  readonly projection: AcidProjection | null
  readonly attemptId: UUID | null
  readonly status: 'in_progress' | 'completed' | 'stopped' | null
  readonly activeSetup: AcidSetupParams | null
  readonly availableActions: readonly ActionAvailability[]
  readonly isPreStart: boolean
  readonly isExploreDispenseAvailable: boolean
  readonly isUndoAvailable: boolean
  readonly isCompleteAvailable: boolean

  // --- Allowed Local Operational State ---
  readonly mode: WorkbenchMode
  readonly setupDraft: AcidSetupParams
  readonly selectedAliquotL: number
  readonly stirrerRpm: number
  readonly busy: boolean
  readonly saveStatus: SaveStatus
  readonly operationStage: OperationStage
  readonly lastError: ControllerError | null
  readonly lastSuccessfulInteraction: InteractionAcknowledgement | null
}

/**
 * Actions provided by the workbench controller.
 */
export type WorkbenchControllerActions = {
  // Lifecycle
  startRun: (setup?: AcidSetupParams, mode?: WorkbenchMode) => Promise<OrchestrationResult>
  loadRun: (attemptId: UUID) => Promise<OrchestrationResult>
  restartSameSetup: () => Promise<OrchestrationResult>
  beginNewSetup: () => void

  // Guided Commands
  selectNaohRoute: () => Promise<OrchestrationResult>
  calibrateMeter: () => Promise<OrchestrationResult>
  addBase: (aliquotL?: number) => Promise<OrchestrationResult>
  mixSample: () => Promise<OrchestrationResult>
  waitForStableReading: () => Promise<OrchestrationResult>
  measurePh: () => Promise<OrchestrationResult>
  addCorrectionAcid: (aliquotL?: number) => Promise<OrchestrationResult>

  // Explore Commands
  dispenseAndMeasure: (aliquotL?: number) => Promise<OrchestrationResult>

  // Common Commands
  undoLastAction: () => Promise<OrchestrationResult>
  completeRun: () => Promise<OrchestrationResult>

  // Operational Controls
  setMode: (mode: WorkbenchMode) => void
  setSetupDraft: (draft: AcidSetupParams | ((prev: AcidSetupParams) => AcidSetupParams)) => void
  setSelectedAliquot: (aliquotL: number) => void
  setStirrerRpm: (rpm: number) => void
  clearError: () => void
}

export type WorkbenchController = WorkbenchControllerState & WorkbenchControllerActions

export type WorkbenchControllerOptions = {
  session: AcidSession
  initialAttemptId?: string | null
  defaultMode?: WorkbenchMode
  defaultAliquotL?: number
  defaultStirrerRpm?: number
}
