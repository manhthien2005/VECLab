import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  APP_STRINGS,
  ACID_STRINGS,
  ACID_INPUT_DOMAIN,
  ACID_ROUTE_CHOICES,
  ACID_DISPLAY_FORMAT,
} from '@/content/index.js'
import {
  findCatalogEntry,
  listActions,
  manifestFor,
} from '@/features/experiment-catalog/catalog.js'
import {
  ScientificDisclosure,
  SourceList,
  ClaimList,
} from '@/shared/ui/scientific-disclosure.js'
import { formatLitresAsMl, formatPh } from '@/shared/ui/format.js'

/**
 * Experiment detail (docs/web-application-scope.md §4.2).
 *
 * Purpose: help the learner understand BEFORE starting, and make the model's scope and
 * conditions public. The ten required sections all appear below and all render from the
 * locked release — context, initial sample, process groups, permitted chemicals and
 * operations, key parameters, what is evaluated, safety warnings, assumptions and
 * limits, a link to the scientific sources, and the button to start a new attempt.
 *
 * Every number comes from the content bundle or the frozen scenario constants, never
 * from text typed into this page: a re-release that changes the sample volume changes
 * what is shown here without an edit.
 *
 * Server Component. `generateStaticParams` is not used deliberately — the release set is
 * fixed and small, and rendering per request means a newly registered scenario is
 * reachable without a rebuild.
 */

type DetailPageProps = {
  params: Promise<{ scenarioKey: string }>
}

export async function generateMetadata({
  params,
}: DetailPageProps): Promise<Metadata> {
  const { scenarioKey } = await params
  const entry = findCatalogEntry(scenarioKey)

  return {
    title: entry?.title ?? APP_STRINGS.experimentDetail.notFoundTitle,
    description: entry?.summary,
  }
}

