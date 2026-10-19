'use client'

import { useId } from 'react'
import type {
  PlasticProjection,
  PolymerVisualLocation,
} from '@/application/scenarios/plastic-projection.js'
import {
  VIRGIN_POLYMERS,
  type PolymerId,
} from '@/domain/experiments/virgin-plastic-separation/index.js'
import styles from './workbench.module.css'

type ApparatusProps = {
  projection: PlasticProjection
  phaseOneVisual?: 'idle' | 'trays' | 'loading-trays' | 'prepared' | 'water-rising' | 'pouring' | 'mixing'
  centrifugeVisual?: 'idle' | 'loading' | 'spinning' | 'transferring' | 'complete'
  branchSeparationVisual?: 'idle' | 'mixing' | 'separating' | 'ready'
  tankParticleSeed?: number
  onSelectPolymer?: (polymerId: PolymerId) => void
  selectedPolymerId?: PolymerId | null
  activeCue?: { id: string; actionType: string; message: string } | null
}

// Particle shape rendering
function renderParticleShape(
  shape: 'pellet' | 'sphere' | 'rectangle' | 'cylinder',
  x: number,
  y: number,
  color: string,
  stroke: string,
  key: string | number,
) {
  switch (shape) {
    case 'pellet': // Oval / rounded bead for PP and HDPE
      return (
        <ellipse
          key={key}
          cx={x}
          cy={y}
          rx={5.5}
          ry={3.8}
          fill={color}
          stroke={stroke}
          strokeWidth="1.2"
        />
      )
    case 'sphere': // Circle with shine for PS and ABS
      return (
        <g key={key}>
          <circle cx={x} cy={y} r={4.8} fill={color} stroke={stroke} strokeWidth="1.2" />
          <circle cx={x - 1.5} cy={y - 1.5} r={1.2} fill="#ffffff" fillOpacity="0.8" />
        </g>
      )
    case 'rectangle': // Granule for PA
      return (
        <rect
          key={key}
          x={x - 5}
          y={y - 3.5}
          width={10}
          height={7}
          rx={1}
          fill={color}
          stroke={stroke}
          strokeWidth="1.2"
        />
      )
    case 'cylinder': // Cylinder / capsule for PC
      return (
        <rect
          key={key}
          x={x - 3.5}
          y={y - 6}
          width={7}
          height={12}
          rx={3}
          fill={color}
          stroke={stroke}
          strokeWidth="1.2"
        />
      )
  }
}

// Base cluster offsets for 6 particles per polymer
const PARTICLE_OFFSETS = [
  { dx: -10, dy: -3 },
  { dx: 0, dy: -5 },
  { dx: 11, dy: -2 },
  { dx: -6, dy: 4 },
  { dx: 7, dy: 3 },
  { dx: 0, dy: 6 },
]
const TANK_PARTICLES_PER_POLYMER = 24

function getTankParticleOffsets(id: PolymerId, layoutSeed: number) {
  const polymerIndex = VIRGIN_POLYMERS.findIndex((polymer) => polymer.id === id)
  let seed = Math.floor(Math.abs(layoutSeed) * 1_000_000_000) + 1
  const random = () => {
    seed = (seed * 48271) % 2147483647
    return seed / 2147483647
  }
  const gridSize = 12
  const shuffledCells = Array.from({ length: gridSize * gridSize }, (_, index) => {
    const column = index % gridSize
    const row = Math.floor(index / gridSize)
    return {
      x: column + 0.5 + (random() - 0.5) * 1.7,
      y: row + 0.5 + (random() - 0.5) * 1.7,
    }
  })
  for (let index = shuffledCells.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const currentCell = shuffledCells[index] ?? { x: 0.5, y: 0.5 }
    const swapCell = shuffledCells[swapIndex] ?? { x: 0.5, y: 0.5 }
    shuffledCells[index] = swapCell
    shuffledCells[swapIndex] = currentCell
  }

  return shuffledCells
    .slice(polymerIndex * TANK_PARTICLES_PER_POLYMER, (polymerIndex + 1) * TANK_PARTICLES_PER_POLYMER)
    .map((cell) => {
    return {
      dx: -122 + cell.x * (244 / gridSize),
      dy: -102 + cell.y * (204 / gridSize),
    }
  })
}

function getWaterBandOffsets(id: PolymerId, layoutSeed: number, floats: boolean) {
  const polymerIndex = VIRGIN_POLYMERS.findIndex((polymer) => polymer.id === id)
  let seed = Math.floor(Math.abs(layoutSeed + (polymerIndex + 1) * 0.137) * 1_000_000_000) + 1
  const random = () => {
    seed = (seed * 48271) % 2147483647
    return seed / 2147483647
  }
  const columns = 6
  const cells = Array.from({ length: TANK_PARTICLES_PER_POLYMER }, (_, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    return {
      x: column + 0.5 + (random() - 0.5) * 0.55,
      y: row + 0.5 + (random() - 0.5) * 0.55,
    }
  })
  for (let index = cells.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const currentCell = cells[index] ?? { x: 0.5, y: 0.5 }
    const swapCell = cells[swapIndex] ?? { x: 0.5, y: 0.5 }
    cells[index] = swapCell
    cells[swapIndex] = currentCell
  }
  return cells.map((cell) => ({
    dx: -112 + cell.x * (224 / columns),
    dy: floats ? -112 + cell.y * 22 : 70 + cell.y * 22,
  }))
}

