'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { StoredAttemptEventRecord } from '@/application/attempts/repository.js'
import type { AcidNeutralizationState } from '@/domain/experiments/acid-neutralization/state.js'
import { createSessionForStorageMode } from '@/features/simulation-session.js'
import { useWorkbenchController } from './controller/use-workbench-controller.js'
import { TitrationApparatusStage } from './apparatus/index.js'
import { InstrumentTelemetryHud } from './telemetry/index.js'
import { LiveTitrationChart } from './chart/index.js'
import { ExperimentSetupCard } from './setup/experiment-setup-card.js'
import { GuidedProtocolRail } from './guidance/guided-protocol-rail.js'
import { TitrationControls } from './controls/titration-controls.js'
import { WorkbenchEventLog } from './history/workbench-event-log.js'
import { WorkbenchCompletionCard } from './completion/workbench-completion-card.js'
import { WorkbenchContextBar } from './workbench-context-bar.js'
import { ScientificDisclosure } from '@/shared/ui/scientific-disclosure.js'
import { WORKBENCH_PATH } from './scenario.js'
import { APP_STRINGS, resolveMessage } from '@/content/index.js'

export type WorkbenchClientProps = {
  /** Attempt to resume, when URL carries one. Absent shows setup or starts fresh. */
  readonly attemptId: string | null
  /** Storage mode: local (IndexedDB) or cloud (RPC). */
  readonly storageMode: 'local' | 'cloud'
}

type MobileTab = 'operations' | 'data' | 'protocol'

