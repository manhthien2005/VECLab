import Link from 'next/link'
import { APP_STRINGS } from '@/content/index.js'
import { listCatalog } from '@/features/experiment-catalog/catalog.js'
import { ScientificDisclosure } from '@/shared/ui/scientific-disclosure.js'
import { PhMeter } from '@/shared/ui/ph-meter.js'
import {
  ArrowRightIcon,
  BookIcon,
  CalculatorIcon,
  CheckCircleIcon,
  FlaskIcon,
  GuestIcon,
  LayersIcon,
  MoleculeIcon,
  PlayIcon,
  RepeatIcon,
  SigmaIcon,
  WarningIcon,
  type IconComponent,
} from '@/features/landing/icons.js'
import { BookStack, HeroPhChart, MiniPhCurve } from '@/features/landing/landing-visuals.js'
import { HeroPreview } from '@/features/landing/hero-preview.js'
import { ScrollReveal } from '@/features/landing/scroll-reveal.js'

/**
 * Home page and experiment showcase (docs/web-application-scope.md §4.1), redesigned to
 * the approved landing package (design.md, reference/approved-landing.png).
 *
 * Required content, all present below: what the product is, its position as a LEARNING
 * tool rather than an operating one, the three experiment cards, the main learning value,
 * the model-limitation warning, and access to detail/start plus sign-in or the lab (the
 * last two live in the header/footer nav on every page, so they are not repeated here).
 *
 * §4.1 also says what NOT to build: no news, no blog, no leaderboard, no long marketing
 * copy — design.md repeats this as an explicit image-density rule. So the hero states one
 * claim and shows the product's actual output — a modelled pH against its target band —
 * inside a real product-preview frame rather than a screenshot or a stock photo.
 *
 * MVP names three experiments (docs/core-project-scope.md §1), but only acid
 * neutralization has a registered engine today (src/application/scenarios/registry.ts).
 * The showcase below shows all three, honestly: the served one links straight into a new
 * attempt, the other two are marked upcoming rather than linked to an attempt that cannot
 * start (docs/system-architecture.md §2.4).
 *
 * Server Component reading only the release registries, so it is statically renderable.
 * `ScrollReveal` is the one client leaf on the page (§3.A of the frontend taste guide):
 * it observes `.reveal` sections and holds no state of its own, so everything else here
 * stays server-rendered. Every number on the page comes from the locked release, never
 * from prose typed here.
 */

const TRUST_ICONS: readonly IconComponent[] = [GuestIcon, RepeatIcon, BookIcon]

type BadgeTone = 'icon-badge-blue' | 'icon-badge-green' | 'icon-badge-teal'

const EVIDENCE_ICONS: ReadonlyArray<{ Icon: IconComponent; tone: BadgeTone }> = [
  { Icon: CalculatorIcon, tone: 'icon-badge-blue' },
  { Icon: SigmaIcon, tone: 'icon-badge-teal' },
  { Icon: BookIcon, tone: 'icon-badge-green' },
]

const SHOWCASE_META: Record<string, { Icon: IconComponent; tone: BadgeTone }> = {
  'acid-neutralization': { Icon: FlaskIcon, tone: 'icon-badge-blue' },
  'copper-precipitation': { Icon: MoleculeIcon, tone: 'icon-badge-green' },
  'plastic-density-separation': { Icon: LayersIcon, tone: 'icon-badge-teal' },
}

