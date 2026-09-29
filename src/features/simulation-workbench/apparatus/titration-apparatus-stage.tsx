import type { ReactElement } from 'react'
import type {
  InteractionAcknowledgement,
  OperationStage,
} from '../controller/types.js'
import {
  APPARATUS_CONSTANTS,
  calculateBeakerLiquid,
  calculateStirrerParams,
} from './geometry.js'
import { BuretteAssembly } from './burette-assembly.js'
import { ReactionBeaker } from './reaction-beaker.js'
import { PhProbe } from './ph-probe.js'
import { MagneticStirrer } from './magnetic-stirrer.js'
import { DropletStream } from './droplet-stream.js'

export type TitrationApparatusStageProps = {
  addedBaseVolumeMl: number
  totalVolumeMl: number
  stirrerRpm?: number
  stirrerActive?: boolean
  operationStage?: OperationStage
  lastSuccessfulInteraction?: InteractionAcknowledgement | null
  className?: string
}

/**
 * TitrationApparatusStage: Scalable interactive SVG laboratory apparatus for the VECLab Workbench.
 * (docs/web-application-scope.md §4.6, WB-R4).
 *
 * Professional digital laboratory aesthetic:
 * - 100 mL graduated dosing burette with rotating stopcock valve.
 * - 250 mL Pyrex reaction beaker with dynamic water-clear fill.
 * - Laboratory combination pH electrode.
 * - Magnetic stir plate and rotating stir bar with RPM visual telemetry.
 * - Droplet dispensing interaction acknowledgement.
 *
 * Prop-driven read model. Does not own or mutate chemistry state.
 */
