import { useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import styles from './tour.module.css'

export const WORKBENCH_TOUR = [
  { area: 'header', title: 'Mục tiêu & lượt thực hành', description: 'Xem mục tiêu học tập và trạng thái lưu ở đầu trang. Nút Nộp bài kết thúc lượt và khóa các thao tác; bạn vẫn có thể xem lại số liệu.' },
  { area: 'shelf', title: 'Mẫu & dụng cụ', description: 'Kệ bên trái giới thiệu mẫu, hóa chất và thiết bị của bài. Bạn thao tác với chúng qua bảng Thao tác, không cần kéo thả. Có thể mở lại hướng dẫn này bất cứ lúc nào.' },
  { area: 'simulation', title: 'Khu vực thực hành', description: 'Chọn một cốc trên dàn để làm việc với cốc đó. Các nhịp phía trên mở nhóm thao tác tương ứng. Chuyển động giúp quan sát quy trình; độ đục phải được đo bằng thiết bị.' },
  { area: 'controls', title: 'Thao tác với cốc đang chọn', description: 'Chọn cốc ở đầu bảng để chuyển nhanh giữa các mẫu. Mở từng nhóm để chuẩn bị mẫu, cấp hóa chất, chạy chương trình hoặc đo. Chương trình khuấy và lắng áp dụng cho cả dàn, không phải một cốc riêng.' },
  { area: 'notebook', title: 'Sổ đo & lịch sử', description: 'Đo mẫu ban đầu tại đây. Sổ đo giữ số liệu từng cốc và đáp số bạn tự tính; tab Lịch sử thao tác giúp xem lại những gì đã làm. Chưa đo khác với N/A: N/A là phép đo không hợp lệ, không phải bằng 0.' },
] as const

type Box = { x: number; y: number; width: number; height: number }

/** An optional orientation tour. It never invokes an experiment command. */
export function WorkbenchTour({ root, step, onStepChange, onClose }: {
  root: RefObject<HTMLElement | null>
  step: number
  onStepChange: (step: number) => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<Box | null>(null)
  const [position, setPosition] = useState({ left: 16, top: 16 })
  const uid = useId()
  const current = WORKBENCH_TOUR[step]!

  useLayoutEffect(() => {
    const element = dialog.current
    if (!element) return
    element.showModal()
    return () => { element.close() }
  }, [])

  useEffect(() => {
    const target = root.current?.querySelector<HTMLElement>('[data-workbench-area="' + current.area + '"]')
    if (!target) return
    let frame = 0
    const update = () => {
      const rect = target.getBoundingClientRect()
      const viewport = window.visualViewport
      const width = viewport?.width ?? window.innerWidth
      const height = viewport?.height ?? window.innerHeight
      const offsetX = viewport?.offsetLeft ?? 0
      const offsetY = viewport?.offsetTop ?? 0
      const x = Math.max(offsetX + 6, rect.left - 5)
      const y = Math.max(offsetY + 6, rect.top - 5)
      const right = Math.min(offsetX + width - 6, rect.right + 5)
      const bottom = Math.min(offsetY + height - 6, rect.bottom + 5)
      setBox({ x, y, width: Math.max(0, right - x), height: Math.max(0, bottom - y) })
      const cardWidth = card.current?.offsetWidth ?? 360
      const cardHeight = card.current?.offsetHeight ?? 270
      const beside = width > 750 && right + cardWidth + 32 < offsetX + width
      const left = beside ? right + 16 : Math.min(Math.max(offsetX + 16, x), offsetX + width - cardWidth - 16)
      const top = width <= 750 ? offsetY + height - cardHeight - 16
        : beside ? Math.max(offsetY + 16, Math.min(y, offsetY + height - cardHeight - 16))
        : bottom + cardHeight + 32 < offsetY + height ? bottom + 16 : Math.max(offsetY + 16, y - cardHeight - 16)
      setPosition({ left, top })
    }
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update) }
    // The frame has already revealed the relevant mobile pane before this runs.
    target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' })
    schedule()
    const observer = new ResizeObserver(schedule)
    observer.observe(target)
    if (card.current) observer.observe(card.current)
    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', schedule, true)
    window.visualViewport?.addEventListener('resize', schedule)
    window.visualViewport?.addEventListener('scroll', schedule)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', schedule, true)
      window.visualViewport?.removeEventListener('resize', schedule)
      window.visualViewport?.removeEventListener('scroll', schedule)
    }
  }, [current.area, root])

  return <dialog ref={dialog} className={styles.tour} aria-label="Làm quen với workbench"
    aria-describedby={uid + '-description'} data-area={current.area}
    onCancel={(event) => { event.preventDefault(); onClose() }}>
    <svg className={styles.shade} aria-hidden="true">
      <defs><mask id={uid + '-mask'}><rect width="100%" height="100%" fill="white"/>
        {box && <rect {...box} rx="12" fill="black"/>}</mask></defs>
      <rect width="100%" height="100%" fill="#132d40" opacity=".57" mask={'url(#' + uid + '-mask)'} />
      {box && <rect {...box} rx="12" fill="none" stroke="#007b80" strokeWidth="2" data-testid="workbench-tour-highlight"/>}
    </svg>
    <div ref={card} className={styles.card} style={position}>
      <div className={styles.progress}><span>Khám phá workbench</span><span>{step + 1} / {WORKBENCH_TOUR.length}</span></div>
      <div key={current.area} className={styles.content} aria-live="polite" aria-atomic="true">
        <h2>{current.title}</h2><p id={uid + '-description'}>{current.description}</p>
      </div>
      <div className={styles.actions}>
        <button type="button" onClick={onClose}>Tôi đã rõ</button>
        <div><button type="button" disabled={step === 0} onClick={() => onStepChange(step - 1)}>Quay lại</button>
          {step < WORKBENCH_TOUR.length - 1 && <button type="button" className={styles.next} onClick={() => onStepChange(step + 1)}>Tiếp theo</button>}</div>
      </div>
    </div>
  </dialog>
}