function getBranchSeparationOffsets(
  id: PolymerId,
  layoutSeed: number,
  floats: boolean,
  leavesPpResidue: boolean,
) {
  const offsets = getWaterBandOffsets(id, layoutSeed, floats)
  if (!floats || id !== 'PP' || !leavesPpResidue) return offsets

  const sinkingOffsets = getWaterBandOffsets(id, layoutSeed + 0.413, false)
  return offsets.map((offset, index) => index >= offsets.length - 3 ? sinkingOffsets[index] : offset)
}

function getTrayPellets(id: PolymerId) {
  const polymerIndex = VIRGIN_POLYMERS.findIndex((polymer) => polymer.id === id)
  let seed = (polymerIndex + 7) * 7919
  const random = () => {
    seed = (seed * 48271) % 2147483647
    return seed / 2147483647
  }
  return Array.from({ length: 38 }, () => {
    const y = 34 + random() * 52
    return {
      x: 30 + random() * 210,
      y,
      rotation: Math.round(random() * 160 - 80),
    }
  })
}

function getCentrifugeOffsets(id: PolymerId, seedValue: number, weighing: boolean, splitScales: boolean) {
  const polymerIndex = id === 'PP' ? 0 : 1
  let seed = Math.floor(Math.abs(seedValue + (polymerIndex + 1) * 0.391) * 1_000_000_000) + 1
  const random = () => {
    seed = (seed * 48271) % 2147483647
    return seed / 2147483647
  }
  return Array.from({ length: TANK_PARTICLES_PER_POLYMER }, (_, index) => {
    if (weighing) {
      if (splitScales) {
        const column = index % 6
        const row = Math.floor(index / 6)
        return { dx: -35 + column * 14 + (random() - 0.5) * 8, dy: -13 + row * 9 + (random() - 0.5) * 7 }
      }
      const column = index % 8
      const row = Math.floor(index / 8)
      return { dx: -72 + column * 20 + (random() - 0.5) * 11, dy: -22 + row * 13 + (random() - 0.5) * 9 }
    }
    const angle = random() * Math.PI * 2
    const radius = 24 + Math.sqrt(random()) * 61
    return { dx: Math.cos(angle) * radius, dy: Math.sin(angle) * radius * 0.64 }
  })
}

