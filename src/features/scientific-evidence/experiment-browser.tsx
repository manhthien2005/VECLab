'use client'

import { useState, type ReactNode } from 'react'
import { FlaskIcon, LayersIcon, MoleculeIcon, CheckCircleIcon } from '@/features/landing/icons.js'

type ExperimentChoice = {
  key: string
  title: string
  category: string
  sourceCount: number | null
}

type Props = {
  experiments: readonly ExperimentChoice[]
  children: readonly ReactNode[]
}

const EXPERIMENT_ICONS = [FlaskIcon, LayersIcon, MoleculeIcon] as const

/** Only the experiment selection is client-side; citations remain server-rendered. */
export function EvidenceExperimentBrowser({ experiments, children }: Props) {
  const [selected, setSelected] = useState(experiments[0]?.key)

  return (
    <>
      <div className="evidence-experiment-picker" role="group" aria-label="Chọn bài thí nghiệm để xem nguồn">
        {experiments.map((experiment, index) => {
          const Icon = EXPERIMENT_ICONS[index] ?? FlaskIcon
          const active = selected === experiment.key
          return (
            <button
              className={`evidence-experiment-choice evidence-experiment-choice-${index}`}
              key={experiment.key}
              id={`evidence-choice-${experiment.key}`}
              type="button"
              aria-pressed={active}
              aria-controls={`evidence-panel-${experiment.key}`}
              onClick={() => setSelected(experiment.key)}
            >
              <Icon className="evidence-experiment-icon" />
              <span className="evidence-experiment-choice-copy">
                <span className="evidence-experiment-category">{experiment.category}</span>
                <strong>{experiment.title}</strong>
                <span className="evidence-experiment-count">{experiment.sourceCount === null ? 'Chưa công bố danh mục nguồn' : `${experiment.sourceCount} nguồn tham khảo`}</span>
              </span>
              {active && <CheckCircleIcon className="evidence-experiment-selected" />}
            </button>
          )
        })}
      </div>
      {experiments.map((experiment, index) => (
        <section
          className="evidence-experiment-panel"
          key={experiment.key}
          id={`evidence-panel-${experiment.key}`}
          aria-labelledby={`evidence-choice-${experiment.key}`}
          hidden={selected !== experiment.key}
        >
          {children[index]}
        </section>
      ))}
    </>
  )
}
