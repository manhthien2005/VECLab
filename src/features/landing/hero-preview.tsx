import Image from 'next/image'
import { APP_STRINGS } from '@/content/index.js'
import { FlaskIcon } from './icons.js'
import { HeroPointerStage } from './hero-pointer-stage.js'

/** Static product illustration: no simulated reading, score or progress. */
export function HeroPreview() {
  return (
    <div className="hero-preview-wrapper rise rise-2">
      <HeroPointerStage>
        <div className="device-frame">
          <div className="device-topbar">
            <div className="device-breadcrumbs">
              <span className="device-brand-text">{APP_STRINGS.brand}</span>
              <span className="device-slash" aria-hidden="true">/</span>
              <span>Điều chỉnh pH</span>
            </div>
            <span className="device-mode-badge">Minh họa giao diện</span>
          </div>
          <div className="device-stage">
            <div className="device-apparatus-column">
              <div className="device-apparatus-viewport hero-apparatus-entrance">
                <Image src="/assets/hero-apparatus.webp" width={380} height={380}
                  alt="Bộ dụng cụ minh họa gồm cốc, máy khuấy từ và điện cực pH"
                  className="apparatus-render hero-depth-apparatus" priority />
              </div>
            </div>
            <div className="device-data-column">
              <div className="hero-status-card hero-depth-telemetry">
                <div className="hero-status-icon" aria-hidden="true"><FlaskIcon /></div>
                <div className="hero-status-info">
                  <span className="hero-status-label">Minh họa — không phải phép đo</span>
                  <p className="hero-status-state">Thử cách thao tác</p>
                  <p className="hero-status-hint">Chọn dung dịch, thêm lượng đã chọn rồi thực hiện phép đo trong bài pH hiện có.</p>
                </div>
              </div>
              <ol className="landing-demo-sequence">
                <li>Chuẩn bị mẫu</li>
                <li>Thêm dung dịch</li>
                <li>Đo và ghi nhận</li>
              </ol>
            </div>
          </div>
        </div>
      </HeroPointerStage>
    </div>
  )
}
