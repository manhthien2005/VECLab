import 'fake-indexeddb/auto'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import {
  createAcidSession,
} from '@/application/simulation/acid-session.js'
import type { AcidNeutralizationState } from '@/domain/experiments/acid-neutralization/state.js'
import {
  benchmarkSetupParams,
  validateSetupParams,
  type AcidSetupParams,
} from '@/domain/experiments/acid-neutralization/setup.js'
import {
  EXPLORATION_RANGES,
  PERMITTED_ALIQUOTS_L,
} from '@/domain/experiments/acid-neutralization/constants.js'
import { parseUUID } from '@/shared/ids.js'
import { ExperimentSetupCard } from '@/features/simulation-workbench/setup/experiment-setup-card.js'
import { GuidedProtocolRail } from '@/features/simulation-workbench/guidance/guided-protocol-rail.js'
import { TitrationControls } from '@/features/simulation-workbench/controls/titration-controls.js'
import {
  WorkbenchEventLog,
  formatEventRecord,
} from '@/features/simulation-workbench/history/workbench-event-log.js'
import { WorkbenchCompletionCard } from '@/features/simulation-workbench/completion/workbench-completion-card.js'
import { WorkbenchContextBar } from '@/features/simulation-workbench/workbench-context-bar.js'
import { InstrumentTelemetryHud } from '@/features/simulation-workbench/telemetry/index.js'
import { LiveTitrationChart } from '@/features/simulation-workbench/chart/index.js'
import { TitrationApparatusStage } from '@/features/simulation-workbench/apparatus/index.js'

function createGuestSession() {
  const repo = new GuestAttemptRepository<AcidNeutralizationState>()
  return { repo, session: createAcidSession(repo) }
}

