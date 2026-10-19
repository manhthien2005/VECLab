import type { ReactNode } from 'react'
import type { PlasticProjection } from '@/application/scenarios/plastic-projection.js'
import { ActionButton } from '@/features/workbench/action-button.js'
import { OperationHelp } from '@/features/workbench/operation-help.js'
import { ControlIcon } from '@/features/workbench/icons.js'
import { PLASTIC_WORKBENCH_STEPS, plasticWeighingLabel, type PlasticControlGroup, type plasticWorkbenchContext } from './readouts.js'
import bench from '@/features/extraction/bench.module.css'
import ui from './workbench-ui.module.css'

type Props = {
  projection: PlasticProjection | null
  context: ReturnType<typeof plasticWorkbenchContext> | null
  openGroup: PlasticControlGroup | null
  onGroupChange: (group: PlasticControlGroup | null) => void
  lockReason: string | null
  done: boolean
  reportAvailable: boolean
  guideHref: string
  onPrepare: () => void
  onWet: () => void
  onWater: () => void
  onCentrifuge: () => void
  onBranch: (branch: 'light' | 'heavy') => void
  onPreset: (type: string, parameters: Record<string, number | string | boolean>) => void
  onSummary: () => void
  onSubmit: () => void
  onReport: () => void
  onNotebook: () => void
  onReset: () => void
}

