'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ACID_INPUT_DOMAIN, APP_STRINGS } from '@/content/index.js'
import { formatMl } from '@/shared/ui/format.js'
import { FlaskIcon, ArrowRightIcon } from './icons.js'

/** Volume-only local illustration. No chemistry, measurement, API or attempt storage. */
const ADDITION_ML = 1
const SIMULATION_HREF = '/simulate/acid-neutralization'

export function WorkbenchPreview() {
  const strings = APP_STRINGS.home
  const initialMl = ACID_INPUT_DOMAIN.benchmark.acidVolumeL * 1000
  const [volumeMl, setVolumeMl] = useState(initialMl)
  const [hasAdded, setHasAdded] = useState(false)
  return (
    <div className="workbench-section reveal" data-reveal-variant="assemble">
      <div className="section-head-center">
        <h2 className="workbench-main-title">{strings.workbenchHeading}</h2>
        <p className="lede workbench-lede">{strings.workbenchLede}</p>
      </div>
      <div className="workbench-frame">
        <div className="workbench-frame-bar">
          <div className="wb-bar-title">
            <FlaskIcon className="wp-btn-icon" aria-hidden="true" />
            <strong className="wb-bar-scenario">Điều chỉnh pH · Minh họa thao tác</strong>
          </div>
          <Link className="btn btn-sm btn-ghost wb-open-link" href={SIMULATION_HREF}>
            Mở bài pH <ArrowRightIcon aria-hidden="true" />
          </Link>
        </div>
        <div className="wp-grid">
          <div className="wp-middle">
            <div className="wp-state">
              <p className="wp-panel-title">Cốc phản ứng · Chưa thực hiện phép đo</p>
              <div className="wp-state-display">
                <div className="wp-apparatus-frame">
                  <Image src="/assets/hero-apparatus.webp" width={220} height={220}
                    alt="Minh họa cốc mẫu, máy khuấy và điện cực"
                    className="wp-apparatus-img" />
                </div>
                <div className="wp-telemetry-panel">
                  <div className="wp-telemetry-main">
                    <span className="wp-telemetry-label">pH</span>
                    <strong className="wp-telemetry-value-lg">Chưa đo</strong>
                  </div>
                  <div className="wp-telemetry-meta">
                    <div className="wp-meta-item">
                      <span className="wp-meta-label">Thể tích minh họa</span>
                      <strong className="wp-meta-value wp-volume-value">{formatMl(volumeMl)}</strong>
                    </div>
                  </div>
                  <p className="wp-status-pill">Minh họa thao tác · Không tạo số đo</p>
                </div>
              </div>
            </div>
          </div>
          <div className="wp-actions">
            <p className="wp-panel-title">Thử thao tác mẫu</p>
            <div className="wp-controls-form">
              <p className="wp-reagent-fixed">{strings.workbenchReagent}</p>
              <button type="button" className="btn btn-primary wp-action-btn"
                onClick={() => { setVolumeMl((prev) => prev + ADDITION_ML); setHasAdded(true) }}>
                {strings.workbenchDemoCta}
              </button>
              <button type="button" className="btn btn-ghost btn-sm wp-reset-btn"
                onClick={() => { setVolumeMl(initialMl); setHasAdded(false) }}>
                {strings.workbenchDemoReset}
              </button>
              {hasAdded ? (
                <div className="wp-feedback-toast" role="status" aria-live="polite">
                  <span className="wp-toast-text">{strings.workbenchDemoFeedback}</span>
                  <Link href={SIMULATION_HREF} className="wp-toast-link">Mở bài pH</Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div className="landing-workbench-note">
          <p>Minh họa chỉ thay đổi thể tích hiển thị. Không tính pH, không lưu lượt học.</p>
          <Link href="/experiments/acid-neutralization">Xem điều kiện và giới hạn bài pH</Link>
        </div>
      </div>
    </div>
  )
}