export function PlasticSeparationApparatus({
  projection,
  phaseOneVisual = 'idle',
  centrifugeVisual = 'idle',
  branchSeparationVisual = 'idle',
  tankParticleSeed = 1,
  onSelectPolymer,
  selectedPolymerId,
  activeCue,
}: ApparatusProps) {
  const uid = useId().replace(/:/g, '')
  const branchMode =
    projection.activeBranch !== null &&
    (projection.stage === 'ethanol_branch' ||
      projection.stage === 'nacl_branch' ||
      (projection.stage === 'centrifugation' && projection.pendingCentrifugation))
  const activeBranchPolymerIds: readonly PolymerId[] =
    projection.activeBranch === 'light' ? ['PP', 'HDPE'] : ['PS', 'ABS', 'PA', 'PC']
  const showSeparateNacl40Balances =
    projection.lastOutcome?.kind === 'nacl_40' &&
    (projection.pendingCentrifugation || (
      projection.weighedFractions.PA !== undefined &&
      projection.weighedFractions.PC !== undefined
    ))

  // Coordinate mapper based on polymer and its location
  function getPolymerClusterCenter(id: PolymerId, location: PolymerVisualLocation): { x: number; y: number } {
    const polymerIndex = VIRGIN_POLYMERS.findIndex((p) => p.id === id)

    if (location === 'tray') {
      const column = polymerIndex % 3
      const row = Math.floor(polymerIndex / 3)
      return { x: 190 + column * 280, y: 77 + row * 59 }
    }

    if (location === 'tank_mixing') {
      return { x: 350, y: 300 }
    }

    if (location === 'water_floating') {
      return { x: 350, y: 300 }
    }

    if (location === 'water_sinking') {
      return { x: 350, y: 300 }
    }

    if (location === 'centrifuged') {
      if (branchMode) {
        const branchIndex = activeBranchPolymerIds.indexOf(id)
        return {
          x: projection.activeBranch === 'light' ? 445 + branchIndex * 70 : 360 + branchIndex * 75,
          y: 300 + (branchIndex % 2) * 18,
        }
      }
      if (showSeparateNacl40Balances && (id === 'PA' || id === 'PC')) {
        return { x: id === 'PA' ? 810 : 900, y: 315 }
      }
      const weighedIndex = projection.weighedPolymerIds.indexOf(id)
      const panCount = projection.weighedPolymerIds.length
      return { x: panCount > 1 ? 840 + weighedIndex * 50 : 865, y: 315 }
    }

    if (location === 'separated_floating') {
      const branchIndex = activeBranchPolymerIds.indexOf(id)
      const x = projection.activeBranch === 'light' ? 445 + branchIndex * 70 : 360 + branchIndex * 75
      return { x, y: projection.activeBranch === 'light' && id === 'PP' ? 194 : 198 }
    }

    if (location === 'separated_sinking') {
      const branchIndex = activeBranchPolymerIds.indexOf(id)
      const x = projection.activeBranch === 'light' ? 445 + branchIndex * 70 : 360 + branchIndex * 75
      return { x, y: 410 }
    }

    if (location === 'collected') {
      if (showSeparateNacl40Balances && (id === 'PA' || id === 'PC')) {
        return { x: id === 'PA' ? 810 : 900, y: 315 }
      }
      const weighedIndex = projection.weighedPolymerIds.indexOf(id)
      const panCount = projection.weighedPolymerIds.length
      return { x: panCount > 1 ? 840 + weighedIndex * 50 : 865, y: 315 }
    }

    return { x: 100, y: 100 }
  }

  const isPhaseOne = projection.stage === 'preparation'
  const isBranchIntroSequence =
    (projection.stage === 'ethanol_branch' || projection.stage === 'nacl_branch') &&
    (phaseOneVisual === 'water-rising' || phaseOneVisual === 'pouring' || phaseOneVisual === 'mixing')
  const isInitialBranchDistribution =
    (projection.stage === 'ethanol_branch' && projection.ethanolProgress === 0) ||
    (projection.stage === 'nacl_branch' && projection.naclProgress === 0) ||
    isBranchIntroSequence
  const isAgitating =
    ((projection.stage === 'wetting' || isInitialBranchDistribution) && phaseOneVisual === 'mixing') ||
    (projection.pendingCentrifugation && activeCue?.actionType.startsWith('run_') === true && branchSeparationVisual === 'mixing')
  const isBranchWaterRising = isInitialBranchDistribution && phaseOneVisual === 'water-rising'
  const isBranchStage = projection.stage === 'ethanol_branch' || projection.stage === 'nacl_branch'
  // The centrifuge scene belongs to the initial PP + HDPE weighing step only.
  // Once a branch is selected, return to the pilot tank. Reopen the scene only
  // when the branch result is ready to be centrifuged and weighed.
  const showCentrifugeScene = centrifugeVisual !== 'idle' && (
    projection.stage === 'branch_selection' || (isBranchStage && projection.centrifuged && !projection.pendingCentrifugation)
  )
  const showBranchSeparation = projection.stage === 'centrifugation' && projection.pendingCentrifugation && projection.activeBranch !== null && branchSeparationVisual !== 'idle'
  const showingTrayPreparation = isPhaseOne && projection.samplesPrepared && !projection.wetted
  const showingTankSequence = phaseOneVisual === 'water-rising' || phaseOneVisual === 'pouring' || phaseOneVisual === 'mixing'
  const showPilotTank = !isPhaseOne || showingTankSequence
  const showAgitator = !isPhaseOne && !showCentrifugeScene &&
    (projection.stage !== 'wetting' || phaseOneVisual === 'mixing') &&
    (!isInitialBranchDistribution || phaseOneVisual === 'mixing')
  const isTankFilled = projection.tankLoaded && projection.stage !== 'preparation'
  const showBranchColumn = false
  const tankFill = projection.activeBranch === 'light'
    ? `url(#${uid}-ethanol-fill)`
    : projection.activeBranch === 'heavy'
      ? `url(#${uid}-nacl-fill)`
      : `url(#${uid}-water-fill)`
  const tankMeniscus = projection.activeBranch === 'light'
    ? '#d8b4fe'
    : projection.activeBranch === 'heavy'
      ? '#5eead4'
      : '#7dd3fc'
  const showingEthanol23Separation =
    projection.activeBranch === 'light' &&
    projection.ethanolProgress === 1 &&
    (projection.stage === 'ethanol_branch' ||
      (projection.stage === 'centrifugation' && projection.pendingCentrifugation))
  const showingEthanol31Separation =
    projection.activeBranch === 'light' &&
    projection.ethanolProgress === 2 &&
    (projection.stage === 'ethanol_branch' ||
      (projection.stage === 'centrifugation' && projection.pendingCentrifugation))
  const getBranchResultFloat = (id: PolymerId): boolean | null => {
    if (projection.activeBranch === 'light') {
      if (id === 'PP') return true
      if (id === 'HDPE') return false
      return null
    }

    if (projection.activeBranch === 'heavy') {
      if (projection.naclProgress === 1) return id === 'PS' ? true : false
      if (projection.naclProgress === 2) return id === 'ABS' ? true : false
      if (projection.naclProgress === 3) return id === 'PA' ? true : false
    }

    return null
  }
  const isBranchResult =
    (isBranchStage || (projection.stage === 'centrifugation' && projection.pendingCentrifugation)) &&
    !isInitialBranchDistribution &&
    projection.activeBranch !== null
  const isCentrifugeTransferInFlight = showCentrifugeScene && centrifugeVisual === 'transferring'

  return (
    <div className={styles.apparatusWrapper}>
      <svg
        viewBox="0 0 960 540"
        className={styles.apparatusSvg}
        role="img"
        aria-label="Sơ đồ thiết bị phân loại nhựa nguyên sinh: bể pilot 800 L hữu ích, cánh khuấy 160 rpm và trạm ly tâm cân mẫu"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id={`${uid}-tank-glass`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.75" />
            <stop offset="8%" stopColor="#f8fafc" stopOpacity="0.4" />
            <stop offset="92%" stopColor="#f8fafc" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.75" />
          </linearGradient>

          <linearGradient id={`${uid}-water-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#0284c7" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.65" />
          </linearGradient>

          <linearGradient id={`${uid}-ethanol-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#7e22ce" stopOpacity="0.5" />
          </linearGradient>

          <linearGradient id={`${uid}-nacl-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0f766e" stopOpacity="0.55" />
          </linearGradient>

          <linearGradient id={`${uid}-steel`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="45%" stopColor="#e2e8f0" />
            <stop offset="70%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>

          <linearGradient id={`${uid}-tray-rim`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="18%" stopColor="#aebbc4" />
            <stop offset="42%" stopColor="#f8fafc" />
            <stop offset="72%" stopColor="#98a6b1" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
          <linearGradient id={`${uid}-tray-floor`} x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#dfe5e8" />
            <stop offset="48%" stopColor="#f8fafb" />
            <stop offset="100%" stopColor="#b7c1c7" />
          </linearGradient>

          {/* Clip path for 800L tank contents */}
          <clipPath id={`${uid}-tank-clip`}>
            <path d="M 202 180 L 498 180 L 498 420 Q 498 440 478 440 L 222 440 Q 202 440 202 420 Z" />
          </clipPath>

          {/* Same tank coordinates after the pilot vessel is translated into the center stage. */}
          <clipPath id={`${uid}-tank-screen-clip`}>
            <path d="M 332 180 L 628 180 L 628 420 Q 628 440 608 440 L 352 440 Q 332 440 332 420 Z" />
          </clipPath>

          <clipPath id={`${uid}-rotor-clip`}>
            <circle cx="355" cy="282" r="80" />
          </clipPath>

          {/* Clip path for branch vessel contents */}
          <clipPath id={`${uid}-branch-clip`}>
            <rect x="602" y="190" width="146" height="230" rx="12" />
          </clipPath>

          {/* Drop shadow */}
          <filter id={`${uid}-shadow`} x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* Background stage grid & platform */}
        <rect x="0" y="0" width="960" height="540" fill="var(--surface-2)" />
        <line x1="40" y1="465" x2="920" y2="465" stroke="var(--border-strong)" strokeWidth="3" />
        <rect x="40" y="465" width="880" height="15" fill="var(--surface-3)" />

        {/* -------------------------------------------------------------
            STAGE 0: SIX STAINLESS SAMPLE TRAYS
           ------------------------------------------------------------- */}
        {showingTrayPreparation && !branchMode && <g id={`${uid}-preparation-shelf`}>
          <rect x="50" y="18" width="860" height="322" rx="10" fill="var(--surface)" stroke="var(--border)" filter={`url(#${uid}-shadow)`} />
          <text x="66" y="39" fill="var(--ink-muted)" fontSize="10.5" fontWeight="600" letterSpacing="0.5">
            SÁU KHAY MẪU POLYMER NGUYÊN SINH · 2,0 kg MỖI MẪU
          </text>

          {VIRGIN_POLYMERS.map((polymer, idx) => {
            const column = idx % 3
            const row = Math.floor(idx / 3)
            const startX = 66 + column * 282
            const startY = 49 + row * 140
            const isSelected = selectedPolymerId === polymer.id
            return (
              <g
                key={polymer.id}
                id={`tray-${polymer.id}`}
                className={`${styles.trayInteractive} ${phaseOneVisual === 'trays' || phaseOneVisual === 'loading-trays' ? styles.trayEntering : ''}`}
                style={{ animationDelay: `${idx * 110}ms` }}
                onClick={() => onSelectPolymer?.(polymer.id)}
                role="button"
                tabIndex={0}
                aria-label={`Mẫu ${polymer.id}: ${polymer.name}, khối lượng riêng ${polymer.nominalDensity}`}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelectPolymer?.(polymer.id)
                  }
                }}
              >
                <g transform={`translate(${startX}, ${startY})`}>
                  <path d="M 23 14 Q 13 14 11 24 L 5 92 Q 4 103 17 106 L 249 106 Q 262 103 260 92 L 254 24 Q 252 14 242 14 Z" fill="#5f6c73" opacity=".26" transform="translate(0 3)" />
                  <path d="M 23 12 Q 13 12 11 23 L 5 91 Q 4 102 17 105 L 249 105 Q 262 102 260 91 L 254 23 Q 252 12 242 12 Z" fill={`url(#${uid}-tray-rim)`} stroke={isSelected ? 'var(--accent)' : '#8998a1'} strokeWidth={isSelected ? '2.4' : '1.4'} />
                  <path d="M 31 25 Q 25 25 24 33 L 19 84 Q 18 92 27 94 L 239 94 Q 247 92 246 84 L 241 33 Q 240 25 234 25 Z" fill={`url(#${uid}-tray-floor)`} stroke="#89969d" strokeWidth="1" />
                  <path d="M 26 26 Q 28 20 35 20 L 232 20 Q 240 20 243 27" fill="none" stroke="#ffffff" strokeOpacity=".9" strokeWidth="2.2" />
                  <path d="M 19 87 Q 19 96 29 98 L 237 98 Q 246 96 246 87" fill="none" stroke="#7c8991" strokeOpacity=".65" strokeWidth="2" />
                  {(phaseOneVisual === 'loading-trays' || phaseOneVisual === 'prepared') && getTrayPellets(polymer.id).map((pellet, particleIndex) => (
                    <g
                      key={`${polymer.id}-tray-particle-${particleIndex}`}
                      transform={`translate(${pellet.x} ${pellet.y}) rotate(${pellet.rotation})`}
                    >
                      <g
                        className={phaseOneVisual === 'loading-trays' ? styles.trayPelletsFalling : undefined}
                        style={{ animationDelay: `${idx * 130 + particleIndex * 12}ms` }}
                      >
                        {renderParticleShape(polymer.particleShape, 0, 0, polymer.colorHex, polymer.strokeHex, `${polymer.id}-pellet-shape-${particleIndex}`)}
                      </g>
                    </g>
                  ))}
                </g>
              </g>
            )
          })}
        </g>}

        {/* -------------------------------------------------------------
            CENTRAL PILOT TANK (800L USEFUL VOLUME)
           ------------------------------------------------------------- */}
          {showPilotTank && !showCentrifugeScene && <g id={`${uid}-pilot-tank-group`} transform='translate(130 0)'>
          {/* Tank Stand */}
          <rect x="235" y="440" width="230" height="25" rx="3" fill="#64748b" />
          <line x1="280" y1="440" x2="260" y2="465" stroke="#475569" strokeWidth="4" />
          <line x1="420" y1="440" x2="440" y2="465" stroke="#475569" strokeWidth="4" />

          {/* Tank Liquid Fill */}
          {isTankFilled && (
            <g clipPath={`url(#${uid}-tank-clip)`}>
              <g className={phaseOneVisual === 'water-rising' ? styles.liquidRising : undefined}>
              <rect x="202" y="180" width="296" height="260" fill={tankFill} />
              {/* Surface meniscus wave */}
              <path
                d="M 202 185 Q 276 181 350 185 T 498 185 L 498 200 L 202 200 Z"
                fill={tankMeniscus}
                fillOpacity="0.6"
                className={phaseOneVisual === 'mixing' ? styles.movingSurface : undefined}
              />
              </g>
            </g>
          )}

          {/* Agitator & Motor */}
          {showAgitator && <g id={`${uid}-agitator-assembly`}>
            {/* Top motor mount */}
            <rect x="315" y="112" width="70" height="32" rx="4" fill="#334155" stroke="#1e293b" />
            <rect x="325" y="105" width="50" height="7" rx="2" fill="#475569" />
            <text x="350" y="132" fill="#f8fafc" fontSize="10" fontWeight="700" textAnchor="middle">
              160 rpm
            </text>

            {/* Shaft */}
            <rect x="347" y="144" width="6" height="235" fill={`url(#${uid}-steel)`} stroke="#475569" strokeWidth="0.8" />

            {/* Impeller Blades */}
            <g transform="translate(350, 375)">
              <g className={isAgitating ? styles.impellerSpinning : undefined} data-testid="plastic-paddle">
                <path d="m-66 -8 61 4v16l-61-4Z" fill="#638797" stroke="#426a7d" />
                <path d="m5 -4 61-4v16L5 16Z" fill="#a9c1cb" stroke="#426a7d" />
                <path d="m-62 -5 57 4m10 0 57-4" stroke="#d9e8ed" strokeWidth="1.2" />
                <rect x="-5" y="-8" width="10" height="24" rx="2" fill="#557586" stroke="#36596a" strokeWidth="1" />
              </g>
            </g>
          </g>}

          {/* Tank Outer Shell (Transparent Glass) */}
          <path
            d="M 200 170 L 500 170 L 500 420 Q 500 442 478 442 L 222 442 Q 200 442 200 420 Z"
            fill={`url(#${uid}-tank-glass)`}
            stroke="#94a3b8"
            strokeWidth="3"
            filter={`url(#${uid}-shadow)`}
          />
          {/* Glass highlights */}
          <line x1="208" y1="180" x2="208" y2="420" stroke="#ffffff" strokeWidth="3" strokeOpacity="0.8" />
          <line x1="492" y1="180" x2="492" y2="420" stroke="#94a3b8" strokeWidth="1.5" strokeOpacity="0.5" />

          {/* Tank Label */}
          <text x="350" y="165" fill="#1e293b" fontSize="12" fontWeight="700" textAnchor="middle">
            {projection.activeBranch === 'light'
              ? 'BỂ PILOT ETHANOL (800 L hữu ích)'
              : projection.activeBranch === 'heavy'
                ? 'BỂ PILOT NaCl (800 L hữu ích)'
                : 'BỂ PILOT TÁCH NƯỚC (800 L hữu ích)'}
          </text>
        </g>}

        {/* -------------------------------------------------------------
            STAGE 5: SECONDARY SEPARATION VESSEL (BRANCH: ETHANOL / NACL)
           ------------------------------------------------------------- */}
        {showBranchColumn && (
        <g
          id={`${uid}-branch-separation-column`}
          transform={branchMode ? 'translate(-330, -60) scale(1.2)' : undefined}
        >
            {/* Pipe from pilot tank to branch vessel */}
            {!branchMode && <path
              d="M 500 220 L 550 220 L 550 260 L 600 260"
              fill="none"
              stroke="#64748b"
              strokeWidth="5"
              strokeLinejoin="round"
            />}
            {/* Valve indicator */}
            {!branchMode && <circle cx="550" cy="240" r="7" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />}

            {/* Vessel Glass Body */}
            <rect
              x="600"
              y="180"
              width="150"
              height="250"
              rx="12"
              fill={`url(#${uid}-tank-glass)`}
              stroke="#64748b"
              strokeWidth="2.5"
              filter={`url(#${uid}-shadow)`}
            />

            {/* Fluid fill */}
            <g clipPath={`url(#${uid}-branch-clip)`}>
              <rect
                x="600"
                y="190"
                width="150"
                height="240"
                fill={
                  projection.activeBranch === 'light'
                    ? `url(#${uid}-ethanol-fill)`
                    : `url(#${uid}-nacl-fill)`
                }
              />
              <path
                d="M 602 195 Q 638 192 675 195 T 748 195 L 748 205 L 602 205 Z"
                fill="#ffffff"
                fillOpacity="0.4"
              />
            </g>

            {/* Column Header & Medium Label */}
            <rect x="610" y="145" width="130" height="28" rx="5" fill="var(--ink)" />
            <text x="675" y="163" fill="#ffffff" fontSize="10.5" fontWeight="700" textAnchor="middle">
              {projection.activeBranch === 'light' ? 'CỘT ETHANOL' : 'CỘT MUỐI NaCl'}
            </text>

            {/* Medium Info Tag */}
            {!branchMode && <>
              <rect x="615" y="435" width="120" height="24" rx="4" fill="var(--surface-3)" stroke="var(--border)" />
              <text x="675" y="451" fill="var(--ink)" fontSize="9.5" fontWeight="600" textAnchor="middle">
                {projection.lastOutcome?.mediumVi ?? 'Chọn nồng độ'}
              </text>
            </>}

          </g>
        )}

        {showCentrifugeScene && <g id={`${uid}-initial-centrifuge-scene`}>
          <text x="480" y="56" textAnchor="middle" fill="var(--ink)" fontSize="17" fontWeight="700">
            {centrifugeVisual === 'loading'
              ? 'Đang nạp mẫu phân đoạn vào rotor'
              : centrifugeVisual === 'spinning'
                ? 'Ly tâm phân đoạn ở 2.950 rpm'
                : centrifugeVisual === 'transferring'
                  ? 'Chuyển hạt sau ly tâm sang khay cân'
                  : 'Khối lượng phân đoạn đã chọn'}
          </text>
          <text x="480" y="77" textAnchor="middle" fill="var(--ink-muted)" fontSize="11">
            {centrifugeVisual === 'spinning' ? 'Thời gian mô phỏng: 3 giây' : projection.activeBranch ? 'Phân đoạn của nhánh dung dịch' : 'Phân đoạn nổi từ bước tách nước'}
          </text>

          <g className={`${styles.centrifugeMachine} ${centrifugeVisual === 'transferring' || centrifugeVisual === 'complete' ? styles.centrifugeMachineShift : ''}`}>
            <rect x="135" y="375" width="445" height="32" rx="8" fill="#64748b" />
            <rect x="155" y="166" width="405" height="222" rx="28" fill="#dbe7ee" stroke="#71859a" strokeWidth="5" />
            <rect x="169" y="180" width="377" height="192" rx="20" fill="#f8fafc" stroke="#a8bac7" strokeWidth="2" />
            <path d="M 175 198 Q 355 164 540 198" fill="none" stroke="#ffffff" strokeWidth="7" opacity=".9" />
            <rect x="145" y="145" width="425" height="35" rx="12" fill="#64748b" stroke="#475569" strokeWidth="3" />
            <rect x="174" y="151" width="367" height="14" rx="7" fill="#cbd5e1" />
            <circle cx="355" cy="282" r="102" fill="#d8e2eb" stroke="#8da0b2" strokeWidth="4" />
            <circle cx="355" cy="282" r="82" fill="#f8fafc" stroke="#b6c4d1" strokeWidth="2" />
            <g className={centrifugeVisual === 'spinning' ? styles.centrifugeRotorSpinning : undefined}>
              <circle cx="355" cy="282" r="14" fill="#475569" />
              {[0, 90, 180, 270].map((angle) => (
                <g key={angle} transform={`rotate(${angle} 355 282)`}>
                  <rect x="345" y="205" width="20" height="40" rx="8" fill="#94a3b8" stroke="#64748b" strokeWidth="2" />
                  <rect x="338" y="216" width="34" height="13" rx="5" fill="#475569" />
                </g>
              ))}
            </g>
            <rect x="266" y="335" width="178" height="22" rx="5" fill="#1e293b" />
            <text x="355" y="350" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">LY TÂM · 2.950 rpm</text>
          </g>

          {!showSeparateNacl40Balances && <g className={`${styles.weighingStation} ${centrifugeVisual === 'transferring' || centrifugeVisual === 'complete' ? styles.weighingStationVisible : ''}`}>
            <rect x="660" y="183" width="245" height="248" rx="18" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="2" filter={`url(#${uid}-shadow)`} />
            <rect x="690" y="202" width="185" height="56" rx="8" fill="#0f172a" />
            <text x="782" y="237" textAnchor="middle" fill="#4ade80" fontFamily="monospace" fontSize="22" fontWeight="700">
              {centrifugeVisual === 'complete' && projection.weighedMassKg !== null
                ? `≈ ${projection.weighedMassKg.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`
                : 'ĐANG CÂN'}
            </text>
            <text x="782" y="278" textAnchor="middle" fill="var(--ink-muted)" fontSize="10" fontWeight="700">CÂN PHÂN ĐOẠN</text>
            <path d="M 686 314 L 878 314 L 862 355 Q 782 373 702 355 Z" fill={`url(#${uid}-tray-rim)`} stroke="#718096" strokeWidth="3" />
            <path d="M 703 320 L 860 320 L 849 348 Q 782 362 714 348 Z" fill={`url(#${uid}-tray-floor)`} stroke="#9aa8b2" />
            {centrifugeVisual === 'complete' && projection.weighedRecoveryPercent !== null && <>
              <text x="782" y="389" textAnchor="middle" fill="var(--accent)" fontSize="13" fontWeight="700">Thu hồi {projection.weighedRecoveryPercent.toLocaleString('vi-VN')}%</text>
              <text x="782" y="411" textAnchor="middle" fill="var(--ink-muted)" fontSize="9">Giá trị quy đổi theo bài báo</text>
            </>}
          </g>}

          {showSeparateNacl40Balances && (['PA', 'PC'] as const).map((polymerId) => {
            const centerX = polymerId === 'PA' ? 690 : 850
            const readout = projection.weighedFractions[polymerId]
            return (
              <g key={`large-scale-${polymerId}`} className={`${styles.weighingStation} ${centrifugeVisual === 'transferring' || centrifugeVisual === 'complete' ? styles.weighingStationVisible : ''}`}>
                <rect x={centerX - 66} y="183" width="132" height="248" rx="14" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="2" filter={`url(#${uid}-shadow)`} />
                <rect x={centerX - 56} y="202" width="112" height="48" rx="7" fill="#0f172a" />
                <text x={centerX} y="232" textAnchor="middle" fill="#4ade80" fontFamily="monospace" fontSize="14" fontWeight="700">
                  {centrifugeVisual === 'complete' && readout ? `≈ ${readout.massKg.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg` : 'ĐANG CÂN'}
                </text>
                <text x={centerX} y="273" textAnchor="middle" fill="var(--ink-muted)" fontSize="10" fontWeight="700">CÂN {polymerId}</text>
                <path d={`M ${centerX - 55} 314 L ${centerX + 55} 314 L ${centerX + 46} 353 Q ${centerX} 366 ${centerX - 46} 353 Z`} fill={`url(#${uid}-tray-rim)`} stroke="#718096" strokeWidth="2.5" />
                <path d={`M ${centerX - 45} 320 L ${centerX + 45} 320 L ${centerX + 38} 347 Q ${centerX} 358 ${centerX - 38} 347 Z`} fill={`url(#${uid}-tray-floor)`} stroke="#9aa8b2" />
                {centrifugeVisual === 'complete' && readout && <>
                  <text x={centerX} y="390" textAnchor="middle" fill="var(--accent)" fontSize="12" fontWeight="700">Thu hồi {readout.recoveryPercent.toLocaleString('vi-VN')}%</text>
                  <text x={centerX} y="411" textAnchor="middle" fill="var(--ink-muted)" fontSize="8">Giá trị quy đổi theo bài báo</text>
                </>}
              </g>
            )
          })}
        </g>}

        {/* -------------------------------------------------------------
            DYNAMIC POLYMER PARTICLES
           ------------------------------------------------------------- */}
        <g
          id={`${uid}-polymer-particles-layer`}
          transform={showCentrifugeScene || branchMode ? undefined : 'translate(130 0)'}
          clipPath={showCentrifugeScene
            ? centrifugeVisual === 'complete' ? undefined : `url(#${uid}-rotor-clip)`
            : `url(#${uid}-${branchMode ? 'tank-screen-clip' : 'tank-clip'})`}
        >
          {projection.polymers.map((poly) => {
            if (isCentrifugeTransferInFlight) return null
            if (showCentrifugeScene && !projection.weighedPolymerIds.includes(poly.id)) return null
            if (poly.location === 'tray' || (poly.location === 'tank_mixing' && phaseOneVisual !== 'pouring' && phaseOneVisual !== 'mixing')) return null
            if (branchMode && !activeBranchPolymerIds.includes(poly.id)) return null
            if (isBranchWaterRising && activeBranchPolymerIds.includes(poly.id)) return null
            if (poly.location === 'centrifuged' && !branchMode && !projection.weighedPolymerIds.includes(poly.id)) return null
            if (poly.location === 'collected' && !isInitialBranchDistribution && !projection.weighedPolymerIds.includes(poly.id)) return null
            const centrifugeTransferDone = centrifugeVisual === 'complete'
            const isBranchTarget = showBranchSeparation && (poly.location === 'separated_floating' || poly.location === 'separated_sinking')
            const branchResultFloats = isBranchResult ? getBranchResultFloat(poly.id) : null
            const isBranchResultParticle = branchResultFloats !== null
            const center = showCentrifugeScene
              ? centrifugeTransferDone
                ? showSeparateNacl40Balances ? { x: poly.id === 'PA' ? 690 : 850, y: 331 } : { x: 782, y: 331 }
                : { x: 355, y: 282 }
              : isBranchTarget
                ? { x: 480, y: 300 }
              : isInitialBranchDistribution && activeBranchPolymerIds.includes(poly.id)
                ? { x: 480, y: 300 }
              : isBranchResultParticle
                ? { x: 480, y: 300 }
              : showingEthanol31Separation && poly.id === 'PP'
              ? getPolymerClusterCenter('PP', 'separated_floating')
              : showingEthanol23Separation && poly.id === 'HDPE'
                ? getPolymerClusterCenter('HDPE', 'separated_sinking')
                : getPolymerClusterCenter(poly.id, poly.location)
            const isSelected = selectedPolymerId === poly.id
            const weighed = projection.weighedPolymerIds.includes(poly.id) && !projection.pendingCentrifugation
            const hasSeparatedInWater = poly.location === 'water_floating' || poly.location === 'water_sinking'
            const tankParticleOffsets = getTankParticleOffsets(poly.id, tankParticleSeed)
            const centrifugeOffsets = showCentrifugeScene
              ? getCentrifugeOffsets(poly.id, tankParticleSeed, centrifugeTransferDone, showSeparateNacl40Balances)
              : undefined
            const separationParticleOffsets = hasSeparatedInWater
              ? getWaterBandOffsets(poly.id, tankParticleSeed, poly.location === 'water_floating')
              : undefined
            const branchBandOffsets = isBranchTarget
              ? getBranchSeparationOffsets(
                  poly.id,
                  tankParticleSeed,
                  poly.location === 'separated_floating',
                  projection.activeBranch === 'light' && projection.ethanolProgress === 1,
                )
              : undefined
            const branchResultOffsets = isBranchResultParticle
              ? getBranchSeparationOffsets(
                  poly.id,
                  tankParticleSeed,
                  branchResultFloats,
                  projection.activeBranch === 'light' && projection.ethanolProgress === 1,
                )
              : undefined

            return (
              <g
                key={poly.id}
                id={`${uid}-cluster-${poly.id}`}
                className={styles.particleCluster}
                transform={`translate(${center.x}, ${center.y})`}
              >
                <g
                  key={`${poly.id}-particles`}
                  className={showCentrifugeScene && centrifugeVisual === 'spinning' ? styles.centrifugeParticlesSpinning : showBranchSeparation && branchSeparationVisual === 'mixing' && isBranchTarget ? styles.branchMixingParticles : phaseOneVisual === 'pouring' && (poly.location === 'tank_mixing' || isInitialBranchDistribution) ? styles.particlesPouring : undefined}
                  style={{ animationDelay: `${VIRGIN_POLYMERS.findIndex((item) => item.id === poly.id) * 260}ms` }}
                >
                {(showCentrifugeScene && centrifugeOffsets ? centrifugeOffsets : isBranchTarget ? branchSeparationVisual === 'mixing' ? tankParticleOffsets : branchBandOffsets ?? tankParticleOffsets : isBranchResultParticle ? branchResultOffsets ?? tankParticleOffsets : isInitialBranchDistribution && activeBranchPolymerIds.includes(poly.id) || poly.location === 'tank_mixing' || hasSeparatedInWater ? tankParticleOffsets : PARTICLE_OFFSETS).map((offset = { dx: 0, dy: 0 }, i) => (
                  <g
                    key={i}
                    className={showCentrifugeScene ? styles.centrifugeParticleLocation : (isBranchTarget && branchSeparationVisual !== 'mixing') || isBranchResultParticle ? styles.waterSeparationParticle : poly.location === 'tank_mixing' || hasSeparatedInWater ? styles.waterSeparationParticle : undefined}
                    style={(isBranchTarget && branchSeparationVisual !== 'mixing') || isBranchResultParticle
                      ? { transitionDelay: `${VIRGIN_POLYMERS.findIndex((item) => item.id === poly.id) * 100 + i * 14}ms` }
                      : hasSeparatedInWater && separationParticleOffsets
                      ? { transitionDelay: `${VIRGIN_POLYMERS.findIndex((item) => item.id === poly.id) * 160 + i * 18}ms` }
                      : undefined}
                    transform={showCentrifugeScene && centrifugeOffsets
                      ? `translate(${offset.dx} ${offset.dy})`
                      : isBranchTarget
                        ? `translate(${offset.dx} ${offset.dy})`
                      : isBranchResultParticle
                        ? `translate(${offset.dx} ${offset.dy})`
                      : isInitialBranchDistribution && activeBranchPolymerIds.includes(poly.id)
                        ? `translate(${offset.dx} ${offset.dy})`
                      : hasSeparatedInWater && separationParticleOffsets
                      ? `translate(${separationParticleOffsets[i]?.dx ?? 0} ${separationParticleOffsets[i]?.dy ?? 0})`
                      : poly.location === 'tank_mixing' ? `translate(${offset.dx} ${offset.dy})` : undefined}
                  >
                    <g className={poly.location === 'tank_mixing' && !showCentrifugeScene ? styles.suspendedParticle : undefined}>
                      {renderParticleShape(
                        poly.particleShape,
                        showCentrifugeScene || isBranchTarget || isBranchResultParticle || isInitialBranchDistribution || hasSeparatedInWater || poly.location === 'tank_mixing' ? 0 : offset.dx,
                        showCentrifugeScene || isBranchTarget || isBranchResultParticle || isInitialBranchDistribution || hasSeparatedInWater || poly.location === 'tank_mixing' ? 0 : offset.dy,
                        poly.colorHex,
                        isSelected ? '#ffffff' : poly.strokeHex,
                        `particle-${i}`,
                      )}
                    </g>
                  </g>
                ))}
                </g>
                {/* Keep machine labels clear; pan labels float above the measured sample. */}
                {!showCentrifugeScene && !showBranchSeparation && !isInitialBranchDistribution && !weighed && poly.location !== 'tank_mixing' && !hasSeparatedInWater && (
                  <g transform={weighed ? undefined : 'translate(0, 16)'}>
                    <rect
                      x="-18"
                      y={weighed ? '-23' : '-7'}
                      width="36"
                      height="13"
                      rx="3"
                      fill="var(--ink)"
                      fillOpacity="0.85"
                    />
                    <text
                      x="0"
                      y={weighed ? '-13' : '3'}
                      fill="#ffffff"
                      fontSize="8.5"
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {poly.id}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </g>

        {/* Active Cue Banner overlay */}
        {activeCue && (
          <g id={`${uid}-action-cue-banner`} transform="translate(260, 485)">
            <rect
              x="0"
              y="0"
              width="440"
              height="36"
              rx="6"
              fill="var(--ink)"
              filter={`url(#${uid}-shadow)`}
            />
            <circle cx="20" cy="18" r="8" fill="var(--ok)" />
            <path
              d="M 16 18 L 19 21 L 25 15"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <text x="36" y="22" fill="#ffffff" fontSize="11.5" fontWeight="600">
              {activeCue.message}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}