export function WorkbenchClient({ attemptId, storageMode }: WorkbenchClientProps) {
  const router = useRouter()

  const session = useMemo(
    () => createSessionForStorageMode(storageMode),
    [storageMode],
  )

  const controller = useWorkbenchController({
    session,
    initialAttemptId: attemptId,
  })

  // Authoritative event records retrieved from session
  const [events, setEvents] = useState<readonly StoredAttemptEventRecord<AcidNeutralizationState>[]>([])

  // Mobile local presentation section tab
  const [mobileTab, setMobileTab] = useState<MobileTab>('operations')

  // Synchronize URL with active attempt ID
  useEffect(() => {
    if (controller.attemptId && controller.attemptId !== attemptId) {
      router.replace(`${WORKBENCH_PATH}?attempt=${controller.attemptId}`, {
        scroll: false,
      })
    }
  }, [controller.attemptId, attemptId, router])

  // Fetch authoritative event records when attempt or revision updates
  useEffect(() => {
    let cancelled = false
    const id = controller.attemptId
    if (!id) return

    void (async () => {
      try {
        const records = await session.listEvents(id)
        if (!cancelled) {
          setEvents(records)
        }
      } catch {
        // Tolerant on event fetch failure
      }
    })()

    return () => {
      cancelled = true
    }
  }, [controller.attemptId, controller.sessionState?.revision, controller.lastSuccessfulInteraction, session])

  // Confirmations for Restart and New Setup when attempt has actions
  const hasExperimentActions = useMemo(() => {
    if (!controller.domain) return false
    return (
      controller.domain.route !== null ||
      controller.domain.meterCalibrated ||
      controller.domain.baseVolumeL > 0 ||
      controller.domain.measurements.length > 0
    )
  }, [controller.domain])

  const handleRestartSameSetup = useCallback(async () => {
    if (hasExperimentActions) {
      const confirmed = window.confirm(
        'Lượt thử hiện tại đang có dữ liệu thao tác. Làm lại sẽ bảo lưu kết quả lượt này trong lịch sử và khởi tạo một lượt thử mới với cùng nồng độ và thể tích. Tiếp tục?',
      )
      if (!confirmed) return
    }
    setEvents([])
    const result = await controller.restartSameSetup()
    if (result.ok) {
      router.replace(`${WORKBENCH_PATH}?attempt=${result.state.attemptId}`, {
        scroll: false,
      })
    }
  }, [controller, hasExperimentActions, router])

  const handleBeginNewSetup = useCallback(() => {
    if (hasExperimentActions) {
      const confirmed = window.confirm(
        'Lượt thử hiện tại đang có dữ liệu thao tác. Thiết lập lượt mới sẽ bảo lưu kết quả hiện tại và đưa bạn về màn hình cài đặt thông số ban đầu. Tiếp tục?',
      )
      if (!confirmed) return
    }
    setEvents([])
    controller.beginNewSetup()
    router.replace(WORKBENCH_PATH, { scroll: false })
  }, [controller, hasExperimentActions, router])

  // Error resolution
  const errorMessage = useMemo(() => {
    if (!controller.lastError) return null
    const err = controller.lastError
    if (err.code === 'revision_conflict') {
      return `${APP_STRINGS.storage.conflictTitle} ${APP_STRINGS.storage.conflictHint}`
    }
    return resolveMessage(err.message, err.data as import('@/content/index.js').MessageData | undefined)
  }, [controller.lastError])

  // Added NaOH and total volumes in mL
  const addedBaseMl = controller.domain?.baseVolumeL
    ? controller.domain.baseVolumeL * 1000
    : 0

  const totalVolumeMl = controller.domain?.totalVolumeL
    ? controller.domain.totalVolumeL * 1000
    : (controller.setupDraft.acidVolumeL * 1000)

  return (
    <div className="wb-root stack">
      {/* Top Context Bar */}
      <WorkbenchContextBar
        mode={controller.mode}
        status={controller.status}
        saveStatus={controller.saveStatus}
        storageMode={storageMode}
        isPreStart={controller.isPreStart}
        onModeChange={controller.setMode}
      />

      {/* Error / Conflict Banner */}
      {errorMessage && (
        <div className="alert alert-danger wb-error-banner" role="alert">
          <div className="wb-error-content">
            <strong>Thông báo:</strong> {errorMessage}
          </div>
          <button
            type="button"
            className="btn btn-xs btn-ghost"
            onClick={controller.clearError}
            aria-label="Đóng thông báo lỗi"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Mobile Section Switcher */}
      <nav className="wb-mobile-nav" aria-label="Chuyển đổi khu vực làm việc trên điện thoại">
        <button
          type="button"
          className={`wb-mobile-tab ${mobileTab === 'operations' ? 'is-active' : ''}`}
          onClick={() => setMobileTab('operations')}
        >
          Thao tác
        </button>
        <button
          type="button"
          className={`wb-mobile-tab ${mobileTab === 'data' ? 'is-active' : ''}`}
          onClick={() => setMobileTab('data')}
        >
          Đồ thị &amp; Số liệu
        </button>
        <button
          type="button"
          className={`wb-mobile-tab ${mobileTab === 'protocol' ? 'is-active' : ''}`}
          onClick={() => setMobileTab('protocol')}
        >
          Quy trình &amp; Nhật ký
        </button>
      </nav>

      {/* Workspace Operational Grid */}
      <div className={`wb-workspace-grid mobile-show-${mobileTab}`}>
        {/* Left Column: Pre-start Setup or Guided Protocol Rail / Explore Status */}
        <aside className={`wb-zone-left stack-tight ${controller.isPreStart ? 'wb-is-prestart' : ''}`}>
          {controller.isPreStart ? (
            <ExperimentSetupCard
              setupDraft={controller.setupDraft}
              activeSetup={controller.activeSetup}
              isPreStart={controller.isPreStart}
              mode={controller.mode}
              busy={controller.busy}
              onSetupChange={controller.setSetupDraft}
              onModeChange={controller.setMode}
              onStart={controller.startRun}
              onRestart={handleRestartSameSetup}
              onNewSetup={handleBeginNewSetup}
            />
          ) : (
            <>
              <GuidedProtocolRail
                mode={controller.mode}
                domain={controller.domain}
                availableActions={controller.availableActions}
                isPreStart={controller.isPreStart}
              />
              <div className="wb-active-run-meta card stack-tight">
                <h4 className="wb-section-heading">Tác vụ lượt thử</h4>
                <div className="stack-tight pt-1">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline btn-block"
                    onClick={handleRestartSameSetup}
                    disabled={controller.busy}
                  >
                    Làm lại cùng cấu hình
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost btn-block"
                    onClick={handleBeginNewSetup}
                    disabled={controller.busy}
                  >
                    Thiết lập lượt mới
                  </button>
                </div>
              </div>
            </>
          )}
        </aside>

        {/* Center Column: Interactive SVG Apparatus & Stage Feedback */}
        <main className="wb-zone-center stack-tight">
          <div className="wb-apparatus-wrapper card">
            <TitrationApparatusStage
              addedBaseVolumeMl={addedBaseMl}
              totalVolumeMl={totalVolumeMl}
              stirrerRpm={controller.stirrerRpm}
              stirrerActive={controller.operationStage === 'mixing' || controller.busy}
              operationStage={controller.operationStage}
              lastSuccessfulInteraction={controller.lastSuccessfulInteraction}
              className="wb-apparatus-svg-container"
            />
            {controller.operationStage !== 'idle' && (
              <div className="wb-stage-indicator" role="status" aria-live="polite">
                <span className="wb-stage-dot" />
                <span className="wb-stage-label">
                  {controller.operationStage === 'dispensing' && 'Đang thêm dung dịch NaOH…'}
                  {controller.operationStage === 'mixing' && 'Đang khuấy đều dung dịch…'}
                  {controller.operationStage === 'stabilizing' && 'Đang chờ điện cực ổn định…'}
                  {controller.operationStage === 'measuring' && 'Đang đọc giá trị pH…'}
                  {controller.operationStage === 'calibrating' && 'Đang hiệu chuẩn máy đo pH…'}
                  {controller.operationStage === 'selecting_route' && 'Đang nạp buret NaOH…'}
                  {controller.operationStage === 'completing' && 'Đang hoàn tất lượt thử…'}
                  {controller.operationStage === 'undoing' && 'Đang hoàn tác…'}
                  {controller.operationStage === 'starting' && 'Đang khởi tạo thí nghiệm…'}
                  {controller.operationStage === 'reloading' && 'Đang tải lại dữ liệu…'}
                </span>
              </div>
            )}
          </div>
        </main>

        {/* Right Column: Telemetry HUD & Titration Controls */}
        <aside className="wb-zone-right stack-tight">
          <InstrumentTelemetryHud
            domain={controller.domain}
            activeSetup={controller.activeSetup}
            isPreStart={controller.isPreStart}
          />

          <TitrationControls
            mode={controller.mode}
            domain={controller.domain}
            availableActions={controller.availableActions}
            selectedAliquotL={controller.selectedAliquotL}
            busy={controller.busy}
            operationStage={controller.operationStage}
            isPreStart={controller.isPreStart}
            isExploreDispenseAvailable={controller.isExploreDispenseAvailable}
            isUndoAvailable={controller.isUndoAvailable}
            isCompleteAvailable={controller.isCompleteAvailable}
            onAliquotChange={controller.setSelectedAliquot}
            onSelectRoute={controller.selectNaohRoute}
            onCalibrate={controller.calibrateMeter}
            onAddBase={controller.addBase}
            onMix={controller.mixSample}
            onWait={controller.waitForStableReading}
            onMeasurePh={controller.measurePh}
            onAddCorrectionAcid={controller.addCorrectionAcid}
            onDispenseAndMeasure={controller.dispenseAndMeasure}
            onUndo={controller.undoLastAction}
            onComplete={controller.completeRun}
          />
        </aside>
      </div>

      {/* Lower Workspace: Live Titration Chart, Completion Summary, Event Log, Theory */}
      <section className="wb-lower-workspace stack">
        {/* Completion Summary Card (if completed) */}
        {controller.status === 'completed' && controller.attemptId && (
          <WorkbenchCompletionCard
            attemptId={controller.attemptId}
            domain={controller.domain}
            projection={controller.projection}
            onStartNew={handleBeginNewSetup}
          />
        )}

        {/* Live Titration Chart */}
        <div className="wb-chart-container card stack-tight">
          <div className="wb-chart-header">
            <h3 className="wb-section-heading">
              Đường cong chuẩn độ thực nghiệm (pH theo V_NaOH)
            </h3>
            <span className="badge badge-sm">
              {controller.domain?.measurements.length ?? 0} điểm đo thực tế
            </span>
          </div>
          <LiveTitrationChart
            measurements={controller.domain?.measurements ?? null}
            activeSetup={controller.activeSetup}
          />
        </div>

        {/* Authoritative Event Log */}
        <WorkbenchEventLog events={events} />

        {/* Scientific Sources & Reference Disclosure */}
        <ScientificDisclosure />
      </section>
    </div>
  )
}
