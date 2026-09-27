import Image from 'next/image'
import { ACID_INPUT_DOMAIN, APP_STRINGS } from '@/content/index.js'
import { formatPh } from '@/shared/ui/format.js'
import { FlaskIcon, GuestIcon } from './icons.js'
import { HeroPhChart } from './landing-visuals.js'

/**
 * Hero scientific product preview frame (docs/web-application-scope.md §4.1).
 *
 * Implements the approved asymmetrical product preview frame:
 * - Application-window frame with macOS-style window controls
 * - Real breadcrumb and mode badge
 * - Non-obscuring floating live telemetry badge (pH 5.2 / 25.0 °C)
 * - Central high-fidelity titration apparatus render with true alpha transparency
 * - Real coded pH curve with target callout and mid-point snapshot
 * - Chemical reaction equation and progress indicator
 * - Status card displaying current state and canonical target pH* from ACID_INPUT_DOMAIN
 *
 * Server Component: renders pure HTML/CSS/SVG with zero client JavaScript overhead.
 */
export function HeroPreview() {
  const benchmark = ACID_INPUT_DOMAIN.benchmark

  return (
    <div className="hero-preview-wrapper rise rise-2">
      <div className="device-frame">
        {/* macOS Topbar */}
        <div className="device-topbar">
          <div className="device-dots" aria-hidden="true">
            <i className="dot-red" />
            <i className="dot-yellow" />
            <i className="dot-green" />
          </div>
          <div className="device-breadcrumbs">
            <span className="device-brand-text">{APP_STRINGS.brand}</span>
            <span className="device-slash" aria-hidden="true">/</span>
            <span className="device-crumb-muted">Thí nghiệm</span>
            <span className="device-slash" aria-hidden="true">/</span>
            <span className="device-crumb-current">Trung hòa axit</span>
          </div>
          <div className="device-mode-badge" title="Môi trường học tập không lưu điểm bắt buộc">
            <GuestIcon className="device-mode-icon" />
            <span>Chế độ học tập</span>
            <svg className="device-mode-chevron" viewBox="0 0 10 10" width="8" height="8" aria-hidden="true">
              <path d="M2 3.5L5 6.5L8 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Device Stage Canvas */}
        <div className="device-stage">
          {/* Left Column: Apparatus & Floating Live Telemetry */}
          <div className="device-apparatus-column">
            {/* Top-left Telemetry Badge (Compact, non-obscuring floating card) */}
            <div className="telemetry-badge hero-float-gentle">
              <div className="telemetry-badge-ph">
                <span className="telemetry-badge-label">pH</span>
                <span className="telemetry-badge-val">5,2</span>
              </div>
              <div className="telemetry-badge-divider" aria-hidden="true" />
              <div className="telemetry-badge-details">
                <span className="telemetry-badge-temp-label">Nhiệt độ</span>
                <span className="telemetry-badge-temp-val">25,0 °C</span>
              </div>
              <span className="sr-only">Minh họa tiến trình</span>
            </div>

            {/* Central Apparatus Render Viewport */}
            <div className="device-apparatus-viewport">
              <Image
                src="/assets/hero-apparatus.webp"
                width={380}
                height={380}
                alt="Mô phỏng bộ chuẩn độ axit-bazơ gồm cốc thủy tinh chứa dung dịch, máy khuấy từ và điện cực đo pH"
                className="apparatus-render"
                priority
              />
            </div>

            {/* Bottom-left Equation & Progress Card */}
            <div className="device-equation-card">
              <div className="equation-text">
                HCl + NaOH → NaCl + H₂O
              </div>
              <div className="device-progress-row">
                <span className="device-progress-label">Đang thêm NaOH…</span>
                <div
                  className="device-progress-track"
                  role="progressbar"
                  aria-valuenow={60}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Tiến trình thêm dung dịch"
                >
                  <div className="device-progress-fill" style={{ width: '60%' }} />
                </div>
                <span className="device-progress-pct">60%</span>
              </div>
            </div>
          </div>

          {/* Right Column: Scientific Live Chart & Real-time Status Card */}
          <div className="device-data-column">
            {/* Chart Card */}
            <div className="hero-chart-card">
              <div className="hero-chart-header">
                <h3 className="hero-chart-title">Biểu đồ pH theo thời gian</h3>
                <span className="hero-chart-tag">Mô phỏng cân bằng</span>
              </div>
              <div className="hero-chart-body">
                <HeroPhChart />
              </div>
            </div>

            {/* Status & Outcome Card */}
            <div className="hero-status-card hero-float-gentle-alt">
              <div className="hero-status-icon" aria-hidden="true">
                <FlaskIcon />
              </div>
              <div className="hero-status-info">
                <span className="hero-status-label">Trạng thái hiện tại</span>
                <p className="hero-status-state">Dung dịch gần trung tính</p>
                <p className="hero-status-hint">
                  Tiếp tục thêm để đạt pH* {formatPh(benchmark.targetPH)} (±{formatPh(benchmark.targetTolerancePH)})
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
