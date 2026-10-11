'use client'

import Link from 'next/link'
import { useReducer } from 'react'
import {
  applyPlasticAction,
  INITIAL_PLASTIC_STATE,
  nextActionLabel,
  PLASTIC_TYPES,
  positionForPolymer,
  selectedBranchLabel,
  type PlasticSeparationAction,
  type PlasticSeparationState,
  type SeparationBranch,
} from '@/domain/experiments/plastic-separation/model.js'
import styles from './plastic-separation-workbench.module.css'

function reducer(
  state: PlasticSeparationState,
  action: PlasticSeparationAction,
): PlasticSeparationState {
  return applyPlasticAction(state, action)
}

export function PlasticSeparationWorkbench() {
  const [state, dispatch] = useReducer(reducer, INITIAL_PLASTIC_STATE)
  const outcome = state.lastOutcome
  const isPolyolefin = state.activeBranch === 'polyolefins'
  const selectedBranchDone = isPolyolefin
    ? state.ethanolProgress === 2
    : state.activeBranch === 'high-density' && state.saltProgress === 3
  const lightDone = state.ethanolProgress === 2
  const denseDone = state.saltProgress === 3

  const runNext = () => {
    if (!state.waterSeparated) {
      dispatch({ type: 'separate-water' })
    } else if (isPolyolefin) {
      dispatch({ type: state.ethanolProgress === 0 ? 'separate-ethanol-23' : 'separate-ethanol-31' })
    } else if (state.activeBranch === 'high-density') {
      dispatch({
        type:
          state.saltProgress === 0
            ? 'separate-nacl-11-12'
            : state.saltProgress === 1
              ? 'separate-nacl-20'
              : 'separate-nacl-40',
      })
    }
  }

  const selectBranch = (branch: SeparationBranch) =>
    dispatch({ type: 'select-branch', branch })

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Đường dẫn">
        <Link href="/experiments">← Danh mục thí nghiệm</Link>
      </nav>

      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>MÔ PHỎNG THEO NGHIÊN CỨU KHOA HỌC</p>
          <h1>Phân loại nhựa nguyên sinh</h1>
          <p className={styles.lede}>
            Tách sáu loại polymer bằng phương pháp nổi–chìm. Chọn phần mẫu và tăng dần mật độ dung dịch để xem hạt nào nổi, hạt nào chìm.
          </p>
        </div>
        <span className={styles.releaseBadge}>6 polymer · sink–float</span>
      </header>

      <div className={styles.workbench}>
        <section className={styles.visualCard} aria-labelledby="vessel-heading">
          <div className={styles.cardHeading}>
            <div>
              <p className={styles.eyebrow}>BÌNH PHÂN TÁCH</p>
              <h2 id="vessel-heading">
                {outcome?.medium ?? (state.activeBranch ? `Mẫu ${selectedBranchLabel(state.activeBranch)}` : 'Mẫu nhựa nguyên sinh')}
              </h2>
            </div>
            <span className={styles.stageBadge}>
              {!state.waterSeparated ? 'Bước 1 / 3' : state.activeBranch === 'polyolefins' ? 'Nhánh PP + HDPE' : state.activeBranch === 'high-density' ? 'Nhánh polymer nặng' : 'Chọn phần mẫu'}
            </span>
          </div>

          <div className={styles.vesselWrap}>
            <svg
              className={styles.vessel}
              viewBox="0 0 440 330"
              role="img"
              aria-label={`Bình phân tách. ${outcome ? `Nổi: ${outcome.floating.join(', ')}. Chìm: ${outcome.sinking.join(', ')}.` : state.activeBranch ? `Các hạt thuộc phần ${selectedBranchLabel(state.activeBranch)} đang ở trong dung dịch.` : 'Sáu loại hạt nhựa đang ở trong dung dịch.'}`}
            >
              <defs>
                <linearGradient id="plastic-liquid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.48" />
                </linearGradient>
                <linearGradient id="plastic-glass" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.88" />
                  <stop offset="15%" stopColor="#e0f2fe" stopOpacity="0.16" />
                  <stop offset="85%" stopColor="#e0f2fe" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.82" />
                </linearGradient>
              </defs>

              <path d="M70 54 L82 268 Q84 285 104 285 L300 285 Q320 285 322 268 L334 54 Z" fill="url(#plastic-glass)" stroke="#8ba2bb" strokeWidth="3" />
              <path d="M74 91 Q202 105 330 91 L320 268 Q318 281 300 281 L104 281 Q86 281 84 268 Z" fill="url(#plastic-liquid)" />
              <ellipse cx="202" cy="91" rx="128" ry="13" fill="#bfdbfe" opacity="0.78" />
              <ellipse cx="202" cy="54" rx="132" ry="17" fill="#f8fafc" stroke="#8ba2bb" strokeWidth="3" />
              <path d="M82 268 Q84 285 104 285 L300 285 Q320 285 322 268" fill="none" stroke="#8ba2bb" strokeWidth="3" />

              {PLASTIC_TYPES.map((polymer, index) => {
                const y = positionForPolymer(polymer.id, state)
                const x = 116 + (index % 3) * 64
                const rotation = [-8, 6, -4, 7, -6, 4][index] ?? 0
                return (
                  <g key={polymer.id} transform={`translate(0 ${y})`}>
                    <rect
                      x={x}
                      y={-8}
                      width="44"
                      height="18"
                      rx="6"
                      fill={polymer.color}
                      stroke={polymer.stroke}
                      strokeWidth="2"
                      transform={`rotate(${rotation} ${x + 22} 1)`}
                    />
                    <text x={x + 22} y="5" textAnchor="middle" fontSize="9" fontWeight="700" fill="#172033">
                      {polymer.id}
                    </text>
                  </g>
                )
              })}
              <path d="M89 110 L96 255" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
              <path d="M310 116 L304 253" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
            </svg>
          </div>

          <div className={styles.legend} aria-label="Chú giải polymer">
            {PLASTIC_TYPES.map((polymer) => (
              <span className={styles.legendItem} key={polymer.id}>
                <i style={{ backgroundColor: polymer.color, borderColor: polymer.stroke }} aria-hidden="true" />
                <span><strong>{polymer.id}</strong> · ρ {polymer.density.toFixed(3).replace('.', ',')} g/cm³</span>
              </span>
            ))}
          </div>
        </section>

        <section className={styles.controlCard} aria-labelledby="process-heading">
          <div className={styles.cardHeading}>
            <div>
              <p className={styles.eyebrow}>QUY TRÌNH</p>
              <h2 id="process-heading">{state.activeBranch ? `Đang xử lý ${selectedBranchLabel(state.activeBranch)}` : 'Bắt đầu phân tách'}</h2>
            </div>
          </div>

          <ol className={styles.steps} aria-label="Các giai đoạn">
            <li data-done={state.waterSeparated}>Nước · tách sơ bộ</li>
            <li data-done={lightDone}>Ethanol · PP / HDPE</li>
            <li data-done={denseDone}>NaCl · PS / ABS / PA / PC</li>
          </ol>

          {!state.waterSeparated ? (
            <div className={styles.actionBlock}>
              <p>Cho hỗn hợp sáu loại nhựa vào nước. PP và HDPE nổi; PS, ABS, PA và PC chìm.</p>
              <button className={styles.primaryButton} type="button" onClick={runNext}>
                Tách bằng nước <span aria-hidden="true">→</span>
              </button>
            </div>
          ) : state.activeBranch === null ? (
            <div className={styles.actionBlock}>
              <p>Chọn phần mẫu muốn tiếp tục xử lý:</p>
              <button className={styles.branchButton} type="button" onClick={() => selectBranch('polyolefins')}>
                <span><strong>Phần nổi · PP + HDPE</strong><small>{lightDone ? 'Đã tách xong bằng ethanol' : 'Tiếp tục với ethanol'}</small></span>
                <span aria-hidden="true">→</span>
              </button>
              <button className={styles.branchButton} type="button" onClick={() => selectBranch('high-density')}>
                <span><strong>Phần chìm · PS + ABS + PA + PC</strong><small>{denseDone ? 'Đã tách xong bằng NaCl' : 'Tiếp tục với NaCl'}</small></span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          ) : (
            <div className={styles.actionBlock}>
              <div className={styles.currentStep}>
                <span className={styles.stepNumber}>{isPolyolefin ? state.ethanolProgress + 1 : state.saltProgress + 1}</span>
                <div>
                  <strong>{selectedBranchDone ? 'Nhánh này đã hoàn tất' : nextActionLabel(state)}</strong>
                  <small>{selectedBranchDone ? 'Bạn có thể chuyển sang phần mẫu còn lại.' : 'Kết quả nổi–chìm sẽ được cập nhật trong bình.'}</small>
                </div>
              </div>
              {!selectedBranchDone && (
                <button className={styles.primaryButton} type="button" onClick={runNext}>
                  {nextActionLabel(state)} <span aria-hidden="true">→</span>
                </button>
              )}
              <button className={styles.textButton} type="button" onClick={() => dispatch({ type: 'select-branch', branch: state.activeBranch === 'polyolefins' ? 'high-density' : 'polyolefins' })}>
                Chuyển sang {state.activeBranch === 'polyolefins' ? 'phần chìm · PS + ABS + PA + PC' : 'phần nổi · PP + HDPE'}
              </button>
            </div>
          )}

          {outcome && (
            <div className={styles.result} aria-live="polite" key={outcome.kind}>
              <div className={styles.resultTitle}>
                <span className={styles.resultIcon} aria-hidden="true">✓</span>
                <div><strong>{outcome.title}</strong><small>{outcome.medium}</small></div>
              </div>
              <p>{outcome.note}</p>
              <div className={styles.resultColumns}>
                <div><span className={styles.floatLabel}>NỔI</span><strong>{outcome.floating.join(', ') || 'Không có'}</strong></div>
                <div><span className={styles.sinkLabel}>CHÌM</span><strong>{outcome.sinking.join(', ') || 'Không có'}</strong></div>
              </div>
              <ul className={styles.recoveryList}>
                {outcome.recovery.map((line) => <li key={line}>{line}</li>)}
              </ul>
            </div>
          )}

          {state.outcomes.length > 0 && (
            <details className={styles.history}>
              <summary>Lịch sử tách ({state.outcomes.length} bước)</summary>
              <ol>
                {state.outcomes.map((item, index) => (
                  <li key={`${item.kind}-${index}`}>
                    <strong>{item.medium}:</strong> nổi {item.floating.join(', ') || 'không có'}; chìm {item.sinking.join(', ') || 'không có'}.
                    <span>{item.recovery.join(' · ')}</span>
                  </li>
                ))}
              </ol>
            </details>
          )}

          {state.waterSeparated && (
            <button className={styles.resetButton} type="button" onClick={() => dispatch({ type: 'reset' })}>
              Bắt đầu lượt mới
            </button>
          )}
        </section>
      </div>

      <section className={styles.sourceNote}>
        <strong>Phạm vi mô hình</strong>
        <p>
          Kết quả phân loại và tỷ lệ thu hồi được lấy từ bài báo về phương pháp nổi–chìm đối với nhựa nguyên sinh. Mô phỏng biểu diễn kết quả theo từng nồng độ đã công bố; không nội suy cho nồng độ khác và không thay thế thí nghiệm thực tế. Màu hạt chỉ dùng để phân biệt polymer trên giao diện.
        </p>
        <a href="https://doi.org/10.1007/s11356-021-15611-w" target="_blank" rel="noreferrer">
          Meneses Quelal et al., “Separation of virgin plastic polymers and post-consumer mixed plastic waste by sinking-flotation technique” (2022)
        </a>
      </section>
    </div>
  )
}