export default async function ExperimentDetailPage({ params }: DetailPageProps) {
  const { scenarioKey } = await params
  const entry = findCatalogEntry(scenarioKey)

  if (entry === null) {
    notFound()
  }

  const manifest = manifestFor(entry.releaseId)
  const actions = listActions(entry.scenarioKey)
  const strings = APP_STRINGS.experimentDetail
  const benchmark = ACID_INPUT_DOMAIN.benchmark
  const limits = ACID_INPUT_DOMAIN.limits

  if (manifest === null) {
    notFound()
  }

  return (
    <div className="page stack-loose">
      <nav aria-label="Breadcrumb">
        <Link className="small" href="/experiments">
          ← {strings.backToCatalog}
        </Link>
      </nav>

      <header className="stack">
        <div className="row">
          <span className="badge badge-mono badge-accent">{entry.releaseId}</span>
          <span className="badge badge-mono">mô hình {entry.modelSpecVersion}</span>
        </div>
        <h1>{entry.title}</h1>
        <p className="lede">{entry.summary}</p>
        <div className="row">
          <Link className="btn btn-primary btn-lg" href={`/simulate/${entry.scenarioKey}`}>
            {strings.startNewAttempt}
          </Link>
          <Link className="btn btn-lg" href="/evidence">
            {strings.viewEvidence}
          </Link>
        </div>
      </header>

      {/*
        Two columns, with the contents alongside.

        §4.2 requires ten distinct blocks on this page — context, sample, process groups,
        permitted operations, parameters, what is evaluated, safety, assumptions, sources
        and the locked release. As one long column that is several screens of scrolling with
        no way to tell what is below the fold or to get back to a section already read. The
        list collapses away under 68rem, where a sidebar would cost more width than it
        earns; the anchors keep working either way, and `scroll-padding-top` on `html` stops
        a jump landing under the sticky header.
      */}
      <div className="with-toc">
        <div className="stack-loose">

      {/* 1. Context and goal */}
      <section className="card stack-tight" id="boi-canh">
        <h2>{strings.contextHeading}</h2>
        <p className="small">{acidText('scenarios.acid-neutralization.context')}</p>
        <p className="small muted">
          {acidText('scenarios.acid-neutralization.learning-goal')}
        </p>
        <dl className="meta-list">
          <dt>{acidText('scenarios.acid-neutralization.target-label')}</dt>
          <dd>{formatPh(benchmark.targetPH)}</dd>
          <dt>{APP_STRINGS.workbench.tolerance}</dt>
          <dd>± {formatPh(benchmark.targetTolerancePH)}</dd>
        </dl>
        <p className="small muted">
          {acidText('scenarios.acid-neutralization.target-band')}
        </p>
        <p className="small faint">
          {acidText('scenarios.acid-neutralization.ph-explanation')}
        </p>
      </section>

      {/* 2. Initial sample */}
      <section className="card stack-tight" id="mau-ban-dau">
        <h2>{strings.initialStateHeading}</h2>
        <dl className="meta-list">
          <dt>Thể tích mẫu axit</dt>
          <dd>{formatLitresAsMl(benchmark.acidVolumeL)}</dd>
          <dt>Nồng độ HCl</dt>
          <dd>
            {benchmark.acidConcentrationMolL.toLocaleString('vi-VN', {
              minimumFractionDigits: 5,
            })}{' '}
            mol/L
          </dd>
          <dt>Điều kiện</dt>
          <dd>25 °C · 0,1 MPa · hệ carbon kín</dd>
        </dl>
      </section>

      {/* 3. Process groups the learner can try — here, the three neutralizer routes */}
      <section className="card stack-tight" id="quy-trinh">
        <h2>Các nhóm quy trình có thể thử</h2>
        <ul className="stack-tight small">
          {ACID_ROUTE_CHOICES.map((route) => (
            <li key={route}>
              <strong>{acidText(`routes.${route}.label`)}</strong> —{' '}
              {acidText(`routes.${route}.description`)}
              {clarificationFor(route) !== null && (
                <span className="faint"> {clarificationFor(route)}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* 4. Permitted chemicals and operations */}
      <section className="card stack-tight" id="thao-tac">
        <h2>{strings.permittedHeading}</h2>
        <table>
          <caption className="visually-hidden">
            Mỗi thao tác, điều kiện trước và khả năng hoàn tác
          </caption>
          <thead>
            <tr>
              <th scope="col">Thao tác</th>
              <th scope="col">{strings.preconditionLabel}</th>
              <th scope="col">Hoàn tác</th>
            </tr>
          </thead>
          <tbody>
            {actions.map((action) => (
              <tr key={action.actionType}>
                <td>
                  {action.label}
                  <br />
                  <code className="tiny faint">{action.actionType}</code>
                </td>
                <td className="small muted">{action.precondition}</td>
                <td>
                  <span
                    className={`badge ${action.undoable ? 'badge-ok' : 'badge-warn'}`}
                  >
                    {action.undoable
                      ? strings.undoableBadge
                      : strings.irreversibleBadge}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="small faint">
          Chỉ các thao tác trên được phép. Hóa học không hoàn tác được: hoàn tác chỉ áp
          dụng cho việc chọn chất trung hòa khi chưa thêm base.
        </p>
      </section>

      {/* 5. Key parameters */}
      <section className="card stack-tight" id="tham-so">
        <h2>{strings.parametersHeading}</h2>
        <dl className="meta-list">
          <dt>Cỡ aliquot cho phép</dt>
          <dd>
            {ACID_INPUT_DOMAIN.permittedAliquotsL
              .map((litres) => `${litres * 1000}`)
              .join(' · ')}{' '}
            mL
          </dd>
          <dt>Đơn vị hiển thị thể tích</dt>
          <dd>mL</dd>
          <dt>Giới hạn base theo route</dt>
          <dd>
            NaOH / Ca(OH)₂ {formatLitresAsMl(ACID_INPUT_DOMAIN.maxVolumeLByRoute.naoh)} ·{' '}
            Na₂CO₃ {formatLitresAsMl(ACID_INPUT_DOMAIN.maxVolumeLByRoute['sodium-carbonate'])}
          </dd>
          <dt>Giới hạn HCl hiệu chỉnh</dt>
          <dd>{formatLitresAsMl(ACID_INPUT_DOMAIN.maxCorrectionAcidVolumeL)}</dd>
          <dt>Số lần thêm thuốc thử tối đa</dt>
          <dd>{limits.maxReagentAdditions}</dd>
          <dt>Số event tối đa mỗi lượt</dt>
          <dd>{limits.maxAcceptedEvents}</dd>
        </dl>
      </section>

      {/* 6. What the system evaluates */}
      <section className="card stack-tight" id="danh-gia">
        <h2>{strings.evaluatedHeading}</h2>
        <dl className="meta-list">
          <dt>{acidText('scoring.ph-component')}</dt>
          <dd>{acidText('scoring.success-label')}</dd>
          <dt>{acidText('scoring.resource-component')}</dt>
          <dd>{acidText('resources.cost-index-label')}</dd>
          <dt>{acidText('scoring.process-component')}</dt>
          <dd>{acidText('resources.safety-index-label')}</dd>
        </dl>
        <p className="small muted">{acidText('scoring.rubric-disclosure')}</p>
        <p className="small faint">{acidText('scoring.achievement-explanation')}</p>
        <p className="small faint">{acidText('scoring.success-explanation')}</p>
      </section>

      {/* 7. Safety warnings */}
      <section className="card stack-tight" id="an-toan">
        <h2>{strings.safetyHeading}</h2>
        <p className="alert alert-danger">{acidText('warnings.safety.supervised-lab')}</p>
        <ul className="stack-tight small">
          <li>{acidText('warnings.model.closed-carbon')}</li>
          <li>{acidText('warnings.model.ideal-activity')}</li>
          <li>{acidText('warnings.model.no-kinetics')}</li>
          <li>{acidText('warnings.model.matrix-limit')}</li>
        </ul>
      </section>

      {/* 8 + 9. Assumptions, limits, and the sources behind them */}
      <ScientificDisclosure />

      <section className="card stack-tight" id="nguon">
        <h2>{strings.sourcesHeading}</h2>
        <Link className="btn" href="/evidence">
          {APP_STRINGS.evidence.title}
        </Link>
        <SourceList sourceKeys={manifest.sourceKeys} />
        <ClaimList claimKeys={manifest.claimKeys} />
      </section>

      {/* 10. Locked release identity */}
      <section className="card stack-tight" id="phien-ban">
        <h2>{strings.releaseHeading}</h2>
        <dl className="meta-list">
          <dt>{APP_STRINGS.release.releaseId}</dt>
          <dd>{entry.releaseId}</dd>
          <dt>{APP_STRINGS.release.modelSpecVersion}</dt>
          <dd>{entry.modelSpecVersion}</dd>
          <dt>{APP_STRINGS.release.scoringVersion}</dt>
          <dd>{entry.scoringVersion}</dd>
          <dt>{APP_STRINGS.release.contentVersion}</dt>
          <dd>{entry.contentVersion}</dd>
          <dt>{APP_STRINGS.release.evidenceRegisterVersion}</dt>
          <dd>{entry.evidenceRegisterVersion}</dd>
          <dt>{APP_STRINGS.release.projectionVersion}</dt>
          <dd>{entry.projectionVersion}</dd>
          <dt>{APP_STRINGS.release.locale}</dt>
          <dd>{entry.locale}</dd>
        </dl>
        <p className="small faint">
          Độ chính xác hiển thị: pH* {ACID_DISPLAY_FORMAT.phSummaryDecimals} chữ số thập
          phân ở tóm tắt, {ACID_DISPLAY_FORMAT.phTechnicalDecimals} ở phần công thức; thể
          tích {ACID_DISPLAY_FORMAT.volumeMlDecimals} chữ số. Làm tròn chỉ để hiển thị —
          trạng thái bên trong không bị cắt.
        </p>
      </section>

      {/* 10 (cont.). Start button repeated at the end, after the learner has read. */}
      <div className="row">
        <Link className="btn btn-primary" href={`/simulate/${entry.scenarioKey}`}>
          {strings.startNewAttempt}
        </Link>
      </div>
        </div>

        <nav className="toc no-print" aria-label="Mục lục trang">
          <p className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>
            Trên trang này
          </p>
          <ol>
            {PAGE_SECTIONS.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.label}</a>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  )
}

/**
 * The page's own contents.
 *
 * Labels are pulled from the same `APP_STRINGS.experimentDetail` keys the headings render,
 * so a reworded heading cannot leave the contents naming a section that no longer exists.
 * The two entries without a string key name blocks whose headings are written inline.
 */
const PAGE_SECTIONS: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'boi-canh', label: APP_STRINGS.experimentDetail.contextHeading },
  { id: 'mau-ban-dau', label: APP_STRINGS.experimentDetail.initialStateHeading },
  { id: 'quy-trinh', label: 'Các nhóm quy trình' },
  { id: 'thao-tac', label: APP_STRINGS.experimentDetail.permittedHeading },
  { id: 'tham-so', label: APP_STRINGS.experimentDetail.parametersHeading },
  { id: 'danh-gia', label: APP_STRINGS.experimentDetail.evaluatedHeading },
  { id: 'an-toan', label: APP_STRINGS.experimentDetail.safetyHeading },
  { id: 'nguon', label: APP_STRINGS.experimentDetail.sourcesHeading },
  { id: 'phien-ban', label: APP_STRINGS.experimentDetail.releaseHeading },
]

/**
 * Localized bundle text.
 *
 * Reads through the typed bundle where possible; the keys passed here are literals from
 * the bundle, so a rename fails at compile time rather than rendering a raw key.
 */
function acidText(key: keyof typeof ACID_STRINGS): string {
  return ACID_STRINGS[key]
}

/**
 * A route's extra clarification, when it has one.
 *
 * Only Ca(OH)₂ carries one, because only it has a distinction a learner could get
 * materially wrong: the model applies to a clear standardized solution, not to milk of
 * lime. Returning null keeps the list from printing an empty clause for the other two.
 */
function clarificationFor(route: string): string | null {
  if (route !== 'calcium-hydroxide') return null
  return acidText('routes.calcium-hydroxide.clarification')
}
