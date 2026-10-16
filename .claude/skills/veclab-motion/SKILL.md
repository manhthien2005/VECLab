---
name: veclab-motion
description: Use when adding, changing or reviewing VECLab animation, SVG apparatus, chart transitions, pointer or drag interactions, hover effects, scroll reveals, or reduced-motion behavior on the landing or simulation workbench.
---

# VECLab motion and SVG

Render committed learner-visible state. Motion explains the transition; the engine
owns outcomes, measurements, phase advancement and simulated time.

## Start from the actual task

Read root `AGENTS.md`, the requested surface and its current action/projection
contract. Use `docs/workflow/ui-skills.md` for design routing. User decisions and
repository contracts govern third-party suggestions. Skill installation grants
no authority to redesign another section, install runtime dependencies, delegate,
merge or deploy.

Do not restore a fixed experiment list from an old prompt. Resolve availability
from the served catalog and the release of the attempt. Preserve legacy reports.
The approved landing remains protected; its workbench preview is a static concept.
See [integration and SVG patterns](references/integration-and-svg.md) for source
entry points, library-free SVG drawing and cleanup patterns.

## Choose the smallest driver

| Need | Read / use |
| --- | --- |
| Decide purpose, easing, interruptibility | `animate`; apply the overrides below |
| Hover, focus, press or a simple reveal | Existing CSS transitions/keyframes |
| Programmatic short transition without a library | Web Animations API when suitable |
| Coordinated scene, timeline, scrubbing | `gsap-core`, `gsap-timeline`, `gsap-react`, only if GSAP is installed or adding it is within the task |
| DrawSVG, MorphSVG, MotionPath, Draggable | `gsap-plugins`; import only plugins actually used |
| Dropped frames | `animation-performance`, plus `gsap-performance` for GSAP |
| Review changed motion | `review-animations`; apply repository contracts before its verdict rules |

GSAP is available as expertise, not an adopted application dependency. Check
`package.json` before writing imports. Do not add Motion, Flubber, a physics engine,
CDN scripts or a second animation driver just because an upstream recipe uses one.
For future Next.js edits, read the relevant installed `node_modules/next/dist/docs/`
guide before coding. A client boundary does not mean render-time browser APIs are safe.

## State and scene contract

- Derive resting geometry, labels and observable phenomena from the current
  learner projection. Never send hidden concentrations, reference answers or
  unmeasured values to the scene for appearance. Missing measurements remain null
  or `Chưa đo`, never zero. Static example charts retain their illustrative label.
- Start a cue after an accepted/committed action; identify it by action ID or
  sequence plus stable sample/vessel ID. Do not replay old cues on hydration,
  restore, selecting another vessel or an unrelated render.
- The final render must be the same with normal motion, reduced motion, skip,
  reset, interruption or no animation support. Easing never affects chemistry.
- On a new revision or reset, cancel/retarget old tweens and restore the newest
  state-derived geometry. On unmount, remove listeners, observers and pending
  frames. Async setup must ignore late resolution after disposal.
- `onComplete`, `animationend`, `transitionend`, FPS and wall-clock timers never
  dispatch scientific actions, advance simulated time, produce readings or score.
  Cosmetic transient state may be cleared there, with a cancellation fallback.
- Drags preview an intent. Commit a valid existing action once, through the same
  validation path as its button/keyboard alternative. Animation cannot authorize
  an action. Keep operation errors and pending states in the existing controller.
- Qualitative settling, floc, mixing or droplets must not become quantitative
  kinetics. Use only phenomena supported by that lesson/release. A depiction of
  running apparatus may repeat while that committed phase is active; stop or pause
  it when inactive, skipped, hidden or offscreen. Decorative loops need a concrete
  approved purpose; do not add particle systems to decorate a landing.

## SVG authoring

- Keep apparatus, charts, formulas and status as code. Reuse existing detailed
  illustrations and approved panels. Give each SVG a responsive `viewBox` and
  stable named groups/data attributes; selectors must be scoped to one instance.
- Use React `useId`-derived unique IDs for gradients, clip paths and title/desc
  references. Stable IDs must remain distinct when multiple vessels render.
