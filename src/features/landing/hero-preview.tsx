import Image from 'next/image'
import { APP_STRINGS } from '@/content/index.js'
import { JAR_PROFILE } from '@/domain/experiments/jar-test/model.js'
import { FlaskIcon, GuestIcon } from './icons.js'
import { HeroPointerStage } from './hero-pointer-stage.js'

/** Product illustration only: locked inputs, no fabricated measurements or progress. */
export function HeroPreview() {
  return <div className="hero-preview-wrapper rise rise-2"><HeroPointerStage><div className="device-frame">
    <div className="device-topbar"><div className="device-dots" aria-hidden="true"><i className="dot-red"/><i className="dot-yellow"/><i className="dot-green"/></div><div className="device-breadcrumbs"><span className="device-brand-text">{APP_STRINGS.brand}</span><span className="device-slash">/</span><span className="device-crumb-muted">Thí nghiệm</span><span className="device-slash">/</span><span className="device-crumb-current">Jar Test</span></div><div className="device-mode-badge"><GuestIcon className="device-mode-icon"/><span>Minh họa giao diện</span></div></div>
    <div className="device-stage">
      <div className="device-apparatus-column"><div className="hero-telemetry-entrance"><div className="telemetry-badge hero-depth-telemetry"><div className="telemetry-badge-ph"><span className="telemetry-badge-label">Mẫu đầu</span><span className="telemetry-badge-val">{JAR_PROFILE.initialNtu} NTU</span></div><div className="telemetry-badge-divider"/><div className="telemetry-badge-details"><span className="telemetry-badge-temp-label">Hồ sơ mẫu</span><span className="telemetry-badge-temp-val">Kaolin · Phèn nhôm</span></div></div></div>
      <div className="device-apparatus-viewport hero-apparatus-entrance"><Image src="/assets/experiments/jar.webp" width={380} height={380} alt="Minh họa cốc Jar Test và cánh khuấy" className="apparatus-render hero-depth-apparatus" priority /></div>
      <div className="hero-equation-entrance"><div className="device-equation-card hero-depth-telemetry"><div className="equation-text">Keo tụ → Tạo bông → Lắng</div><p className="device-progress-label">So sánh các cốc bằng số đo độ đục.</p></div></div></div>
      <div className="device-data-column"><div className="hero-chart-card hero-depth-telemetry"><div className="hero-chart-header"><p className="hero-chart-title">Điều kiện khảo sát</p><span className="hero-chart-tag">Jar Test</span></div><div className="hero-chart-body"><dl className="hero-jar-conditions"><div><dt>pH ban đầu</dt><dd>{JAR_PROFILE.availableInitialPh.join(' / ')}</dd></div><div><dt>Liều phèn nhôm</dt><dd>{JAR_PROFILE.minDoseMgL}–{JAR_PROFILE.maxDoseMgL} mg/L</dd></div><div><dt>Thể tích mẫu</dt><dd>{JAR_PROFILE.aliquotVolumeL.toLocaleString('vi-VN')} L / cốc</dd></div><div><dt>Kết quả</dt><dd>Đo NTU · Tự tính hiệu suất</dd></div></dl></div></div>
      <div className="hero-status-entrance"><div className="hero-status-card hero-depth-telemetry"><div className="hero-status-icon" aria-hidden="true"><FlaskIcon/></div><div className="hero-status-info"><span className="hero-status-label">Mục tiêu thực hành</span><p className="hero-status-state">Giảm độ đục ít nhất {JAR_PROFILE.goalRemovalPercent}%</p><p className="hero-status-hint">Đối chiếu đáp số và xem lại thao tác sau khi nộp.</p></div></div></div></div>
    </div>
  </div></HeroPointerStage></div>
}
