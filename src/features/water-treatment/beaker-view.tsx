'use client'

import { type ReactNode } from 'react'
import styles from './beaker-view.module.css'

/**
 * Kích thước giọt NaOH/HCl (mL) cho Block 2 — gồm mức fine-dose 0,01 mL
 * để điều chỉnh pH gần điểm đích chính xác hơn.
 */
export const BEAKER_DROP_SIZES = [0.01, 0.05, 0.1, 0.5] as const

export type BeakerChemistry = {
  readonly pH: number
  readonly dissolved_mgL: { readonly Fe: number; readonly Zn: number; readonly Pb: number }
  readonly precipitated_mgL: { readonly Fe: number; readonly Zn: number; readonly Pb: number }
}

type Props = {
  /** Trạng thái từ server (lần add-base/add-acid gần nhất). `null` khi chưa nhỏ giọt nào. */
  readonly chemistry: BeakerChemistry | null
  /** pH đo được từ `measure-initial-ph` — dùng khi `chemistry === null`. */
  readonly initialPH?: number | null
  /** Tổng NaOH đã nhỏ (mL) — đồng bộ với parent. */
  readonly cumulativeNaOH_mL: number
  /** Tổng HCl đã nhỏ (mL) — đồng bộ với parent. */
  readonly cumulativeHCl_mL?: number
  /** Server đang xử lý action. */
  readonly pending: boolean
  /** Drop size NaOH hiện được chọn (mL). */
  readonly dropSize: number
  /** Drop size HCl hiện được chọn (mL). */
  readonly hclDropSize: number
  /** Đổi drop size NaOH. */
  readonly onDropSizeChange: (size: number) => void
  /** Đổi drop size HCl. */
  readonly onHclDropSizeChange: (size: number) => void
  /** Nhỏ 1 giọt NaOH ở dropSize hiện tại. */
  readonly onDrop: () => void
  /** Nhỏ 1 giọt HCl ở hclDropSize hiện tại. */
  readonly onHclDrop: () => void
  /**
   * Chế độ khóa (frozen) — dùng cho stage ĐÃ CHỐT. Khi `true`:
   *   - Cả 2 nút "Nhỏ giọt" bị disabled (dù `pending` = false)
   *   - Drop size selector radios bị disabled
   *   - Visual có overlay nhẹ + biểu tượng 🔒 ở header
   *   - `onDrop` / `onHclDrop` / `onDropSizeChange` / `onHclDropSizeChange`
   *     vẫn được gọi (parent xử lý no-op)
   * Mặc định `false` (chế độ tương tác).
   */
  readonly frozen?: boolean
  /** Ẩn các ô readout pH/Fe/Zn/Pb khi chỉ dùng cốc cho Bước 3. */
  readonly showReadouts?: boolean
  /**
   * Badge tùy chỉnh hiển thị ở header (vd "Stage 1", "🔒 Stage 1"). Khi
   * không truyền thì header chỉ hiển thị icon + tiêu đề mặc định.
   */
  readonly stageBadge?: ReactNode
}

/**
 * Visualization layer cho Bước 2 — chuẩn độ từng giọt. Server vẫn là source
 * of truth (gọi `attempt.run('add-base', { dose_mL })` cho mỗi giọt); BeakerView
 * chỉ mirror kết quả từ `attempt.state.history[last]` để user thấy pH tăng
 * dần và sludge hiện ra ở đáy cốc khi vượt Ksp.
 *
 * ⚠️ Nhắc lại: server-side solver hiện là 1-shot equilibrium tại pH cuối
 * (xem `chemistry-solver.ts::solveAfterReagent`). Nếu user nhỏ quá nhanh
 * vượt pH > 10,5 thì Zn sludge sẽ "biến mất" vì amphoteric redissolution —
 * đây là behavior 1-shot đã được ghi nhận là bug riêng (sẽ chuyển coder 1).
 * UI cảnh báo khi pH > 10,5 để user dừng ở pH 9–9,5 (an toàn cho cả 3 KL).
 */