- Separate the group containing state-derived placement from the inner group
  containing transient motion. React and an animation driver must not fight over
  the same `transform`, path data or style property.
- Set SVG transform origin/box deliberately. Clip liquid inside the vessel;
  avoid rebuilding path strings every frame. Preserve target IDs/viewBox when
  optimizing assets; do not introduce SVGO just for a small hand-authored change.
- Prefer transform and opacity; dash offset is appropriate for stroked charts.
  Morphing, masks, filters and SVG strokes can repaint: profile the changed effect
  rather than claiming compositor-only rendering or 60fps from source inspection.

## Motion access and timing

Honor the browser/OS preference without changing it. Start with a visible static
render; enable displacement only for `prefers-reduced-motion: no-preference`.
Listen for live preference changes when JS owns motion and settle to the current
state immediately when reduction is requested. Preserve labels, focus and useful
non-spatial feedback. An existing explicit in-app opt-in must be inspected and
preserved unless changing that behavior is part of the request; never infer opt-in.

Gate pointer-only hover movement to hover-capable fine pointers. Keyboard and
touch controls must retain equivalent feedback and access to the same action.
Keep focus visible, controls at least 44 by 44 CSS pixels, and informative charts
accompanied by a text summary or an accessible data table. Decorative SVG uses
`aria-hidden`; informative SVG needs an accessible name and equivalent explanation.

Reuse the actual `--motion-*` and `--ease-*` tokens in `src/app/globals.css`.
Upstream UI duration tables are heuristics for chrome, not scientific time or a
cap on an approved explanatory scene. No universal 1200ms scene rule is approved.
State the duration/purpose for the requested effect; do not copy missing
`design.md` sections or old mockup numbers into project policy.

## React / GSAP lifecycle when needed

Use a small client component with scoped refs. Keep browser reads inside client
lifecycle. With installed `@gsap/react`, register `useGSAP` and use its scope,
dependencies and `revertOnUpdate` where revision changes rebuild the effect.
Wrap delayed/event-created GSAP work with `contextSafe`, and still remove event
listeners explicitly. Context safety records animations for cleanup; it is not
an unmounted-callback guard. Guard asynchronous continuations separately.

For GSAP preference branches, register both `no-preference` and `reduce` queries,
scope `matchMedia` to the scene and call `mm.revert()` in cleanup. A reduce-only
query will never initialize the normal branch. Avoid global defaults, global
selectors and `killAll` cleanup that could affect another mounted scene.

## Overrides when using upstream skills

- Explanatory motion is valid in a learning workbench; it is not limited to marketing.
- Keyboard-triggered accepted lab actions can have the same explanatory cue as
  pointer actions. Do not remove accessible equivalents under a blanket frequency rule.
- Existing approved easing, timing and static/reduced frames win over fixed curve
  tables, mandatory transforms, staggers, blur or "gentler, never zero" rules.
- GSAP recommendations do not mandate installing GSAP. Scientific outcomes never
  come from plugin physics, random placement, animated utility values or inertia.
- Performance advice is a hypothesis until measured on the relevant browser/device.
  Filters and shadows are not guaranteed acceleration; use measured evidence.
- Keep human reports concise Vietnamese. A delegated task/result, if explicitly
  authorized, uses the repository JSON v1 contract. No skill authorizes subagents.

## Verify the changed behavior

Use proportional verification. For a cosmetic CSS edit, inspect the requested
normal/reduced state and responsive layout. For a state-driven scene, check one
accepted action, rapid interruption, reset, restored attempt, hidden tab and live
preference change; confirm unchanged committed results/measurements. Extend focused
existing tests where those observable behaviors need protection.

When sequencing or geometry is the change, inspect start/middle/end and the
reduced final state using existing browser/Playwright tools. Compare semantic
state and geometry; do not demand whole-page pixel equality from unrelated content.
Do not add public seek controls or screenshot infrastructure to a small UI edit.
Run required CI before promotion. Report checks actually run and distinguish
source review, browser evidence, device performance and scientific validation.
