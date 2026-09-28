'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRightIcon,
  CheckCircleIcon,
  FlaskIcon,
} from './icons.js'

type PreviewTab = 'ph' | 'concentration' | 'temperature'

export function WorkbenchPreview() {
  const [activeTab, setActiveTab] = useState<PreviewTab>('ph')
  const [addedVolume, setAddedVolume] = useState<number>(5)
  const [previewVolumeTotal, setPreviewVolumeTotal] = useState<number>(250)
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)
  const [isSimulatingAddition, setIsSimulatingAddition] = useState<boolean>(false)
  const [selectedReagent, setSelectedReagent] = useState<string>('naoh-001')

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

  // Component unmount cleanup cancels remaining timers
  useEffect(() => {
    return () => {
      clearActiveTimers()
    }
  }, [])

  // Local-only interactive preview action (zero backend calls, zero state persistence)
  const handleAddReagent = () => {
    clearActiveTimers()
    setIsSimulatingAddition(true)
    setFeedbackMsg(`Đã thêm ${addedVolume} mL (mô phỏng cục bộ). Mở không gian mô phỏng để tính toán pH cân bằng.`)
    setPreviewVolumeTotal((prev) => prev + addedVolume)

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
    setAddedVolume(5)
    setPreviewVolumeTotal(250)
    setFeedbackMsg(null)
  }

  const handleVolumeChange = (delta: number) => {
    setAddedVolume((prev) => Math.max(1, Math.min(25, prev + delta)))
  }

  return (
    <div className="workbench-section reveal">
      {/* Section Header */}
      <div className="section-head-center">
        <p className="eyebrow">TRẢI NGHIỆM CHI TIẾT</p>
        <h2 className="workbench-main-title">Xem toàn bộ quá trình trên workbench</h2>
        <p className="lede workbench-lede">
          Tương tác trực tiếp với mô phỏng, theo dõi trạng thái, xem kết quả và tìm hiểu giải thích khoa học.
        </p>
      </div>

      {/* Unified Premium Workbench Frame */}
      <div className="workbench-frame">
        {/* Frame Topbar */}
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
            href="/simulate/acid-neutralization"
          >
            <span>Mở không gian mô phỏng</span>
            <ArrowRightIcon />
          </Link>
        </div>

        {/* 3-Column Main Grid */}
        <div className="wp-grid">
          {/* ================= COLUMN 1: PROGRESS RAIL ================= */}
          <div className="wp-rail">
            <div className="wp-rail-header">
              <p className="wp-panel-title">Tiến trình</p>
            </div>

            <ol className="wb-timeline" aria-label="Các bước của kịch bản trung hòa axit">
              {/* Step 1: Done */}
              <li className="wb-timeline-item wb-step-done">
                <span className="wb-step-marker" aria-hidden="true">
                  <CheckCircleIcon />
                </span>
                <div className="wb-step-content">
                  <span className="wb-step-index">Bước 1</span>
                  <span className="wb-step-name">Chuẩn bị dung dịch</span>
                </div>
              </li>

              {/* Step 2: Active */}
              <li className={`wb-timeline-item wb-step-active ${isSimulatingAddition ? 'is-addition-active' : ''}`}>
                <span className="wb-step-marker" aria-hidden="true">2</span>
                <div className="wb-step-content">
                  <span className="wb-step-index">Bước 2</span>
                  <span className="wb-step-name">Thêm bazơ</span>
                </div>
              </li>

              {/* Step 3 */}
              <li className="wb-timeline-item wb-step-pending">
                <span className="wb-step-marker" aria-hidden="true">3</span>
                <div className="wb-step-content">
                  <span className="wb-step-index">Bước 3</span>
                  <span className="wb-step-name">Theo dõi biến đổi</span>
                </div>
              </li>

              {/* Step 4 */}
              <li className="wb-timeline-item wb-step-pending">
                <span className="wb-step-marker" aria-hidden="true">4</span>
                <div className="wb-step-content">
                  <span className="wb-step-index">Bước 4</span>
                  <span className="wb-step-name">Phân tích kết quả</span>
                </div>
              </li>

              {/* Step 5 */}
              <li className="wb-timeline-item wb-step-pending">
                <span className="wb-step-marker" aria-hidden="true">5</span>
                <div className="wb-step-content">
                  <span className="wb-step-index">Bước 5</span>
                  <span className="wb-step-name">Kết luận</span>
                </div>
              </li>
            </ol>

            {/* Progress rail footer */}
            <div className="wb-rail-progress-box">
              <div className="wb-rail-progress-labels">
                <span className="wb-progress-step-text">Bước 2 / 5</span>
                <span className="wb-progress-pct-text">40%</span>
              </div>
              <div
                className="wb-progress-track"
                role="progressbar"
                aria-valuenow={40}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Tiến trình kịch bản"
              >
                <div className="wb-progress-fill" style={{ width: '40%' }} />
              </div>
            </div>
          </div>

          {/* ================= COLUMN 2: CENTER APPARATUS & CHART ================= */}
          <div className="wp-middle">
            {/* 2A: Current State Apparatus & Telemetry */}
            <div className="wp-state">
              <p className="wp-panel-title">Trạng thái hiện tại</p>

              <div className="wp-state-display">
                {/* Apparatus Image Container */}
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

                {/* Telemetry Readout Group */}
                <div className="wp-telemetry-panel">
                  <div className="wp-telemetry-main">
                    <span className="wp-telemetry-label">pH</span>
                    <span className="wp-telemetry-value-lg">4,8</span>
                  </div>

                  <div className="wp-meta-item-group wp-telemetry-meta">
                    <div className="wp-meta-item">
                      <span className="wp-meta-label">Nhiệt độ</span>
                      <strong className="wp-meta-value">25,0 °C</strong>
                    </div>
                    <div className="wp-meta-item wp-volume-meta">
                      <span className="wp-meta-label">Thể tích</span>
                      <strong className={`wp-meta-value wp-volume-value ${isSimulatingAddition ? 'is-volume-pulse' : ''}`}>
                        {previewVolumeTotal} mL
                      </strong>
                    </div>
                  </div>

                  {/* Pulsing Status Pill */}
                  <div
                    className={`wp-status-pill ${isSimulatingAddition ? 'is-active-addition' : ''}`}
                    role="status"
                  >
                    <span className="wp-status-dot pulse-dot" aria-hidden="true" />
                    <span>{isSimulatingAddition ? 'Đang khuấy & thêm' : 'Đang khuấy'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2B: Chart & Tabs */}
            <div className="wp-chart">
              <div className="wp-chart-head">
                <p className="wp-panel-title">Biểu đồ theo thời gian</p>

                {/* Tab Controls */}
                <div className="wp-tabs" role="tablist" aria-label="Chọn loại biểu đồ">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'ph'}
                    className={`wp-tab-btn ${activeTab === 'ph' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ph')}
                  >
                    pH
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'concentration'}
                    className={`wp-tab-btn ${activeTab === 'concentration' ? 'active' : ''}`}
                    onClick={() => setActiveTab('concentration')}
                  >
                    Nồng độ
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'temperature'}
                    className={`wp-tab-btn ${activeTab === 'temperature' ? 'active' : ''}`}
                    onClick={() => setActiveTab('temperature')}
                  >
                    Nhiệt độ
                  </button>
                </div>
              </div>

              {/* Chart Visual Container */}
              <div className="wp-chart-stage">
                {activeTab === 'ph' && (
                  <svg
                    viewBox="0 0 320 180"
                    className="wp-chart-svg"
                    role="img"
                    aria-label="Biểu đồ pH theo thời gian: pH tăng từ 1,8 lên 4,8 và hướng tới mục tiêu 7,0"
                  >
                    <defs>
                      <linearGradient id="wp-ph-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Ticks (0, 7, 14) */}
                    <line x1="32" x2="310" y1="20" y2="20" stroke="var(--border)" strokeDasharray="3 3" opacity="0.6" />
                    <line x1="32" x2="310" y1="80" y2="80" stroke="#0ea5e9" strokeDasharray="4 4" strokeWidth="1" opacity="0.45" />
                    <line x1="32" x2="310" y1="145" y2="145" stroke="var(--border)" opacity="0.8" />

                    {/* Y Axis labels */}
                    <text x="24" y="24" textAnchor="end" fill="var(--ink-muted)" fontSize="9.5" fontFamily="var(--font-numeric)">14</text>
                    <text x="24" y="84" textAnchor="end" fill="#0284c7" fontSize="9.5" fontWeight="600" fontFamily="var(--font-numeric)">7</text>
                    <text x="24" y="148" textAnchor="end" fill="var(--ink-muted)" fontSize="9.5" fontFamily="var(--font-numeric)">0</text>

                    {/* Target pH = 7.0 guide pill */}
                    <g transform="translate(190, 68)">
                      <rect x="0" y="0" width="62" height="18" rx="4" fill="var(--surface)" stroke="#0284c7" strokeWidth="1" />
                      <text x="31" y="12.5" textAnchor="middle" fill="#0284c7" fontSize="9" fontWeight="700">pH = 7,0</text>
                    </g>

                    {/* Curve Fill Area */}
                    <path
                      d="M 32 128 C 80 125, 140 115, 180 95 C 220 75, 260 55, 310 50 L 310 145 L 32 145 Z"
                      fill="url(#wp-ph-fill)"
                    />

                    {/* Active pH Curve Line */}
                    <path
                      d="M 32 128 C 80 125, 140 115, 180 95 C 220 75, 260 55, 310 50"
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="2.75"
                      strokeLinecap="round"
                    />

                    {/* Current snapshot marker (pH 4.8 at ~8 min) */}
                    <circle cx="180" cy="95" r="7" fill="#0284c7" opacity="0.25" />
                    <circle cx="180" cy="95" r="4.5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />

                    {/* X Axis ticks */}
                    <text x="32" y="162" textAnchor="middle" fill="var(--ink-muted)" fontSize="9" fontFamily="var(--font-numeric)">0</text>
                    <text x="125" y="162" textAnchor="middle" fill="var(--ink-muted)" fontSize="9" fontFamily="var(--font-numeric)">5</text>
                    <text x="218" y="162" textAnchor="middle" fill="var(--ink-muted)" fontSize="9" fontFamily="var(--font-numeric)">10</text>
                    <text x="305" y="162" textAnchor="middle" fill="var(--ink-muted)" fontSize="9" fontFamily="var(--font-numeric)">15</text>
                    <text x="170" y="176" textAnchor="middle" fill="var(--ink-muted)" fontSize="8.5">Thời gian (phút)</text>
                  </svg>
                )}

                {activeTab === 'concentration' && (
                  <svg
                    viewBox="0 0 320 180"
                    className="wp-chart-svg"
                    role="img"
                    aria-label="Biểu đồ nồng độ ion theo thời gian: [H+] giảm dần và [Na+] tăng dần"
                  >
                    <line x1="34" x2="310" y1="20" y2="20" stroke="var(--border)" strokeDasharray="3 3" opacity="0.5" />
                    <line x1="34" x2="310" y1="80" y2="80" stroke="var(--border)" strokeDasharray="3 3" opacity="0.5" />
                    <line x1="34" x2="310" y1="145" y2="145" stroke="var(--border)" opacity="0.8" />

                    <text x="28" y="24" textAnchor="end" fill="var(--ink-muted)" fontSize="9" fontFamily="var(--font-numeric)">0.10</text>
                    <text x="28" y="84" textAnchor="end" fill="var(--ink-muted)" fontSize="9" fontFamily="var(--font-numeric)">0.05</text>
                    <text x="28" y="148" textAnchor="end" fill="var(--ink-muted)" fontSize="9" fontFamily="var(--font-numeric)">0.00</text>

                    {/* [H+] decaying */}
                    <path
                      d="M 34 35 C 100 40, 160 110, 310 135"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />

                    {/* [Na+] increasing */}
                    <path
                      d="M 34 140 C 100 120, 200 85, 310 55"
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />

                    {/* Legend */}
                    <g transform="translate(190, 20)">
                      <circle cx="5" cy="5" r="3.5" fill="#ef4444" />
                      <text x="14" y="8" fill="var(--ink)" fontSize="9" fontWeight="600">[H⁺]</text>
                      <circle cx="55" cy="5" r="3.5" fill="#0284c7" />
                      <text x="64" y="8" fill="var(--ink)" fontSize="9" fontWeight="600">[Na⁺]</text>
                    </g>

                    <text x="34" y="162" textAnchor="middle" fill="var(--ink-muted)" fontSize="9" fontFamily="var(--font-numeric)">0</text>
                    <text x="170" y="162" textAnchor="middle" fill="var(--ink-muted)" fontSize="9" fontFamily="var(--font-numeric)">8</text>
                    <text x="305" y="162" textAnchor="middle" fill="var(--ink-muted)" fontSize="9" fontFamily="var(--font-numeric)">15</text>
                    <text x="170" y="176" textAnchor="middle" fill="var(--ink-muted)" fontSize="8.5">Thời gian (phút)</text>
                  </svg>
                )}

                {activeTab === 'temperature' && (
                  <svg
                    viewBox="0 0 320 180"
                    className="wp-chart-svg"
                    role="img"
                    aria-label="Biểu đồ nhiệt độ ổn định ở 25.0 °C theo đặc tả mô hình"
                  >
                    <line x1="34" x2="310" y1="35" y2="35" stroke="var(--border)" strokeDasharray="3 3" opacity="0.5" />
                    <line x1="34" x2="310" y1="85" y2="85" stroke="#10b981" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                    <line x1="34" x2="310" y1="145" y2="145" stroke="var(--border)" opacity="0.8" />

                    <text x="28" y="38" textAnchor="end" fill="var(--ink-muted)" fontSize="9" fontFamily="var(--font-numeric)">30°</text>
                    <text x="28" y="88" textAnchor="end" fill="#10b981" fontSize="9" fontWeight="600" fontFamily="var(--font-numeric)">25°</text>
                    <text x="28" y="148" textAnchor="end" fill="var(--ink-muted)" fontSize="9" fontFamily="var(--font-numeric)">20°</text>

                    {/* Stable isothermal temperature curve */}
                    <line x1="34" x2="310" y1="85" y2="85" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="180" cy="85" r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />

                    <g transform="translate(140, 60)">
                      <rect x="0" y="0" width="110" height="18" rx="4" fill="var(--surface)" stroke="#10b981" strokeWidth="1" />
                      <text x="55" y="12.5" textAnchor="middle" fill="#047857" fontSize="9" fontWeight="700">25,0 °C (Chuẩn hóa)</text>
                    </g>

                    <text x="34" y="162" textAnchor="middle" fill="var(--ink-muted)" fontSize="9" fontFamily="var(--font-numeric)">0</text>
                    <text x="170" y="162" textAnchor="middle" fill="var(--ink-muted)" fontSize="9" fontFamily="var(--font-numeric)">8</text>
                    <text x="305" y="162" textAnchor="middle" fill="var(--ink-muted)" fontSize="9" fontFamily="var(--font-numeric)">15</text>
                    <text x="170" y="176" textAnchor="middle" fill="var(--ink-muted)" fontSize="8.5">Thời gian (phút)</text>
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* ================= COLUMN 3: NEXT ACTION CONTROLS ================= */}
          <div className="wp-actions">
            <p className="wp-panel-title">Thao tác</p>

            <div className="wp-controls-form">
              {/* Reagent Selector */}
              <div className="wp-form-group">
                <label className="wp-form-label" htmlFor="preview-reagent-select">
                  Chọn dung dịch
                </label>
                <div className="wp-select-wrapper">
                  <FlaskIcon className="wp-select-icon" />
                  <select
                    id="preview-reagent-select"
                    className="wp-select-input"
                    value={selectedReagent}
                    onChange={(e) => setSelectedReagent(e.target.value)}
                    aria-label="Chọn hóa chất trung hòa"
                  >
                    <option value="naoh-001">NaOH 0,0100 M (Chuẩn hóa)</option>
                  </select>
                </div>
              </div>

              {/* Volume Stepper */}
              <div className="wp-form-group">
                <label className="wp-form-label" htmlFor="preview-volume-input">
                  Thể tích thêm (mL)
                </label>
                <div className="wp-stepper-box">
                  <button
                    type="button"
                    className="wp-stepper-btn"
                    onClick={() => handleVolumeChange(-1)}
                    aria-label="Giảm 1 mL thể tích"
                  >
                    −
                  </button>
                  <input
                    id="preview-volume-input"
                    type="text"
                    readOnly
                    value={`${addedVolume} mL`}
                    className="wp-stepper-value"
                    aria-label="Thể tích dung dịch cần thêm"
                  />
                  <button
                    type="button"
                    className="wp-stepper-btn"
                    onClick={() => handleVolumeChange(1)}
                    aria-label="Tăng 1 mL thể tích"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Interactive Add Button (Local Only) */}
              <button
                type="button"
                className={`btn btn-primary wp-action-btn ${isSimulatingAddition ? 'btn-active-pulse' : ''}`}
                onClick={handleAddReagent}
              >
                <FlaskIcon className="wp-btn-icon" />
                <span>Thêm vào dung dịch</span>
              </button>

              {/* Reset Preview Button */}
              <button
                type="button"
                className="btn btn-ghost btn-sm wp-reset-btn"
                onClick={handleResetPreview}
              >
                Đặt lại
              </button>

              {/* Transient local interaction feedback */}
              {feedbackMsg && (
                <div className="wp-feedback-toast" role="status" aria-live="polite">
                  <span className="wp-toast-dot" />
                  <span className="wp-toast-text">{feedbackMsg}</span>
                  <Link
                    href="/simulate/acid-neutralization"
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

        {/* ================= BOTTOM ROW: RESULT & EXPLANATION ================= */}
        <div className="wp-below">
          {/* Result Card */}
          <div className="wp-result-card">
            <div className="wp-result-icon-box" aria-hidden="true">
              <CheckCircleIcon />
            </div>
            <div className="wp-result-copy">
              <strong className="wp-result-heading">pH tăng dần</strong>
              <p className="wp-result-desc">
                Dung dịch đang tiến gần đến trạng thái trung tính.
              </p>
            </div>
          </div>

          {/* Scientific Formula & Explanation Card */}
          <div className="wp-explanation-card">
            <div className="wp-formula-header">
              <span className="wp-formula-tag">Công thức &amp; giải thích</span>
            </div>
            <div className="wp-chemical-equation">
              HCl + NaOH → NaCl + H₂O
            </div>
            <p className="wp-explanation-body">
              Phản ứng trung hòa giữa axit mạnh và bazơ mạnh tạo muối và nước, pH tăng dần do nồng độ H⁺ giảm.
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
