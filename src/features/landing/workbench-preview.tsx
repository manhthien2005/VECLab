'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ACID_INPUT_DOMAIN, APP_STRINGS } from '@/content/index.js'
import { formatLitresAsMl, formatMl, formatPh } from '@/shared/ui/format.js'
import {
  ArrowRightIcon,
  CheckCircleIcon,
  FlaskIcon,
} from './icons.js'

/** Default workbench aliquot (1.00 mL). Preview only — no engine call. */
const PREVIEW_ALIQUOT_L = 0.001

const SIMULATE_HREF = '/simulate/acid-neutralization'

export function WorkbenchPreview() {
  const strings = APP_STRINGS.home
  const benchmark = ACID_INPUT_DOMAIN.benchmark
  const sampleMl = benchmark.acidVolumeL * 1000
  const steps = strings.workbenchSteps
  const activeStepIndex = 1
  const stepCount = steps.length
  const progressPct = Math.round(((activeStepIndex + 1) / stepCount) * 100)

  const [previewVolumeMl, setPreviewVolumeMl] = useState<number>(sampleMl)
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)
  const [isSimulatingAddition, setIsSimulatingAddition] = useState<boolean>(false)

  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearActiveTimers = () => {
    if (pulseTimerRef.current !== null) {
      clearTimeout(pulseTimerRef.current)
      pulseTimerRef.current = null
    }
    if (toastTimerRef.current !== null) {
      clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      clearActiveTimers()
    }
  }, [])

  const handleAddReagent = () => {
    clearActiveTimers()
    setIsSimulatingAddition(true)
    setFeedbackMsg(strings.workbenchDemoFeedback)
    setPreviewVolumeMl((prev) => prev + PREVIEW_ALIQUOT_L * 1000)

    pulseTimerRef.current = setTimeout(() => {
      setIsSimulatingAddition(false)
      pulseTimerRef.current = null
    }, 600)

    toastTimerRef.current = setTimeout(() => {
      setFeedbackMsg(null)
      toastTimerRef.current = null
    }, 3000)
  }

  const handleResetPreview = () => {
    clearActiveTimers()
    setIsSimulatingAddition(false)
    setPreviewVolumeMl(sampleMl)
    setFeedbackMsg(null)
  }

  return (
    <div className="workbench-section reveal" data-reveal-variant="assemble">
      <div className="section-head-center">
        <p className="eyebrow">{strings.workbenchEyebrow}</p>
        <h2 className="workbench-main-title">{strings.workbenchHeading}</h2>
        <p className="lede workbench-lede">{strings.workbenchLede}</p>
      </div>

      <div className="workbench-frame">
        <div className="workbench-frame-bar">
          <div className="wb-bar-title">
            <span className="wb-bar-icon-badge" aria-hidden="true">
              <FlaskIcon />
            </span>
            <span className="wb-bar-brand">VECLab</span>
            <span className="wb-bar-slash" aria-hidden="true">·</span>
            <strong className="wb-bar-scenario">Trung hòa axit</strong>
          </div>

          <Link
            className="btn btn-sm btn-ghost wb-open-link"
            href={SIMULATE_HREF}
          >
            <span>Mở không gian mô phỏng</span>
            <ArrowRightIcon />
          </Link>
        </div>

        <div className="wp-grid">
          <div className="wp-rail">
            <div className="wp-rail-header">
              <p className="wp-panel-title">Tiến trình</p>
            </div>

            <ol className="wb-timeline" aria-label="Chu kỳ lab trên workbench">
              {steps.map((name, index) => {
                const status =
                  index < activeStepIndex
                    ? 'done'
                    : index === activeStepIndex
                      ? 'active'
                      : 'pending'
                const isActivePulse =
                  status === 'active' && isSimulatingAddition
                return (
                  <li
                    key={name}
                    className={`wb-timeline-item wb-step-${status}${isActivePulse ? ' is-addition-active' : ''}`}
                  >
                    <span className="wb-step-marker" aria-hidden="true">
                      {status === 'done' ? <CheckCircleIcon /> : index + 1}
                    </span>
                    <div className="wb-step-content">
                      <span className="wb-step-index">Bước {index + 1}</span>
                      <span className="wb-step-name">{name}</span>
                    </div>
                  </li>
                )
              })}
            </ol>

            <div className="wb-rail-progress-box">
              <div className="wb-rail-progress-labels">
                <span className="wb-progress-step-text">
                  Bước {activeStepIndex + 1} / {stepCount}
                </span>
                <span className="wb-progress-pct-text">{progressPct}%</span>
              </div>
              <div
                className="wb-progress-track"
                role="progressbar"
                aria-valuenow={progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Tiến trình kịch bản"
              >
                <div
                  className="wb-progress-fill"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="wp-middle">
            <div className="wp-state">
              <p className="wp-panel-title">Trạng thái hiện tại</p>

              <div className="wp-state-display">
                <div className={`wp-apparatus-frame ${isSimulatingAddition ? 'is-stirring' : ''}`}>
                  <Image
                    src="/assets/hero-apparatus.webp"
                    width={220}
                    height={220}
                    alt="Bộ dụng cụ thí nghiệm gồm cốc phản ứng, máy khuấy từ và điện cực đo pH"
                    className="wp-apparatus-img"
                    priority={false}
                  />
                </div>

                <div className="wp-telemetry-panel">
                  <div className="wp-telemetry-main">
                    <span className="wp-telemetry-label">pH</span>
                    <span className="wp-telemetry-value-lg">4,8</span>
                  </div>

                  <div className="telemetry-target">
                    <span className="telemetry-target-label">
                      {APP_STRINGS.workbench.target}
                    </span>
                    <span className="telemetry-target-value">
                      {formatPh(benchmark.targetPH)} ± {formatPh(benchmark.targetTolerancePH)}
                    </span>
                  </div>

                  <div className="wp-meta-item-group wp-telemetry-meta">
                    <div className="wp-meta-item">
                      <span className="wp-meta-label">Nhiệt độ</span>
                      <strong className="wp-meta-value">25,0 °C</strong>
                    </div>
                    <div className="wp-meta-item wp-volume-meta">
                      <span className="wp-meta-label">Thể tích</span>
                      <strong className={`wp-meta-value wp-volume-value ${isSimulatingAddition ? 'is-volume-pulse' : ''}`}>
                        {formatMl(previewVolumeMl)}
                      </strong>
                    </div>
                  </div>

                  <div
                    className={`wp-status-pill ${isSimulatingAddition ? 'is-active-addition' : ''}`}
                    role="status"
                  >
                    <span className="wp-status-dot pulse-dot" aria-hidden="true" />
                    <span>
                      {isSimulatingAddition
                        ? APP_STRINGS.workbench.exploreStatusHeading
                        : strings.workbenchIdleStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="wp-chart">
              <div className="wp-chart-head">
                <p className="wp-panel-title">{strings.workbenchChartTitle}</p>
              </div>

              <div className="wp-chart-stage">
                <svg
                  viewBox="0 0 320 180"
                  className="wp-chart-svg"
                  role="img"
                  aria-label="Biểu đồ pH theo thể tích NaOH: pH tăng từ 1,8 lên 4,8 và hướng tới mục tiêu 7,0"
                >
                  <defs>
                    <linearGradient id="wp-ph-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <line x1="32" x2="310" y1="20" y2="20" stroke="var(--border)" strokeDasharray="3 3" opacity="0.6" />
                  <line x1="32" x2="310" y1="80" y2="80" stroke="#0ea5e9" strokeDasharray="4 4" strokeWidth="1" opacity="0.45" />
                  <line x1="32" x2="310" y1="145" y2="145" stroke="var(--border)" opacity="0.8" />

                  <text x="24" y="24" textAnchor="end" fill="var(--ink-muted)" fontSize="9.5" fontFamily="var(--font-numeric)">14</text>
                  <text x="24" y="84" textAnchor="end" fill="#0284c7" fontSize="9.5" fontWeight="600" fontFamily="var(--font-numeric)">7</text>
                  <text x="24" y="148" textAnchor="end" fill="var(--ink-muted)" fontSize="9.5" fontFamily="var(--font-numeric)">0</text>

                  <g transform="translate(190, 68)">
                    <rect x="0" y="0" width="62" height="18" rx="4" fill="var(--surface)" stroke="#0284c7" strokeWidth="1" />
                    <text x="31" y="12.5" textAnchor="middle" fill="#0284c7" fontSize="9" fontWeight="700">pH = 7,0</text>
                  </g>

                  <path
                    d="M 32 128 C 80 125, 140 115, 180 95 C 220 75, 260 55, 310 50 L 310 145 L 32 145 Z"
                    fill="url(#wp-ph-fill)"
                  />

                  <path
                    d="M 32 128 C 80 125, 140 115, 180 95 C 220 75, 260 55, 310 50"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="2.75"
                    strokeLinecap="round"
                  />

                  <circle cx="180" cy="95" r="7" fill="#0284c7" opacity="0.25" />
                  <circle cx="180" cy="95" r="4.5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />

                  <text x="32" y="162" textAnchor="middle" fill="var(--ink-muted)" fontSize="9" fontFamily="var(--font-numeric)">0</text>
                  <text x="125" y="162" textAnchor="middle" fill="var(--ink-muted)" fontSize="9" fontFamily="var(--font-numeric)">10</text>
                  <text x="218" y="162" textAnchor="middle" fill="var(--ink-muted)" fontSize="9" fontFamily="var(--font-numeric)">20</text>
                  <text x="305" y="162" textAnchor="middle" fill="var(--ink-muted)" fontSize="9" fontFamily="var(--font-numeric)">25</text>
                  <text x="170" y="176" textAnchor="middle" fill="var(--ink-muted)" fontSize="8.5">V_NaOH (mL)</text>
                </svg>
              </div>
            </div>
          </div>

          <div className="wp-actions">
            <p className="wp-panel-title">Thao tác</p>

            <div className="wp-controls-form">
              <div className="wp-form-group">
                <span className="wp-form-label">Dung dịch chuẩn</span>
                <p className="wp-reagent-fixed">
                  <FlaskIcon className="wp-select-icon" />
                  <span>{strings.workbenchReagent}</span>
                </p>
              </div>

              <p className="wp-aliquot-note">
                {APP_STRINGS.workbench.aliquotLegend}: {formatLitresAsMl(PREVIEW_ALIQUOT_L)}
              </p>

              <button
                type="button"
                className={`btn btn-primary wp-action-btn ${isSimulatingAddition ? 'btn-active-pulse' : ''}`}
                onClick={handleAddReagent}
              >
                <FlaskIcon className="wp-btn-icon" />
                <span>{strings.workbenchDemoCta}</span>
              </button>

              <button
                type="button"
                className="btn btn-ghost btn-sm wp-reset-btn"
                onClick={handleResetPreview}
              >
                {strings.workbenchDemoReset}
              </button>

              {feedbackMsg && (
                <div className="wp-feedback-toast" role="status" aria-live="polite">
                  <span className="wp-toast-dot" />
                  <span className="wp-toast-text">{feedbackMsg}</span>
                  <Link
                    href={SIMULATE_HREF}
                    className="wp-toast-link"
                    aria-label="Mở không gian mô phỏng đầy đủ cho thí nghiệm trung hòa axit"
                  >
                    Mở mô phỏng
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="wp-below">
          <div className="wp-result-card">
            <div className="wp-result-icon-box" aria-hidden="true">
              <CheckCircleIcon />
            </div>
            <div className="wp-result-copy">
              <strong className="wp-result-heading">pH tăng dần</strong>
              <p className="wp-result-desc">
                Minh họa: dung dịch tiến gần trạng thái trung tính. pH* thật chỉ có sau khi đo trên lab.
              </p>
            </div>
          </div>

          <div className="wp-explanation-card">
            <div className="wp-formula-header">
              <span className="wp-formula-tag">Công thức &amp; giải thích</span>
            </div>
            <div className="wp-chemical-equation">
              HCl + NaOH → NaCl + H₂O
            </div>
            <p className="wp-explanation-body">
              Phiên bản này chuẩn độ HCl bằng NaOH. Phản ứng tạo muối và nước; pH* tăng khi nồng độ H⁺ giảm.
            </p>
            <Link
              className="wp-detail-link"
              href="/experiments/acid-neutralization"
              aria-label="Xem chi tiết lý thuyết thí nghiệm trung hòa axit"
            >
              <span>Xem chi tiết</span>
              <ArrowRightIcon />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
