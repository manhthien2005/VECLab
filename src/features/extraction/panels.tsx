import { useEffect, useRef, type ReactNode } from 'react'
import { TargetIcon, CloseIcon, ControlIcon } from '@/features/workbench/icons.js'
import { RepeatIcon, LayersIcon } from '@/features/landing/icons.js'
import styles from './bench.module.css'

export function ExtractionLearningGoal({legacy=false}:{legacy?:boolean}) {
  const details=useRef<HTMLDetailsElement>(null)
  useEffect(()=>{
    const dismiss=(event:PointerEvent)=>{if(details.current?.open&&event.target instanceof Node&&!details.current.contains(event.target))details.current.open=false}
    document.addEventListener('pointerdown',dismiss)
    return()=>document.removeEventListener('pointerdown',dismiss)
  },[])
  function close(){if(!details.current)return;details.current.open=false;details.current.querySelector('summary')?.focus()}
  return <div className={styles.goal}><details ref={details} className={styles.goalDetails} onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();close()}}}>
    <summary aria-label="Mục tiêu & phạm vi"><TargetIcon/><span className={styles.goalButtonCopy}><strong>Mục tiêu<span className={styles.mobileScopeLabel}> | Phạm vi</span></strong><span>Thu hồi ≥80% / cấu tử</span></span><span className={styles.goalDivider} aria-hidden="true">|</span><span className={styles.goalScopeCopy}><strong>Phạm vi</strong><span>3 cấu tử · Hai pha · 25 °C</span></span></summary>
    <section className={styles.goalPanel} aria-label="Mục tiêu và phạm vi chiết tách"><div className={styles.goalPanelHeading}><h2>Mục tiêu & phạm vi</h2><button type="button" aria-label="Đóng mục tiêu & phạm vi" onClick={close}><CloseIcon/></button></div>
      <div className={styles.goalIntro}><p className={styles.goalTitle}><strong>Thu hồi ít nhất 80% từng cấu tử</strong></p><p className={styles.goalSubtitle}>Tách riêng A, B và N; độ tinh khiết mô hình ≥90%.</p></div>
      <div className={styles.goalPanelGrid}>
        <section><h3>Kết quả cần nộp</h3><ul><li>Ba bình sản phẩm chứa A, B và N.</li><li>Phép cân sau làm khô của từng bình.</li><li>Thu hồi biểu kiến tự tính, sai số không quá 1 điểm %.</li>{!legacy&&<li>Trộn hai pha trước khi thu pha ở mỗi lần chiết.</li>}</ul></section>
        <section><h3>Bạn được chọn</h3><ul><li>Chiết axit trước hoặc bazơ trước.</li><li>Thể tích dung dịch và số lần chiết.</li><li>Pha thu, bình nhận và cách thu hồi rắn.</li></ul></section>
        <section><h3>Điều kiện cố định</h3><dl><div><dt>Mẫu chuẩn</dt><dd>100 mg A / B / N</dd></div><div><dt>Dung môi đầu</dt><dd>40 mL</dd></div><div><dt>Axit / bazơ chuẩn</dt><dd>0,1 M</dd></div><div><dt>Dung tích bình</dt><dd>250 mL</dd></div></dl></section>
        <section><h3>Giới hạn mô phỏng</h3><p>Cân bằng lý tưởng ở 25 °C; hệ số A/B/N là quy ước học tập, chưa hiệu chuẩn cho hóa chất thật.</p><p>Không tính động học, nhũ tương hoặc áp suất. Hình ảnh và chuyển động chỉ minh họa.</p></section>
      </div>
    </section>
  </details></div>
}

export function ExtractionControlGroup({id,title,summary,open,onToggle,children}: {id:string;title:string;summary:string;open:boolean;onToggle:()=>void;children:ReactNode}) {
  return <details className={styles.controlGroup} open={open} data-extraction-control={id} data-testid={'extraction-control-'+id}>
    <summary onClick={event=>{event.preventDefault();onToggle()}}><span className={styles.controlIcon}>{id==='program'?<RepeatIcon/>:id==='transfer'?<LayersIcon/>:<ControlIcon kind={id==='results'?'measure':'dose'}/>}</span><span className={styles.controlText}><strong>{title}</strong><small>{summary}</small></span></summary>
    <div className={styles.groupBody}>{children}</div>
  </details>
}