export function PlasticControls(props: Props) {
  const { projection: p, context, lockReason: lock, done } = props
  const action = (label: string, onClick: () => void, reason: string | null = null) =>
    <ActionButton className={bench.primary} reasonClassName={bench.actionReason} reason={lock ?? reason} onClick={onClick}>{label}</ActionButton>
  const help = (label: string, points: string[], guideAnchor: string) =>
    <OperationHelp topic={{ label, points, guideAnchor }} guideBaseHref={props.guideHref} />
  const group = (id: PlasticControlGroup, summary: string, children: ReactNode) => {
    const step = PLASTIC_WORKBENCH_STEPS.find(step => step.id === id)!
    const index = PLASTIC_WORKBENCH_STEPS.indexOf(step)
    return <details id={'plastic-control-' + id} className={bench.controlGroup} open={props.openGroup === id}>
      <summary onClick={event => { event.preventDefault(); props.onGroupChange(props.openGroup === id ? null : id) }}>
        <span className={bench.controlIcon}><ControlIcon kind={step.icon} /></span>
        <span className={bench.controlText}><strong>{index + 1}. {step.label}</strong><small>{summary}</small></span>
      </summary>
      <div className={bench.groupBody}>{children}</div>
    </details>
  }
  return <div className={ui.controls}>
    <div className={bench.controlsHeading}><h2>Thao tác</h2>{p && <span className={ui.badge}>{p.completedBranches.length}/2 nhánh</span>}</div>
    {!p || !context ? <p className={bench.empty}>Bắt đầu lượt để chuẩn bị mẫu và sử dụng dụng cụ.</p> : done ? <div className={bench.readonly}>
      <h3>Lượt đã nộp</h3><p>Thao tác đã khóa. Sổ và báo cáo giữ kết quả của lượt này.</p>
      <ActionButton className={bench.primary} reasonClassName={bench.actionReason} reason={props.reportAvailable ? null : 'Chưa đọc được báo cáo đã chốt. Dữ liệu được giữ nguyên; bạn vẫn có thể xem sổ.'} onClick={props.onReport}>Xem báo cáo đã lưu</ActionButton>
      <button className={bench.button} type="button" onClick={props.onNotebook}>Xem sổ thực hành</button>
      <button className={bench.button} type="button" onClick={props.onReset}>Bắt đầu lượt mới</button>
    </div> : <>
      <div className={bench.operationState} role="status"><strong>{context.label}</strong><span>{context.next}</span></div>
      {group('prepare', p.wetted ? 'Đã ghi nhận làm ướt' : p.samplesPrepared ? 'Đã chuẩn bị · Chờ nạp mẫu' : 'Sáu mẫu · 2,0 kg mỗi loại', <>
        {help('Chuẩn bị và làm ướt thế nào?', ['Chuẩn bị PP, HDPE, PS, ABS, PA và PC.', 'Nạp mẫu vào bể; ghi nhận điều kiện làm ướt 160 rpm trong 1 giờ của hồ sơ. Thời gian minh họa được rút gọn.'], 'step-prepare')}
        <p>Khối lượng cấp liệu: <strong>2,0 kg / loại · 12,0 kg tổng cộng</strong>.</p>
        {!p.samplesPrepared && action('Chuẩn bị 6 mẫu polymer', props.onPrepare)}
        {p.samplesPrepared && !p.wetted && action('Nạp mẫu & ghi nhận bước làm ướt', props.onWet)}
        {p.wetted && <p>Đã ghi nhận bước làm ướt. Tiếp tục tách trong nước.</p>}
      </>)}
      {group('water', p.waterSeparated ? 'Đã ghi nhận · Hai phân đoạn' : 'Nước máy · Tách sơ bộ', <>
        {help('Đọc kết quả nổi–chìm', ['Đối chiếu khối lượng riêng của mẫu với môi trường tách.', 'PP + HDPE nổi; PS, ABS, PA và PC chìm. Thu hồi tham khảo 97,5% áp dụng cho nhóm PP + HDPE.'], 'step-water-separation')}
        {p.waterSeparated ? <p>Đã ghi nhận tách trong nước. Xem hai phân đoạn dưới khu vực thực hành.</p> : action('Ghi nhận tách sơ bộ trong nước', props.onWater, !p.wetted ? 'Chuẩn bị và làm ướt mẫu trước.' : null)}
      </>)}
      {group('weigh', p.pendingCentrifugation ? 'Phân đoạn vừa tách · Chờ ghi nhận' : p.centrifuged ? 'Đã ghi nhận bước gần nhất' : '2.950 rpm · Khối lượng quy đổi', <>
        {help('Vì sao ly tâm rồi cân?', ['Ghi nhận bước ly tâm tách ẩm sau mỗi bước tách.', 'Khối lượng quy đổi = khối lượng cấp liệu × tỷ lệ thu hồi tham khảo / 100; không phải phép đo mới.'], 'step-centrifugation')}
        <div className={bench.operationState}><span>Khối lượng quy đổi gần nhất</span><strong>{plasticWeighingLabel(p)}</strong>{p.weighedLabelVi && !p.pendingCentrifugation && <span>{p.weighedLabelVi}</span>}</div>
        {(!p.centrifuged || p.pendingCentrifugation) && action('Ghi nhận ly tâm phân đoạn & Cân mẫu', props.onCentrifuge, !p.waterSeparated ? 'Tách sơ bộ trong nước trước.' : null)}
      </>)}
      {group('separate', p.completedBranches.length === 2 ? 'Đã hoàn thành cả hai nhánh' : p.activeBranch === 'light' ? 'Nhánh ethanol · PP + HDPE' : p.activeBranch === 'heavy' ? 'Nhánh NaCl · PS, ABS, PA, PC' : 'Ethanol và NaCl · Hai nhánh cần làm', <>
        {help('Chọn nhánh và mức nồng độ', ['Có thể chọn thứ tự hai nhánh. Trong mỗi nhánh, chạy lần lượt từng mức và ghi nhận ly tâm, cân sau mỗi lần tách.', 'Ethanol dùng % v/v; NaCl dùng % w/v. Chỉ dùng các mức cố định trong hồ sơ.'], 'step-branch-solution')}
        <PlasticBranchControls {...props} projection={p} />
      </>)}
      {group('summary', p.stage === 'summary' ? 'Đã tổng kết · Sẵn sàng kiểm tra' : `${p.completedBranches.length}/2 nhánh hoàn tất`, <>
        <p>Đối chiếu các phân đoạn đã ghi nhận trong sổ. Nộp bài sẽ chốt báo cáo và khóa thao tác.</p>
        {p.stage !== 'summary' && action('Xem tổng kết các phân đoạn thu hồi', props.onSummary, p.completedBranches.length !== 2 || p.pendingCentrifugation ? 'Hoàn tất cả hai nhánh và ghi nhận ly tâm, cân trước.' : null)}
        <button className={bench.button} type="button" onClick={props.onNotebook}>Xem sổ thực hành</button>
        {p.stage === 'summary' && <button className={bench.primary} type="button" onClick={props.onSubmit}>Kiểm tra và nộp bài</button>}
      </>)}
      <button className={bench.button + ' ' + ui.newRun} type="button" onClick={props.onReset}>Bắt đầu lượt mới</button>
    </>}
  </div>
}

