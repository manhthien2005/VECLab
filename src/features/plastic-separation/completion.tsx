'use client'

import Link from 'next/link'
import type { PlasticReportSnapshot } from '@/application/scenarios/plastic-projection.js'
import { PlasticDialog } from './dialog.js'
import { PlasticFractionsTable } from './notebook.js'
import { PLASTIC_LESSON_LIMITS, PLASTIC_SOURCE_NOTE } from './lesson-content.js'
import ui from './workbench-ui.module.css'

export function PlasticCompletionDialog({ report, onClose = () => {}, onNewAttempt }: { report: PlasticReportSnapshot; onClose?: () => void; onNewAttempt?: () => void }) {
  const allBranches = report.projection.completedBranches.includes('light') && report.projection.completedBranches.includes('heavy')
  return <PlasticDialog title="Báo cáo phân loại nhựa nguyên sinh" onClose={onClose}>
    <span className={ui.badge}>Báo cáo đã lưu · Chỉ xem</span>
    <h3>{allBranches ? 'Đã hoàn thành cả hai nhánh' : 'Chưa hoàn thành cả hai nhánh'}</h3>
    <p>{allBranches ? 'Lượt đã ghi nhận các mức nồng độ của nhánh ethanol và nhánh NaCl.' : 'Báo cáo này chỉ hiển thị phần đã thực hiện. Phân đoạn còn thiếu được giữ ở trạng thái chưa ghi nhận.'} Các kết quả dưới đây lấy từ báo cáo đã chốt khi nộp bài.</p>
    <p className={ui.muted}>Khối lượng quy đổi theo tỷ lệ thu hồi tham khảo và {report.reference.sampleFeedMassKg.toLocaleString('vi-VN')} kg cấp liệu mỗi mẫu; không phải phép đo mới. Thu hồi không đồng nghĩa với độ tinh khiết.</p>
    <PlasticFractionsTable projection={report.projection} feedMassKg={report.reference.sampleFeedMassKg} polymers={report.reference.polymers} />
    <h3>Đối chiếu mục tiêu học tập</h3>
    <ul><li>Phân biệt PP và HDPE với nhóm PS, ABS, PA, PC sau bước tách trong nước.</li><li>Đọc phân đoạn nổi và chìm qua các mức nồng độ cố định của từng nhánh.</li><li>Đối chiếu tỷ lệ thu hồi với khối lượng quy đổi và giới hạn của hồ sơ.</li></ul>
    <details><summary>Điều kiện và nguồn của báo cáo</summary><p>Bể {report.reference.pilotTankVolumeLiters.toLocaleString('vi-VN')} L · Khuấy {report.reference.wettingStirringRpm} rpm · Ly tâm {report.reference.centrifugeRpm.toLocaleString('vi-VN')} rpm.</p><p><a href={'https://doi.org/' + report.reference.sourceDoi} target="_blank" rel="noopener noreferrer">Meneses Quelal và cộng sự (2022) — mở bài báo</a></p><p className={ui.muted}>{PLASTIC_SOURCE_NOTE}</p><p className={ui.version}>Phiên bản: {report.releaseId} · Hồ sơ {report.versions.profileVersion} · Báo cáo {report.schemaVersion}</p><p className={ui.version}>Chốt lúc {new Date(report.generatedAt).toLocaleString('vi-VN')}</p></details>
    <details><summary>Phạm vi và giới hạn</summary><ul>{PLASTIC_LESSON_LIMITS.map(limit => <li key={limit}>{limit}</li>)}</ul></details>
    <div className={ui.actions}><Link className={ui.button} href="/lab">Về lab</Link><button className={ui.button} type="button" onClick={onClose}>Quay lại sổ thực hành</button>{onNewAttempt && <button className={ui.primary} type="button" onClick={onNewAttempt}>Bắt đầu lượt mới</button>}</div>
  </PlasticDialog>
}