export function TitrationApparatusStage({
  addedBaseVolumeMl,
  totalVolumeMl,
  stirrerRpm = 300,
  stirrerActive = false,
  operationStage = 'idle',
  lastSuccessfulInteraction = null,
  className = '',
}: TitrationApparatusStageProps): ReactElement {
  // Derive operational flags
  const isDispensing = operationStage === 'dispensing'
  const isMixing = operationStage === 'mixing' || stirrerActive
  const isCalibrating = operationStage === 'calibrating'
  const isMeasuring = operationStage === 'measuring'

  // Derive pure geometry values
  const beakerLiquid = calculateBeakerLiquid(totalVolumeMl)
  const stirrerParams = calculateStirrerParams(stirrerRpm, isMixing)

  // Token representing the latest committed addition to trigger droplet drop
  const additionToken =
    lastSuccessfulInteraction?.actionType === 'add_base'
      ? `${lastSuccessfulInteraction.sequence}-${lastSuccessfulInteraction.revision}`
      : null

  // Human-readable operational stage description
  const stageDescription = getStageDescription(operationStage)

  return (
    <div className={`wb-apparatus-stage-container ${className}`}>
      <svg
        viewBox={APPARATUS_CONSTANTS.VIEWBOX}
        className="wb-apparatus-svg"
        role="img"
        aria-label="Mô phỏng bộ dụng cụ chuẩn độ axit - bazơ gồm buret định mức, cốc phản ứng, máy khuấy từ và điện cực pH"
      >
        <title>Bộ dụng cụ chuẩn độ axit - bazơ VECLab</title>
        <desc>
          Buret chứa dung dịch NaOH đã thêm {addedBaseVolumeMl} mL. Cốc phản ứng chứa tổng thể tích{' '}
          {totalVolumeMl} mL với điện cực pH và máy khuấy từ. Trạng thái hiện tại: {stageDescription}.
        </desc>

        {/* ================= SVG DEFS & GRADIENTS ================= */}
        <defs>
          {/* Glass specular gradient */}
          <linearGradient id="wb-glass-sheen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
            <stop offset="25%" stopColor="rgba(255, 255, 255, 0.15)" />
            <stop offset="70%" stopColor="rgba(255, 255, 255, 0.05)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.35)" />
          </linearGradient>

          {/* Transparent Aqueous Solution Gradient (Water-clear with very subtle cyan hue) */}
          <linearGradient id="wb-aqueous-solution" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.08" />
            <stop offset="60%" stopColor="var(--cyan)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0.18" />
          </linearGradient>

          {/* Meniscus curvature filter / gradient */}
          <linearGradient id="wb-meniscus-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.2" />
          </linearGradient>

          {/* Stand Cast-Iron Textured Gradient */}
          <linearGradient id="wb-cast-iron" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--border-strong)" />
            <stop offset="40%" stopColor="var(--ink-muted)" />
            <stop offset="100%" stopColor="var(--ink)" />
          </linearGradient>

          {/* Steel Rod Specular Gradient */}
          <linearGradient id="wb-steel-rod" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--border)" />
            <stop offset="35%" stopColor="#ffffff" />
            <stop offset="65%" stopColor="var(--border-strong)" />
            <stop offset="100%" stopColor="var(--ink-faint)" />
          </linearGradient>

          {/* Stirrer Ceramic Top Plate Gradient */}
          <linearGradient id="wb-ceramic-plate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="var(--surface-3)" />
          </linearGradient>
        </defs>

        {/* ================= 1. APPARATUS BACKGROUND GRID / AXIS RULERS ================= */}
        <g className="wb-stage-backdrop" opacity={0.35} aria-hidden="true">
          <line x1={120} x2={680} y1={552} y2={552} stroke="var(--border)" strokeWidth={1} />
        </g>

        {/* ================= 2. RETORT STAND & MAGNETIC STIRRER ================= */}
        <MagneticStirrer
          stirrerRpm={stirrerRpm}
          isStirring={stirrerParams.isStirring}
        />

        {/* ================= 3. BURETTE ASSEMBLY (UPPER) ================= */}
        <BuretteAssembly
          addedBaseVolumeMl={addedBaseVolumeMl}
          isDispensing={isDispensing}
        />

        {/* ================= 4. REACTION BEAKER & STIR BAR ================= */}
        <ReactionBeaker
          totalVolumeMl={totalVolumeMl}
          isStirring={stirrerParams.isStirring}
          vortexIntensity={stirrerParams.vortexIntensity}
          stirDurationSeconds={stirrerParams.durationSeconds}
        />

        {/* ================= 5. PH ELECTRODE PROBE (SUBMERGED) ================= */}
        <PhProbe
          isSubmerged={beakerLiquid.isProbeSubmerged}
          isCalibrating={isCalibrating}
          isMeasuring={isMeasuring}
        />

        {/* ================= 6. DROPLET STREAM (INTERACTION ACKNOWLEDGEMENT) ================= */}
        <DropletStream
          isDispensing={isDispensing}
          originX={APPARATUS_CONSTANTS.BURETTE_CENTER_X}
          originY={APPARATUS_CONSTANTS.BURETTE_TIP_Y}
          targetY={beakerLiquid.surfaceY}
          triggerToken={additionToken}
        />

        {/* ================= 7. COMPACT APPARATUS STATUS CHIP (TOP RIGHT) ================= */}
        <g transform="translate(620, 48)" className="wb-stage-status-badge" aria-hidden="true">
          <rect
            x={0}
            y={0}
            width={130}
            height={26}
            rx={13}
            className="wb-status-badge-bg"
          />
          <circle
            cx={13}
            cy={13}
            r={4}
            className={`wb-status-badge-dot ${operationStage !== 'idle' ? 'is-active' : ''}`}
          />
          <text
            x={24}
            y={16.5}
            fontSize={9.5}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            className="wb-status-badge-text"
          >
            {stageDescription}
          </text>
        </g>
      </svg>
    </div>
  )
}

function getStageDescription(stage: OperationStage): string {
  switch (stage) {
    case 'starting':
      return 'Khởi tạo thí nghiệm'
    case 'selecting_route':
      return 'Chọn chất chuẩn độ'
    case 'calibrating':
      return 'Hiệu chuẩn điện cực'
    case 'dispensing':
      return 'Đang cấp dung dịch'
    case 'mixing':
      return 'Đang khuấy mẫu'
    case 'stabilizing':
      return 'Chờ đọc ổn định'
    case 'measuring':
      return 'Đo pH'
    case 'undoing':
      return 'Hoàn tác thao tác'
    case 'completing':
      return 'Hoàn thành lượt đo'
    case 'reloading':
      return 'Đang tải lại'
    case 'idle':
    default:
      return 'Sẵn sàng tương tác'
  }
}