function PlasticBranchControls(props: Props & { projection: PlasticProjection }) {
  const { projection: p } = props
  const canBranch = p.centrifuged && !p.pendingCentrifugation
  const branchReason = props.lockReason ?? (!canBranch ? 'Hoàn tất bước ly tâm và cân trước khi đổi nhánh.' : null)
  const presets = p.activeBranch === 'light' ? [
    { concentration: 23, label: 'ethanol 23% v/v', text: 'PP nổi, HDPE chìm; ghi nhận thu hồi PP.' },
    { concentration: 31, label: 'ethanol 31% v/v', text: 'Nạp lại PP cùng phân đoạn HDPE theo hồ sơ. PP nổi, HDPE chìm; ghi nhận thu hồi HDPE.' },
  ] : [
    { concentration: 11.5, label: 'NaCl 11–12% w/v', text: 'PS nổi; ABS, PA và PC chìm.' },
    { concentration: 20, label: 'NaCl 20% w/v', text: 'ABS nổi; PA và PC chìm.' },
    { concentration: 40, label: 'NaCl 40% w/v', text: 'PA nổi, PC chìm; ghi nhận cả hai phân đoạn.' },
  ]
  const progress = p.activeBranch === 'light' ? p.ethanolProgress : p.naclProgress
  const preset = presets[progress]
  const presetReason = props.lockReason ?? (p.pendingCentrifugation ? 'Ghi nhận ly tâm và cân trước khi chạy mức tiếp theo.' : null)
  return <>
    <div className={ui.branch} role="group" aria-label="Chọn nhánh dung dịch">{(['light', 'heavy'] as const).map(branch => {
      const name = branch === 'light' ? 'Nhánh nhẹ (Ethanol)' : 'Nhánh nặng (NaCl)'
      const complete = p.completedBranches.includes(branch)
      return <button key={branch} className={bench.button} type="button" aria-label={name} aria-pressed={p.activeBranch === branch} aria-describedby="plastic-branch-reason" disabled={!!branchReason || complete || p.activeBranch === branch} onClick={() => props.onBranch(branch)}>{name}{complete && <small>Đã hoàn tất</small>}</button>
    })}</div>
    <p id="plastic-branch-reason" className={bench.actionReason}>{branchReason ?? (p.activeBranch && !p.completedBranches.includes(p.activeBranch) ? 'Đang thực hiện nhánh ' + (p.activeBranch === 'light' ? 'ethanol.' : 'NaCl.') : p.completedBranches.length ? 'Chọn nhánh còn lại để tiếp tục.' : 'Hai nhánh đều cần hoàn thành; có thể chọn thứ tự.')}</p>
    {p.activeBranch && <>
      <ol className={ui.presets} aria-label="Các mức nồng độ của nhánh">{presets.map((entry, index) => {
        const status = progress > index ? p.pendingCentrifugation && progress === index + 1 ? 'Chờ cân' : 'Đã ghi nhận' : progress === index ? 'Tiếp theo' : 'Chưa thực hiện'
        return <li key={entry.label} data-current={progress === index}><strong>{entry.label}</strong><span>{status}</span></li>
      })}</ol>
      {preset ? <><p>{preset.text}</p><ActionButton className={bench.primary} reasonClassName={bench.actionReason} reason={presetReason} onClick={() => props.onPreset(p.activeBranch === 'light' ? 'run_ethanol_preset' : 'run_nacl_preset', { concentration: preset.concentration })}>Chạy {preset.label}</ActionButton></> : <p>{p.pendingCentrifugation ? 'Ghi nhận ly tâm và cân để hoàn tất nhánh này.' : 'Đã hoàn thành các mức nồng độ của nhánh này.'}</p>}
    </>}
  </>
}