export default function HomePage() {
  const catalog = listCatalog()
  const strings = APP_STRINGS.home
  const firstScenario = catalog[0]
  const liveScenarioKeys = new Set(catalog.map((entry) => entry.scenarioKey))

  return (
    <>
      <ScrollReveal />

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy rise">
            <p className="hero-eyebrow">{strings.heroEyebrow}</p>
            <h1 className="hero-headline">
              {strings.heroHeadline.map((line, idx) => (
                <span
                  key={line}
                  className={idx === strings.heroHeadline.length - 1 ? 'hero-headline-accent' : undefined}
                >
                  {line}
                </span>
              ))}
            </h1>
            <p className="hero-lede">{strings.lede}</p>

            <div className="hero-cta-group">
              {firstScenario !== undefined && (
                <Link
                  className="btn hero-btn-primary"
                  href={`/simulate/${firstScenario.scenarioKey}`}
                >
                  <span>{strings.heroPrimaryCta}</span>
                  <ArrowRightIcon />
                </Link>
              )}
              <a className="btn hero-btn-secondary" href="#workbench-preview">
                <PlayIcon />
                <span>{strings.heroSecondaryCta}</span>
              </a>
            </div>

            {/* Lightweight trust and confidence strip */}
            <ul className="hero-trust-strip">
              {strings.trustItems.map((item, index) => {
                const Icon = TRUST_ICONS[index] ?? CheckCircleIcon
                return (
                  <li className="hero-trust-item" key={item.label}>
                    <Icon className="hero-trust-icon" />
                    <span>{item.label}</span>
                    <span className="sr-only"> ({item.hint})</span>
                  </li>
                )
              })}
            </ul>

            {/* Compact refined scientific model limitation disclosure */}
            <div className="hero-model-disclosure" role="note" aria-label="Giới hạn mô hình giáo dục">
              <WarningIcon className="hero-model-icon" />
              <p>
                <strong>Mô hình học tập:</strong> {strings.modelWarning}
              </p>
            </div>
          </div>

          {/* Hero product preview frame */}
          <HeroPreview />
        </div>
      </section>

      {/* Relocated learning value content (quiet, supporting strip outside the primary first-fold copy) */}
      <section className="hero-learning-strip reveal" aria-label={strings.learningValueHeading}>
        <div className="hero-learning-inner">
          <div className="hero-learning-header">
            <SigmaIcon className="hero-learning-icon" />
            <span>{strings.learningValueHeading}</span>
          </div>
          <ul className="hero-learning-items">
            {strings.learningValues.map((value, idx) => (
              <li key={idx} className="hero-learning-item">
                <span className="hero-learning-bullet" aria-hidden="true">•</span>
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="page stack-loose">

        <section className="stack reveal">
          <div className="section-head">
            <div className="stack-tight">
              <p className="eyebrow">{strings.showcaseEyebrow}</p>
              <h2>{strings.showcaseHeading}</h2>
            </div>
            <Link className="btn btn-ghost btn-sm" href="/experiments">
              Xem tất cả
              <ArrowRightIcon />
            </Link>
          </div>
          <p className="lede">{strings.showcaseLede}</p>

          <div className="showcase-grid">
            {strings.showcaseCards.map((card) => {
              const isLive = liveScenarioKeys.has(card.scenarioKey)
              const meta = SHOWCASE_META[card.scenarioKey] ?? { Icon: FlaskIcon, tone: 'icon-badge-blue' as const }
              const { Icon, tone } = meta
              const href = isLive ? `/simulate/${card.scenarioKey}` : '/experiments'

              return (
                <Link
                  className={isLive ? 'showcase-card' : 'showcase-card showcase-card-disabled'}
                  href={href}
                  key={card.scenarioKey}
                >
                  {!isLive && <span className="showcase-badge">{strings.comingSoonBadge}</span>}

                  <div className="showcase-card-head">
                    <span className={`icon-badge ${tone}`}>
                      <Icon />
                    </span>
                    <div>
                      <h3>{card.title}</h3>
                      <p>{card.summary}</p>
                    </div>
                  </div>

                  <div className="showcase-media">
                    {card.scenarioKey === 'acid-neutralization' ? (
                      <MiniPhCurve />
                    ) : (
                      <img src={`/assets/${card.scenarioKey}.svg`} alt="" aria-hidden="true" />
                    )}
                  </div>

                  <span className="showcase-cta">
                    {isLive ? strings.showcaseCtaLabel : strings.comingSoonCta}
                    <ArrowRightIcon />
                  </span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* §4.6-style progressive detail: the real workbench (docs/mockups/simulation-
            workbench-desktop.html), rebuilt from real component classes — `PhMeter`, the
            `.ph-series` chart, `.timeline` — rather than a screenshot. The readouts here
            ("Đang khuấy", 6,20, the tab strip) are the same kind of illustrative preview
            moment as the hero's; the workbench itself computes real ones per attempt. */}
        <section className="stack reveal" id="workbench-preview">
          <p className="eyebrow">{strings.workbenchEyebrow}</p>
          <h2>{strings.workbenchHeading}</h2>
          <p className="lede">{strings.workbenchLede}</p>

          <div className="workbench-frame">
            <div className="workbench-frame-bar">
              <strong>{APP_STRINGS.brand} · Trung hòa axit</strong>
              {firstScenario !== undefined && (
                <Link
                  className="btn btn-sm btn-ghost row-end"
                  href={`/simulate/${firstScenario.scenarioKey}`}
                >
                  Mở không gian mô phỏng
                  <ArrowRightIcon />
                </Link>
              )}
            </div>

            <div className="wp-grid">
              <div className="wp-rail">
                <p className="wp-panel-title">Tiến trình</p>
                <ol className="timeline">
                  {strings.workbenchSteps.map((step, index) => (
                    <li data-current={index === 1 ? 'true' : undefined} key={step}>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="wp-middle">
                <div className="wp-state">
                  <p className="wp-panel-title">Trạng thái hiện tại</p>
                  <div className="wp-state-body">
                    <div className="wp-state-visual">
                      <img src="/assets/hero-neutralization.svg" alt="" aria-hidden="true" />
                    </div>
                    <p className="ph-readout">
                      6,20
                      <span className="small faint">pH*</span>
                    </p>
                    <PhMeter phStar={6.2} />
                    <span className="wp-status-pill">
                      <span className="wp-status-dot" />
                      Đang khuấy
                    </span>
                  </div>
                </div>

                <div className="wp-chart">
                  <p className="wp-panel-title">Biểu đồ theo thời gian</p>
                  <div className="wp-tabs">
                    <span className="wp-tab" data-active="true">pH</span>
                    <span className="wp-tab">Nồng độ</span>
                    <span className="wp-tab">Nhiệt độ</span>
                  </div>
                  <HeroPhChart />
                </div>
              </div>

              <div className="wp-actions">
                <p className="wp-panel-title">Thao tác tiếp theo</p>
                <div className="wp-actions-list">
                  <div className="wp-actions-row">
                    <span>Chất trung hòa</span>
                    <span>NaOH 0,0100 M</span>
                  </div>
                  <div className="wp-actions-row">
                    <span>Thể tích thêm</span>
                    <span>0,50 mL</span>
                  </div>
                </div>
                {firstScenario !== undefined && (
                  <Link
                    className="btn btn-primary btn-block"
                    href={`/simulate/${firstScenario.scenarioKey}`}
                  >
                    Thêm vào dung dịch
                  </Link>
                )}
              </div>
            </div>

            <div className="wp-below">
              <div className="wp-result">
                <CheckCircleIcon />
                <div>
                  <strong>pH tăng dần</strong>
                  <p>Dung dịch đang tiến gần đến trạng thái trung tính.</p>
                </div>
              </div>
              <div className="wp-formula">
                <p>HCl + NaOH → NaCl + H₂O</p>
                <p>
                  Phản ứng trung hòa giữa axit mạnh và bazơ mạnh tạo muối và nước. pH tăng dần
                  do nồng độ H⁺ giảm.
                </p>
                {firstScenario !== undefined && (
                  <Link href={`/experiments/${firstScenario.scenarioKey}`}>
                    Xem chi tiết
                    <ArrowRightIcon />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="stack reveal" id="evidence">
          <div className="stack-tight">
            <p className="eyebrow">{strings.evidenceEyebrow}</p>
            <h2>{strings.evidenceSectionHeading}</h2>
            <p className="lede">{strings.evidenceSectionLede}</p>
          </div>

          <div className="evidence-section">
            <div className="evidence-cards">
              {strings.evidenceCards.map((card, index) => {
                const meta = EVIDENCE_ICONS[index] ?? EVIDENCE_ICONS[0]!
                const { Icon, tone } = meta
                return (
                  <div className="evidence-card" key={card.title}>
                    <span className={`icon-badge icon-badge-sm ${tone}`}>
                      <Icon />
                    </span>
                    <h3>{card.title}</h3>
                    <p>{card.body}</p>
                    <Link href="/evidence">
                      Xem chi tiết
                      <ArrowRightIcon />
                    </Link>
                  </div>
                )
              })}
            </div>
            <div className="evidence-illustration">
              <BookStack />
            </div>
          </div>
        </section>

        <section className="final-cta reveal">
          <div className="final-cta-body">
            <span className="icon-badge icon-badge-teal" aria-hidden="true">
              <FlaskIcon />
            </span>
            <div className="final-cta-copy">
              <h2>{strings.finalCtaHeading}</h2>
              <p>{strings.finalCtaLede}</p>
            </div>
          </div>
          {firstScenario !== undefined && (
            <Link className="btn btn-primary btn-lg" href={`/simulate/${firstScenario.scenarioKey}`}>
              {strings.finalCtaButton}
              <ArrowRightIcon />
            </Link>
          )}
        </section>

        <ScientificDisclosure />
      </div>
    </>
  )
}
