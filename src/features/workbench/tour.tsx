import { useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import styles from './tour.module.css'

export type WorkbenchTourStep = { area: 'header' | 'shelf' | 'simulation' | 'controls' | 'notebook'; title: string; description: string; selector?: string }

export const WORKBENCH_TOUR = [
  { area: 'header', title: 'Mục tiêu & lượt thực hành', description: 'Xem mục tiêu học tập và trạng thái lưu ở đầu trang. Nút Nộp bài kết thúc lượt và khóa các thao tác; bạn vẫn có thể xem lại số liệu.' },
  { area: 'shelf', title: 'Mẫu & dụng cụ', description: 'Kệ bên trái giới thiệu mẫu, hóa chất và thiết bị của bài. Bạn thao tác với chúng qua bảng Thao tác, không cần kéo thả. Có thể mở lại hướng dẫn này bất cứ lúc nào.' },
  { area: 'simulation', title: 'Khu vực thực hành', description: 'Chọn một cốc trên dàn để làm việc với cốc đó. Các nhịp phía trên mở nhóm thao tác tương ứng. Chuyển động giúp quan sát quy trình; độ đục phải được đo bằng thiết bị.' },
  { area: 'controls', title: 'Thao tác với cốc đang chọn', description: 'Chọn cốc ở đầu bảng để chuyển nhanh giữa các mẫu. Mở từng nhóm để chuẩn bị mẫu, cấp hóa chất, chạy chương trình hoặc đo. Chương trình khuấy và lắng áp dụng cho cả dàn, không phải một cốc riêng.' },
  { area: 'notebook', title: 'Sổ đo & lịch sử', description: 'Đo mẫu ban đầu tại đây. Sổ đo giữ số liệu từng cốc và đáp số bạn tự tính; tab Lịch sử thao tác giúp xem lại những gì đã làm. Chưa đo khác với N/A: N/A là phép đo không hợp lệ, không phải bằng 0.' },
] as const

type Box = { x: number; y: number; width: number; height: number }

/** An optional orientation tour. It never invokes an experiment command. */
export function WorkbenchTour({ root, step, onStepChange, onClose, steps = WORKBENCH_TOUR, interactive = false }: {
  steps?: readonly WorkbenchTourStep[]
  /** Opt-in for apparatus guides; orientation tours remain modal and read-only. */
  interactive?: boolean
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
  const current = steps[step]!

  useLayoutEffect(() => {
    const element = dialog.current
    if (!element) return
    if (interactive) element.show()
    else element.showModal()
    return () => { element.close() }
  }, [interactive])

  useEffect(() => {
    if (!interactive) return
    const handleEscape = (event: KeyboardEvent) => {
      // A nested submission/report dialog owns its own Escape handling.
      if (event.key !== 'Escape' || document.querySelector('dialog:modal')) return
      event.preventDefault()
      onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [interactive, onClose])

  // Handle interactive steps: auto-advance when user clicks the selector button
  useEffect(() => {
    if (!interactive || !current.selector) return

    const target = root.current?.querySelector<HTMLElement>(current.selector)
    if (!target) return

    const handleClick = () => {
      // Auto advance to next step when user clicks the highlighted button
      if (step < steps.length - 1) {
        onStepChange(step + 1)
      }
    }

    target.addEventListener('click', handleClick)
    return () => target.removeEventListener('click', handleClick)
  }, [interactive, current.selector, step, steps.length, onStepChange, root])

  useEffect(() => {
    const areaSelector = '[data-workbench-area="' + current.area + '"]'
    const targetSelector = current.selector ?? areaSelector
    const target = root.current?.querySelector<HTMLElement>(targetSelector)
      ?? root.current?.querySelector<HTMLElement>(areaSelector)
    if (!target) return
    let frame = 0
    const update = () => {
      // Async apparatus actions can mount the next target after the step changes.
      const activeTarget = root.current?.querySelector<HTMLElement>(targetSelector) ?? target
      const rect = activeTarget.getBoundingClientRect()
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
      const mobileTop = offsetY + height - cardHeight - 16
      const top = width <= 750 ? interactive && current.selector && y > offsetY + cardHeight + 32
        ? Math.min(mobileTop, y - cardHeight - 16) : mobileTop
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
    const mutations = new MutationObserver(schedule)
    if (interactive && root.current) mutations.observe(root.current, { childList: true, subtree: true })
    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', schedule, true)
    window.visualViewport?.addEventListener('resize', schedule)
    window.visualViewport?.addEventListener('scroll', schedule)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      mutations.disconnect()
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', schedule, true)
      window.visualViewport?.removeEventListener('resize', schedule)
      window.visualViewport?.removeEventListener('scroll', schedule)
    }
  }, [current.area, current.selector, interactive, root])

  return <dialog ref={dialog} className={styles.tour} aria-label="Làm quen với workbench"
    aria-describedby={uid + '-description'} data-area={current.area} data-interactive={interactive}
    onCancel={(event) => { event.preventDefault(); onClose() }}>
    <svg className={styles.shade} aria-hidden="true">
      <defs>
        <mask id={uid + '-mask'}><rect width="100%" height="100%" fill="white"/>
          {box && <rect {...box} rx="12" fill="black"/>}</mask>
        <filter id={uid + '-glow'}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="#132d40" opacity={interactive ? .65 : .57} mask={'url(#' + uid + '-mask)'} />
      {box && <rect {...box} rx="12" fill="none" stroke={interactive ? '#00d4dd' : '#007b80'} strokeWidth={interactive ? 4 : 2} filter={interactive ? 'url(#' + uid + '-glow)' : undefined} data-testid="workbench-tour-highlight" opacity={interactive ? .9 : 1}/>}
    </svg>
    <div ref={card} className={styles.card} style={position}>
      <div className={styles.progress}><span>Khám phá workbench</span><span>{step + 1} / {steps.length}</span></div>
      <div key={current.area} className={styles.content} aria-live="polite" aria-atomic="true">
        <h2>{current.title}</h2><p id={uid + '-description'}>{current.description}</p>
      </div>
      <div className={styles.actions}>
        <button type="button" onClick={onClose}>Tôi đã rõ</button>
        <div><button type="button" disabled={step === 0} onClick={() => onStepChange(step - 1)}>Quay lại</button>
          {step < steps.length - 1 && <button type="button" className={styles.next} onClick={() => onStepChange(step + 1)}>Tiếp theo</button>}</div>
      </div>
    </div>
  </dialog>
}