export function BeakerView({
  chemistry,
  initialPH,
  cumulativeNaOH_mL,
  cumulativeHCl_mL = 0,
  pending,
  dropSize,
  hclDropSize,
  onDropSizeChange,
  onHclDropSizeChange,
  onDrop,
  onHclDrop,
  frozen = false,
  showReadouts = true,
  stageBadge,
}: Props): ReactNode {
  const phShown = chemistry?.pH ?? initialPH ?? 7
  const dissolved = chemistry?.dissolved_mgL ?? { Fe: 0, Zn: 0, Pb: 0 }
  const precipitated = chemistry?.precipitated_mgL ?? { Fe: 0, Zn: 0, Pb: 0 }
  const phColor = pHToHex(phShown)
  const phLabel = pHToLabel(phShown)
  const amphotericRisk = phShown > 10.5

  // Sludge composition drawn at the bottom (Zn trắng ở trên, Pb trắng kem
  // giữa, Fe nâu đỏ dưới đáy theo trọng lượng riêng thực tế). Cap tổng ở
  // 76 px để không tràn ra ngoài thành cốc.
  const TOTAL_SLUDGE_CAP = 76
  // Scale dùng tỉ lệ mg/L trên max ngõ vào (Fe 3, Zn 3, Pb 0.025). Trọng số
  // phụ thuộc khối lượng riêng hydroxide: Fe(OH)3 rậm nhất, Pb(OH)2 mịn nhất.
  const feUnits = Math.min(precipitated.Fe, 3) * 14
  const znUnits = Math.min(precipitated.Zn, 3) * 12
  const pbUnits = Math.min(precipitated.Pb, 0.05) * 800
  const totalUnits = feUnits + znUnits + pbUnits
  const fePx = totalUnits > 0 ? Math.min(TOTAL_SLUDGE_CAP, feUnits) : 0
  const znPx = totalUnits > 0 ? Math.min(TOTAL_SLUDGE_CAP - fePx, znUnits) : 0
  const pbPx = totalUnits > 0 ? Math.min(TOTAL_SLUDGE_CAP - fePx - znPx, pbUnits) : 0

  return (
    <div className={styles.container} data-frozen={frozen ? 'true' : 'false'}>
      <header className={styles.header}>
        <h4>
          <span className={styles.headerIcon} aria-hidden="true">
            {frozen ? '🔒' : '🧪'}
          </span>
          Cốc thí nghiệm ảo · ống nhỏ NaOH / HCl
          {stageBadge ? (
            <span className={styles.headerStage}>{stageBadge}</span>
          ) : null}
        </h4>
        <p>
          {frozen
            ? 'Stage này đã được chốt. BeakerView chỉ hiển thị trạng thái hóa học tại thời điểm lọc — không thể thêm NaOH/HCl hay thay đổi drop size.'
            : 'Nhỏ NaOH để tăng pH, hoặc HCl để giảm pH (ví dụ correct overshoot kiềm làm Zn/Pb tan ngược do amphoteric). Dừng ở pH 9–9,5 để Fe, Zn và Pb đều kết tủa tối đa trước khi sang bước khuấy/lắng/lọc.'}
        </p>
      </header>

      <div className={styles.layout}>
        <div className={styles.controls}>
          {/* NaOH drop controls */}
          <div className={styles.reagentColumn} data-reagent="naoh">
            <span className={styles.reagentTag} data-tone="base">NaOH · base</span>
            <fieldset className={styles.dropSizeGroup} disabled={frozen}>
              <legend>Kích thước giọt (mL)</legend>
              <div className={styles.chips} role="radiogroup" aria-label="Kích thước giọt NaOH">
                {BEAKER_DROP_SIZES.map((size) => {
                  const checked = dropSize === size
                  return (
                    <label
                      key={size}
                      className={styles.chip}
                      data-active={checked}
                      data-frozen={frozen ? 'true' : 'false'}
                    >
                      <input
                        type="radio"
                        name="beaker-drop-size-naoh"
                        value={size}
                        checked={checked}
                        onChange={() => onDropSizeChange(size)}
                        className={styles.chipInput}
                        disabled={frozen}
                      />
                      <span>{size.toString().replace('.', ',')}</span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <button
              type="button"
              className={styles.dropButton}
              onClick={onDrop}
              disabled={pending || frozen}
              data-state={frozen ? 'frozen' : pending ? 'pending' : 'ready'}
              data-reagent="naoh"
              aria-label={
                frozen
                  ? `Stage đã chốt — không thể nhỏ thêm NaOH`
                  : `Nhỏ một giọt NaOH ${dropSize} mL vào cốc`
              }
              aria-disabled={pending || frozen}
            >
              <span className={styles.dropButtonIcon} aria-hidden="true">
                {frozen ? '🔒' : '💧'}
              </span>
              {frozen ? 'Đã chốt' : 'Nhỏ giọt NaOH'}
            </button>

            <p className={styles.summary}>
              Đã nhỏ:{' '}
              <strong className={styles.summaryValue}>
                {cumulativeNaOH_mL.toFixed(2).replace('.', ',')} mL
              </strong>
              {' · '}
              khoảng{' '}
              <strong>
                {Math.round(cumulativeNaOH_mL / Math.max(dropSize, 0.001))}
              </strong>{' '}
              giọt
            </p>
          </div>

          {/* HCl drop controls — correct overshoot hoặc khám phá pH cycling.
              Dùng cùng size mặc định 0,05 mL nhưng có selector riêng để
              power-user chỉnh. */}
          <div className={styles.reagentColumn} data-reagent="hcl">
            <span className={styles.reagentTag} data-tone="acid">HCl · acid</span>
            <fieldset className={styles.dropSizeGroup} disabled={frozen}>
              <legend>Kích thước giọt (mL)</legend>
              <div className={styles.chips} role="radiogroup" aria-label="Kích thước giọt HCl">
                {BEAKER_DROP_SIZES.map((size) => {
                  const checked = hclDropSize === size
                  return (
                    <label
                      key={size}
                      className={styles.chip}
                      data-active={checked}
                      data-frozen={frozen ? 'true' : 'false'}
                    >
                      <input
                        type="radio"
                        name="beaker-drop-size-hcl"
                        value={size}
                        checked={checked}
                        onChange={() => onHclDropSizeChange(size)}
                        className={styles.chipInput}
                        disabled={frozen}
                      />
                      <span>{size.toString().replace('.', ',')}</span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <button
              type="button"
              className={styles.dropButton}
              onClick={onHclDrop}
              disabled={pending || frozen}
              data-state={frozen ? 'frozen' : pending ? 'pending' : 'ready'}
              data-reagent="hcl"
              aria-label={
                frozen
                  ? `Stage đã chốt — không thể nhỏ thêm HCl`
                  : `Nhỏ một giọt HCl ${hclDropSize} mL vào cốc`
              }
              aria-disabled={pending || frozen}
            >
              <span className={styles.dropButtonIcon} aria-hidden="true">
                {frozen ? '🔒' : '💧'}
              </span>
              {frozen ? 'Đã chốt' : 'Nhỏ giọt HCl'}
            </button>

            <p className={styles.summary}>
              Đã nhỏ:{' '}
              <strong className={styles.summaryValue}>
                {cumulativeHCl_mL.toFixed(2).replace('.', ',')} mL
              </strong>
              {' · '}
              khoảng{' '}
              <strong>
                {Math.round(cumulativeHCl_mL / Math.max(hclDropSize, 0.001))}
              </strong>{' '}
              giọt
            </p>
          </div>
        </div>

        <div className={styles.scene} aria-hidden="true">
          <svg viewBox="0 0 220 320" className={styles.svg}>
            {/* Stand base */}
            <ellipse cx="110" cy="306" rx="86" ry="4" fill="rgba(15, 23, 42, 0.18)" />
            <rect x="20" y="298" width="180" height="5" fill="#475569" rx="2" />

            {/* Stand pole + clamp */}
            <rect x="106" y="180" width="8" height="120" fill="#475569" />
            <rect x="80" y="178" width="60" height="6" fill="#334155" rx="2" />

            {/* Burette tube (glass) */}
            <rect
              x="92"
              y="22"
              width="36"
              height="80"
              fill="rgba(255, 255, 255, 0.55)"
              stroke="#475569"
              strokeWidth="1.5"
              rx="8"
            />
            {/* NaOH fill in burette */}
            {cumulativeNaOH_mL > 0 ? (
              <rect
                x="93.5"
                y={27 + 70 * (1 - Math.min(1, cumulativeNaOH_mL / 5))}
                width="33"
                height={70 * Math.min(1, cumulativeNaOH_mL / 5)}
                fill="#fbbf24"
                opacity="0.5"
                rx="6"
              />
            ) : null}
            {/* Burette graduation lines */}
            <line x1="92" y1="40" x2="98" y2="40" stroke="#94a3b8" strokeWidth="1" />
            <line x1="92" y1="58" x2="98" y2="58" stroke="#94a3b8" strokeWidth="1" />
            <line x1="92" y1="76" x2="98" y2="76" stroke="#94a3b8" strokeWidth="1" />
            <line x1="92" y1="94" x2="100" y2="94" stroke="#94a3b8" strokeWidth="1" />

            {/* Stopcock + tip */}
            <rect x="103" y="102" width="14" height="8" fill="#1e293b" rx="2" />
            <polygon points="106,110 114,110 110,124" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />

            {/* Falling NaOH drop (animated while pending) */}
            {pending ? (
              <>
                <circle cx="110" cy="138" r="3" fill="#fbbf24">
                  <animate
                    attributeName="cy"
                    from="124"
                    to="206"
                    dur="0.55s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="1;1;0"
                    dur="0.55s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="110" cy="180" r="3" fill="#fbbf24">
                  <animate
                    attributeName="cy"
                    from="124"
                    to="206"
                    begin="0.18s"
                    dur="0.55s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="1;1;0"
                    begin="0.18s"
                    dur="0.55s"
                    repeatCount="indefinite"
                  />
                </circle>
              </>
            ) : null}

            {/* Beaker body (glass) */}
            <path
              d="M 36 192 L 36 286 Q 36 296 46 296 L 174 296 Q 184 296 184 286 L 184 192"
              fill="rgba(255, 255, 255, 0.45)"
              stroke="#334155"
              strokeWidth="3"
            />
            {/* Beaker rim */}
            <line x1="32" y1="192" x2="188" y2="192" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
            {/* Volume scale */}
            <text x="186" y="222" fontSize="9" fill="#94a3b8">500</text>
            <text x="186" y="252" fontSize="9" fill="#94a3b8">700</text>
            <text x="186" y="282" fontSize="9" fill="#94a3b8">900</text>
            <line x1="180" y1="220" x2="184" y2="220" stroke="#94a3b8" />
            <line x1="180" y1="250" x2="184" y2="250" stroke="#94a3b8" />
            <line x1="180" y1="280" x2="184" y2="280" stroke="#94a3b8" />

            {/* Water tint (pH indicator strip on the liquid) */}
            <path
              d="M 38 205 L 38 282 L 182 282 L 182 205 Z"
              fill={phColor}
              opacity="0.32"
            />
            {/* Iron-induced turbidity overlay (only when Fe precipitates) */}
            {precipitated.Fe > 0.05 ? (
              <path
                d="M 38 205 L 38 282 L 182 282 L 182 205 Z"
                fill="rgba(180, 90, 30, 0.12)"
                opacity={Math.min(0.7, precipitated.Fe * 0.25)}
              />
            ) : null}

            {/* Sludge layers (Zn trắng trên cùng → Pb trắng kem → Fe nâu đỏ đáy) */}
            {fePx + znPx + pbPx > 0 ? (
              <g>
                {znPx > 0 ? (
                  <rect
                    x="38"
                    y={282 - fePx - pbPx - znPx}
                    width="144"
                    height={znPx}
                    fill="rgba(248, 248, 235, 0.9)"
                    stroke="rgba(15, 23, 42, 0.15)"
                    strokeWidth="0.5"
                  />
                ) : null}
                {pbPx > 0 ? (
                  <rect
                    x="38"
                    y={282 - fePx - pbPx}
                    width="144"
                    height={pbPx}
                    fill="rgba(238, 220, 180, 0.9)"
                    stroke="rgba(15, 23, 42, 0.15)"
                    strokeWidth="0.5"
                  />
                ) : null}
                {fePx > 0 ? (
                  <rect
                    x="38"
                    y={282 - fePx}
                    width="144"
                    height={fePx}
                    fill="rgba(168, 80, 24, 0.9)"
                    stroke="rgba(15, 23, 42, 0.15)"
                    strokeWidth="0.5"
                  />
                ) : null}
              </g>
            ) : null}

            {/* pH overlay text inside the beaker */}
            <text
              x="110"
              y="234"
              fontSize="13"
              fill="rgba(15, 23, 42, 0.78)"
              textAnchor="middle"
              fontWeight="700"
            >
              pH {phShown.toFixed(1)}
            </text>
          </svg>
        </div>

        <div className={styles.readouts} hidden={!showReadouts} aria-hidden={!showReadouts}>
          <div className={styles.phCard} data-band={phLabel}>
            <span className={styles.phLabel}>pH đo được</span>
            <strong className={styles.phValue}>{phShown.toFixed(2)}</strong>
            <span className={styles.phBand}>{phLabel}</span>
          </div>

          <div className={styles.metalList}>
            <MetalLine
              symbol="Fe"
              name="Sắt"
              formula="Fe(OH)₃ · nâu đỏ"
              dissolved={dissolved.Fe}
              precipitated={precipitated.Fe}
              color="#b45309"
            />
            <MetalLine
              symbol="Zn"
              name="Kẽm"
              formula="Zn(OH)₂ · trắng"
              dissolved={dissolved.Zn}
              precipitated={precipitated.Zn}
              color="#4f46e5"
            />
            <MetalLine
              symbol="Pb"
              name="Chì"
              formula="Pb(OH)₂ · trắng kem"
              dissolved={dissolved.Pb}
              precipitated={precipitated.Pb}
              color="#be123c"
            />
          </div>

          {amphotericRisk ? (
            <p className={styles.warning} role="status">
              ⚠️ <strong>pH &gt; 10,5</strong> — kẽm hydroxide có tính lưỡng tính
              (amphoteric), có thể tan ngược thành <code>Zn(OH)₃⁻</code> và{' '}
              <code>Zn(OH)₄²⁻</code>. Dừng ở <strong>pH 9–9,5</strong> để giữ Zn(OH)₂
              kết tủa.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function MetalLine({
  symbol,
  name,
  formula,
  dissolved,
  precipitated,
  color,
}: {
  readonly symbol: string
  readonly name: string
  readonly formula: string
  readonly dissolved: number
  readonly precipitated: number
  readonly color: string
}): ReactNode {
  return (
    <div className={styles.metalRow} data-symbol={symbol}>
      <span className={styles.metalSymbol} style={{ color }}>
        {symbol}
      </span>
      <div className={styles.metalInfo}>
        <span className={styles.metalName}>{name}</span>
        <span className={styles.metalFormula}>{formula}</span>
        <span className={styles.metalLine}>
          Trong nước:{' '}
          <strong className={styles.metalValue}>{dissolved.toFixed(3).replace('.', ',')}</strong>
          {' mg/L'}
        </span>
        <span className={styles.metalLine}>
          Đã kết tủa:{' '}
          <strong className={styles.metalValue}>{precipitated.toFixed(3).replace('.', ',')}</strong>
          {' mg/L'}
        </span>
      </div>
    </div>
  )
}

/** Litmus-style pH color band — chỉ để hiển thị, KHÔNG phải giá trị pH thật. */
function pHToHex(pH: number): string {
  if (pH < 3) return '#dc2626'
  if (pH < 5) return '#f97316'
  if (pH < 6.5) return '#facc15'
  if (pH < 7.5) return '#84cc16'
  if (pH < 9) return '#22c55e'
  if (pH < 10) return '#06b6d4'
  if (pH < 11) return '#3b82f6'
  if (pH < 12) return '#6366f1'
  return '#a855f7'
}

function pHToLabel(pH: number): string {
  if (pH < 3) return 'acid mạnh'
  if (pH < 5) return 'acid yếu'
  if (pH < 6.5) return 'acid nhẹ'
  if (pH < 7.5) return 'gần trung tính'
  if (pH < 9) return 'kiềm nhẹ (mục tiêu)'
  if (pH < 10) return 'kiềm vừa (Zn kết tủa tối đa)'
  if (pH < 11) return 'kiềm — cảnh báo amphoteric Zn'
  if (pH < 12) return 'kiềm mạnh — Zn đang tan ngược'
  return 'kiềm rất mạnh'
}
