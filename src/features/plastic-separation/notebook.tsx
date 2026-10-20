import type { StoredAttemptEventRecord } from '@/application/attempts/repository.js'
import type { PlasticSeparationState } from '@/domain/experiments/virgin-plastic-separation/model.js'
import type { PlasticProjection } from '@/application/scenarios/plastic-projection.js'
import { PLASTIC_PROFILE, VIRGIN_POLYMERS } from '@/domain/experiments/virgin-plastic-separation/model.js'
import { plasticFractionReadout, plasticStageLabel } from './readouts.js'
import ui from './workbench-ui.module.css'

export function PlasticNotebook({ projection, history = null }: { projection: PlasticProjection; history?: readonly StoredAttemptEventRecord<PlasticSeparationState>[] | null }) {
  return <section className={ui.notebook} aria-label="Sổ thực hành phân loại nhựa">
    <div className={ui.sectionHeader}><div><h2>Sổ thực hành</h2><p className={ui.muted}>Các bước tách và phân đoạn đã ghi nhận trong lượt này.</p></div><span className={ui.badge}>{plasticStageLabel(projection.stage)}</span></div>
    <p className={ui.muted}>Thu hồi tham khảo từ bài báo; khối lượng quy đổi từ 2,0 kg cấp liệu mỗi loại, không phải phép đo mới. Ô chưa ghi nhận không được tính là 0.</p>
    {projection.pendingCentrifugation && <p role="status" className={ui.muted}>Phân đoạn vừa tách đang chờ ghi nhận ly tâm và cân. Số liệu của bước này chưa được đưa vào bảng thu hồi.</p>}
    <PlasticFractionsTable projection={projection} feedMassKg={PLASTIC_PROFILE.sampleFeedMassKg} polymers={VIRGIN_POLYMERS} />
    <details open={projection.outcomesHistory.length === 0}><summary>Các bước tách đã ghi nhận · {projection.outcomesHistory.length}</summary>
      {!projection.outcomesHistory.length ? <p className={ui.muted}>Chưa ghi nhận bước tách nào. Bắt đầu từ mục Thao tác.</p> : <div className={ui.tableWrap}><table className={ui.table}><caption>Diễn biến các bước tách</caption><thead><tr><th scope="col">Môi trường</th><th scope="col">Phân đoạn nổi</th><th scope="col">Phân đoạn chìm</th><th scope="col">Trạng thái</th></tr></thead><tbody>{projection.outcomesHistory.map((outcome, index) => <tr key={index}><td>{outcome.mediumVi}</td><td>{outcome.floating.join(', ') || '—'}</td><td>{outcome.sinking.join(', ') || '—'}</td><td>{projection.pendingCentrifugation && index === projection.outcomesHistory.length - 1 ? 'Chờ ly tâm và cân' : 'Đã ghi nhận'}</td></tr>)}</tbody></table></div>}
    </details>
    <details><summary>Lịch sử thao tác đã lưu{history ? ' · ' + history.length : ''}</summary>{history ? history.length ? <ol className={ui.history}>{history.map(event => <li key={event.sequence}><span>{plasticActionLabel(event.actionType, event.normalizedInput)}</span><time dateTime={new Date(event.occurredAt).toISOString()}>{new Date(event.occurredAt).toLocaleString('vi-VN')}</time></li>)}</ol> : <p className={ui.muted}>Chưa ghi nhận thao tác nào.</p> : <p className={ui.muted}>Chưa đọc được lịch sử thao tác. Bạn có thể tải lại lượt; số liệu đã lưu được giữ nguyên.</p>}</details>
    <details><summary>Hồ sơ sáu mẫu ban đầu</summary><div className={ui.tableWrap}><table className={ui.table}><caption>Thông số mẫu nguyên sinh trong hồ sơ</caption><thead><tr><th scope="col">Mẫu</th><th scope="col">Khối lượng riêng</th><th scope="col">Hình thái</th><th scope="col">Kích thước</th></tr></thead><tbody>{VIRGIN_POLYMERS.map(polymer => <tr key={polymer.id}><th scope="row">{polymer.id}</th><td>{polymer.nominalDensity}</td><td>{polymer.formVi}</td><td>{polymer.sizeRangeMm}</td></tr>)}</tbody></table></div><p className={ui.muted}>Màu hạt trên mô phỏng là mã nhận diện; không biểu thị màu thật của tất cả mẫu.</p></details>
  </section>
}

export function PlasticFractionsTable({ projection, feedMassKg, polymers }: { projection: PlasticProjection; feedMassKg: number; polymers: typeof VIRGIN_POLYMERS }) {
  return <div className={ui.tableWrap}><table className={ui.table}><caption>Các phân đoạn đã ghi nhận</caption><thead><tr><th scope="col">Mẫu</th><th scope="col">Phân đoạn thu</th><th scope="col">Thu hồi tham khảo</th><th scope="col">Khối lượng quy đổi</th></tr></thead><tbody>{polymers.map(polymer => {
    const readout = plasticFractionReadout(projection, polymer.id, feedMassKg)
    return <tr key={polymer.id}><th scope="row">{polymer.id}</th><td>{readout ? <>{readout.fraction.mediumUsed}<br />{readout.fraction.behavior === 'floating' ? 'Phân đoạn nổi' : 'Phân đoạn chìm'}</> : 'Chưa ghi nhận'}</td><td>{readout?.recovery == null ? 'Chưa ghi nhận' : readout.recovery.toLocaleString('vi-VN') + '%'}</td><td>{readout?.massKg == null ? 'Chưa ghi nhận' : '≈ ' + readout.massKg.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 3 }) + ' kg'}</td></tr>
  })}</tbody></table></div>
}

function plasticActionLabel(type: string, input: Record<string, number | string | boolean>) {
  const labels: Record<string, string> = { prepare_samples: 'Chuẩn bị sáu mẫu', load_and_wet: 'Nạp mẫu và ghi nhận làm ướt', separate_water: 'Tách sơ bộ trong nước', centrifuge_and_weigh: 'Ghi nhận ly tâm và cân', summarize_fractions: 'Xem tổng kết phân đoạn', complete: 'Nộp bài', completed: 'Nộp bài' }
  if (type === 'select_branch') return input.branch === 'light' ? 'Chọn nhánh ethanol' : 'Chọn nhánh NaCl'
  if (type === 'run_ethanol_preset' || type === 'run_nacl_preset') return 'Chạy ' + (type === 'run_ethanol_preset' ? 'ethanol ' : 'NaCl ') + (input.concentration === 11.5 ? '11–12' : Number(input.concentration).toLocaleString('vi-VN')) + (type === 'run_ethanol_preset' ? '% v/v' : '% w/v')
  return labels[type] ?? 'Ghi nhận thao tác của lượt'
}