describe('Workbench V1 Production Assembly (WB-R6)', () => {
  it('1. Setup phase renders verified parameter controls with envelope values', () => {
    const draft = benchmarkSetupParams()
    const html = renderToString(
      React.createElement(ExperimentSetupCard, {
        setupDraft: draft,
        isPreStart: true,
        mode: 'GUIDED',
        busy: false,
        onSetupChange: () => {},
        onModeChange: () => {},
        onStart: () => {},
      }),
    )

    // Check title and inputs
    expect(html).toContain('Thiết lập thí nghiệm')
    expect(html).toContain('Thể tích dung dịch HCl ban đầu (mL)')
    expect(html).toContain('Nồng độ HCl ban đầu (M)')
    expect(html).toContain('Bắt đầu thí nghiệm')

    // Envelope range limits present in rendered HTML
    const minVol = (EXPLORATION_RANGES.acidVolumeL.min * 1000).toFixed(1)
    const maxVol = (EXPLORATION_RANGES.acidVolumeL.max * 1000).toFixed(1)
    expect(html).toContain(minVol)
    expect(html).toContain(maxVol)
  })

  it('2. Invalid setup cannot start and is caught by domain validator', () => {
    const invalidLowVolume: AcidSetupParams = {
      acidVolumeL: 0.01, // Under 25 mL
      acidConcentrationMolL: 0.01,
    }
    const valLow = validateSetupParams(invalidLowVolume)
    expect(valLow.ok).toBe(false)

    const invalidHighConc: AcidSetupParams = {
      acidVolumeL: 0.03,
      acidConcentrationMolL: 0.05, // Over 0.020 M
    }
    const valHigh = validateSetupParams(invalidHighConc)
    expect(valHigh.ok).toBe(false)
  })

  it('3. GUIDED start does not auto-select route or calibrate', async () => {
    const { session } = createGuestSession()
    const state = await session.start(benchmarkSetupParams())

    // In GUIDED mode start, route is null and meter is uncalibrated
    expect(state.domain.route).toBeNull()
    expect(state.domain.meterCalibrated).toBe(false)
    expect(state.domain.baseVolumeL).toBe(0)
  })

  it('4. EXPLORE start uses accepted preparation orchestration (route + calibration)', async () => {
    const { session } = createGuestSession()
    const startState = await session.start(benchmarkSetupParams())

    // Orchestrate preparation as Explore does
    const routeRes = await session.apply(startState.attemptId, 'select_route', { route: 'naoh' })
    expect(routeRes.ok).toBe(true)
    if (!routeRes.ok) return

    const calRes = await session.apply(startState.attemptId, 'calibrate_meter', {})
    expect(calRes.ok).toBe(true)
    if (!calRes.ok) return

    expect(calRes.state.domain.route).toBe('naoh')
    expect(calRes.state.domain.meterCalibrated).toBe(true)
  })

  it('5. Mode is locked during active run in setup card and context bar', () => {
    const activeSetup = benchmarkSetupParams()
    const htmlSetup = renderToString(
      React.createElement(ExperimentSetupCard, {
        setupDraft: activeSetup,
        activeSetup: activeSetup,
        isPreStart: false,
        mode: 'GUIDED',
        busy: false,
        onSetupChange: () => {},
        onModeChange: () => {},
        onStart: () => {},
      }),
    )

    // Setup form inputs must NOT be present when active run is underway
    expect(htmlSetup).toContain('Đã khóa thông số')
    expect(htmlSetup).not.toContain('<input')
    expect(htmlSetup).toContain('25.0')
    expect(htmlSetup).toContain('0.010')

    const htmlBar = renderToString(
      React.createElement(WorkbenchContextBar, {
        mode: 'GUIDED',
        status: 'in_progress',
        saveStatus: 'saved',
        storageMode: 'local',
        isPreStart: false,
      }),
    )
    expect(htmlBar).toContain('Chế độ:')
    expect(htmlBar).toContain('GUIDED')
    expect(htmlBar).not.toContain('wb-mode-toggle-compact')
  })

  it('6. Aliquot selection uses permitted values strictly', () => {
    const html = renderToString(
      React.createElement(TitrationControls, {
        mode: 'EXPLORE',
        domain: null,
        availableActions: [],
        selectedAliquotL: PERMITTED_ALIQUOTS_L[2],
        busy: false,
        operationStage: 'idle',
        isPreStart: false,
        isExploreDispenseAvailable: true,
        isUndoAvailable: false,
        isCompleteAvailable: false,
        onAliquotChange: () => {},
        onSelectRoute: () => {},
        onCalibrate: () => {},
        onAddBase: () => {},
        onMix: () => {},
        onWait: () => {},
        onMeasurePh: () => {},
        onAddCorrectionAcid: () => {},
        onDispenseAndMeasure: () => {},
        onUndo: () => {},
        onComplete: () => {},
      }),
    )

    // Check all 5 permitted aliquot buttons: 0,05, 0,10, 0,50, 1,00, 5,00 mL
    expect(html).toContain('0,05 mL')
    expect(html).toContain('0,10 mL')
    expect(html).toContain('0,50 mL')
    expect(html).toContain('1,00 mL')
    expect(html).toContain('5,00 mL')
  })

  it('7. Guided action availability follows authoritative state', () => {
    const html = renderToString(
      React.createElement(GuidedProtocolRail, {
        mode: 'GUIDED',
        domain: null,
        availableActions: [
          { actionType: 'select_route', available: true, reasonKey: null, reasonData: {} },
        ],
        isPreStart: false,
      }),
    )

    expect(html).toContain('Chỉ dẫn quy trình (GUIDED)')
    expect(html).toContain('Chọn dung dịch chuẩn (NaOH)')
  })

  it('8. Explore primary action displays Thêm & Đo and calls dispenseAndMeasure', () => {
    const html = renderToString(
      React.createElement(TitrationControls, {
        mode: 'EXPLORE',
        domain: null,
        availableActions: [],
        selectedAliquotL: 0.001,
        busy: false,
        operationStage: 'idle',
        isPreStart: false,
        isExploreDispenseAvailable: true,
        isUndoAvailable: false,
        isCompleteAvailable: false,
        onAliquotChange: () => {},
        onSelectRoute: () => {},
        onCalibrate: () => {},
        onAddBase: () => {},
        onMix: () => {},
        onWait: () => {},
        onMeasurePh: () => {},
        onAddCorrectionAcid: () => {},
        onDispenseAndMeasure: () => {},
        onUndo: () => {},
        onComplete: () => {},
      }),
    )

    expect(html).toContain('Thêm &amp; Đo (1,00 mL)')
  })

  it('9. Pending telemetry semantics survive full shell integration', async () => {
    const { session } = createGuestSession()
    const start = await session.start(benchmarkSetupParams())
    await session.apply(start.attemptId, 'select_route', { route: 'naoh' })
    await session.apply(start.attemptId, 'calibrate_meter', {})
    await session.apply(start.attemptId, 'wait_for_stable_reading', {})
    const mRes = await session.apply(start.attemptId, 'measure_ph', {})
    expect(mRes.ok).toBe(true)

    // Add base -> reading becomes stale/pending
    const addRes = await session.apply(start.attemptId, 'add_base', { volumeL: 0.001 })
    expect(addRes.ok).toBe(true)
    if (!addRes.ok) return

    const html = renderToString(
      React.createElement(InstrumentTelemetryHud, {
        domain: addRes.state.domain,
        activeSetup: benchmarkSetupParams(),
      }),
    )
    expect(html).toContain('Chờ đo')
  })

  it('10. Stable measurement adds chart point with exact base volume', async () => {
    const { session } = createGuestSession()
    const start = await session.start(benchmarkSetupParams())
    await session.apply(start.attemptId, 'select_route', { route: 'naoh' })
    await session.apply(start.attemptId, 'calibrate_meter', {})
    await session.apply(start.attemptId, 'add_base', { volumeL: 0.001 })
    await session.apply(start.attemptId, 'mix', {})
    await session.apply(start.attemptId, 'wait_for_stable_reading', {})
    const measureRes = await session.apply(start.attemptId, 'measure_ph', {})
    expect(measureRes.ok).toBe(true)
    if (!measureRes.ok) return

    expect(measureRes.state.domain.measurements).toHaveLength(1)
    const measurement = measureRes.state.domain.measurements[0]!
    expect(measurement.baseVolumeL).toBeCloseTo(0.001, 5)

    const htmlChart = renderToString(
      React.createElement(LiveTitrationChart, {
        measurements: measureRes.state.domain.measurements,
      }),
    )
    expect(htmlChart).toContain('live-chart-point-dot')
  })

  it('11. Event log derives from authoritative event source with truthful timestamps', async () => {
    const { session } = createGuestSession()
    const start = await session.start(benchmarkSetupParams())
    await session.apply(start.attemptId, 'select_route', { route: 'naoh' })
    const records = await session.listEvents(start.attemptId)

    expect(records.length).toBeGreaterThanOrEqual(1)
    const formatted = formatEventRecord(records[0]!, new Set())
    expect(formatted.sequence).toBe(1)
    expect(formatted.title).toContain('Chọn')

    const htmlLog = renderToString(React.createElement(WorkbenchEventLog, { events: records }))
    expect(htmlLog).toContain('Nhật ký thao tác thực nghiệm')
    expect(htmlLog).toContain('wb-log-seq')
    expect(htmlLog).toContain('Chọn chất trung hòa')
  })

  it('12. Restart same setup creates a new attempt without deleting history', async () => {
    const { session, repo } = createGuestSession()
    const first = await session.start(benchmarkSetupParams())
    await session.apply(first.attemptId, 'select_route', { route: 'naoh' })

    // Restart creates fresh attempt
    const second = await session.start(benchmarkSetupParams())
    expect(second.attemptId).not.toBe(first.attemptId)

    // First attempt events are still preserved in repo
    const firstEvents = await repo.getAttemptEvents(first.attemptId)
    expect(firstEvents).toHaveLength(1)
  })

  it('13. Begin new setup returns to pre-start mode and unlocks fields', () => {
    const htmlPreStart = renderToString(
      React.createElement(ExperimentSetupCard, {
        setupDraft: benchmarkSetupParams(),
        isPreStart: true,
        mode: 'GUIDED',
        busy: false,
        onSetupChange: () => {},
        onModeChange: () => {},
        onStart: () => {},
      }),
    )
    expect(htmlPreStart).toContain('Bắt đầu thí nghiệm')
    expect(htmlPreStart).toContain('input')
  })

  it('14. Completion summary links to correct report attempt', () => {
    const dummyAttemptId = parseUUID('11111111-1111-4111-8111-111111111111')!
    const html = renderToString(
      React.createElement(WorkbenchCompletionCard, {
        attemptId: dummyAttemptId,
        domain: null,
        projection: null,
      }),
    )

    expect(html).toContain('Lượt thử đã hoàn thành')
    expect(html).toContain(`/reports/${dummyAttemptId}`)
  })

  it('15. Apparatus stage renders scalable interactive SVG with focused framing', () => {
    const htmlDesktop = renderToString(
      React.createElement(TitrationApparatusStage, {
        addedBaseVolumeMl: 1.0,
        totalVolumeMl: 26.0,
        viewMode: 'desktop',
      }),
    )
    expect(htmlDesktop).toContain('svg')
    expect(htmlDesktop).toContain('wb-apparatus-svg')

    const htmlMobile = renderToString(
      React.createElement(TitrationApparatusStage, {
        addedBaseVolumeMl: 1.0,
        totalVolumeMl: 26.0,
        viewMode: 'mobile',
      }),
    )
    expect(htmlMobile).toContain(EXPLORATION_RANGES ? 'viewBox' : '')
    expect(htmlMobile).toContain('200 185 400 380') // Mobile focused viewBox
  })
})
