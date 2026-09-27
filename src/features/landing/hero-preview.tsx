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
 * - Top-left telemetry card (clearly marked illustrative snapshot)
 * - Central high-fidelity titration apparatus render
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
          </div>
        </div>

        {/* Device Stage Canvas */}
        <div className="device-stage">
          {/* Top-left Telemetry Card */}
          <div className="telemetry-card telemetry-card-left hero-float-gentle">
            <div className="telemetry-card-header">
              <span className="telemetry-pill">Minh họa tiến trình</span>
            </div>
            <div className="telemetry-metrics">
              <div className="telemetry-metric">
                <span className="telemetry-label">pH</span>
                <span className="telemetry-val telemetry-val-ph">5,2</span>
              </div>
              <div className="telemetry-metric">
                <span className="telemetry-label">Nhiệt độ</span>
                <span className="telemetry-val">25,0 °C</span>
              </div>
            </div>
          </div>

          {/* Central Apparatus */}
          <div className="device-apparatus-stage">
            <Image
              src="/assets/hero-apparatus.jpg"
              width={380}
              height={380}
              alt="Mô phỏng bộ chuẩn độ axit-bazơ gồm cốc thủy tinh chứa dung dịch, máy khuấy từ và điện cực đo pH"
              className="apparatus-render"
              priority
            />
          </div>

          {/* Top-right Chart Card */}
          <div className="hero-chart-card">
            <div className="hero-chart-header">
              <h3 className="hero-chart-title">Biểu đồ pH theo thời gian</h3>
              <span className="hero-chart-tag">Mô phỏng cân bằng</span>
            </div>
            <HeroPhChart />
          </div>

          {/* Bottom-left Equation & Progress Card */}
          <div className="device-equation-card">
            <div className="equation-text">
              HCl + NaOH → NaCl + H₂O
            </div>
            <div className="device-progress-row">
              <span className="device-progress-label">Đang thêm NaOH…</span>
              <div className="device-progress-track" role="progressbar" aria-valuenow={60} aria-valuemin={0} aria-valuemax={100} aria-label="Tiến trình thêm dung dịch">
                <div className="device-progress-fill" style={{ width: '60%' }} />
              </div>
              <span className="device-progress-pct">60%</span>
            </div>
          </div>

          {/* Bottom-right Status Card */}
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
  )
}
