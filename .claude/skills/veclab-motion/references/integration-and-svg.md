# Integration entry points and SVG techniques

Paths are relative to the repository. Re-read current source; these are entry
points, not a new contract or an allowlist for editing them.

| Surface | First inspect | Boundary |
| --- | --- | --- |
| Jar Test | `src/features/jar-test/apparatus.tsx`, `workbench.module.css`; `src/application/scenarios/jar-projection.ts` | Cue action IDs, stable cup IDs, committed phase, nullable/invalid readings; inspect existing skip/opt-in/visibility behavior |
| Extraction | `src/features/extraction/apparatus.tsx`, `vessel-art.tsx`, `apparatus.module.css`; `src/application/scenarios/extraction-projection.ts` | Vessel IDs, committed phase volumes and separation; avoid revealing report distribution during an active attempt |
| Legacy acid | `src/features/simulation-workbench/apparatus/`; `src/application/scenarios/acid-projection.ts` | Preserve that release's actions and measurement semantics |
| Landing | `src/features/landing/hero-pointer-stage.tsx`, `scroll-reveal.tsx`, `workbench-preview.tsx`; `src/app/globals.css` | Approved composition, static concept, existing pointer/reveal behavior; no scientific actions or fabricated readings |

For scientific meaning, locate the current lesson/release spec, including
`docs/experiments/jar-test-design.md`,
`docs/superpowers/specs/2026-10-15-acid-base-extraction-design.md` and
`docs/superpowers/specs/2026-10-13-simulation-v1-design.md` as applicable.
The served catalog determines runnable routes. Product plans do not grant
availability or rewrite stored releases.

## Stroke reveal without a library

Normalize a stroke with `pathLength="1"`. Default to the full visible path so
disabled JS, reduced motion and incomplete setup cannot leave data hidden.
The `d` below comes from actual allowed chart points; it is not a source of data.

```tsx
<path
  className={styles.curve}
  d={pathFromAllowedPoints}
  pathLength="1"
  fill="none"
  stroke="currentColor"
  data-draw={playNewCue ? 'true' : 'false'}
/>
```

```css
.curve { stroke-dasharray: 1; stroke-dashoffset: 0; }
@media (prefers-reduced-motion: no-preference) {
  .curve[data-draw='true'] {
    animation: draw-curve var(--motion) var(--ease-out) both;
  }
}
@keyframes draw-curve {
  from { stroke-dashoffset: 1; }
  to { stroke-dashoffset: 0; }
}
```

This is a finite cue. Do not replay by changing a key on every render. If repeated
accepted actions need retargeting, use a scoped WAAPI/GSAP animation handle and
cancel it when superseded. Re-read the exact local token before choosing duration.
Stroke drawing can repaint; profile if the path is complex or many run together.

## Independent transform ownership

```tsx
<g transform={committedPlacement}>
  <g ref={cueRef} data-part="transient-cue">
    {apparatusParts}
  </g>
</g>
```

React owns the outer placement. A driver may transform the inner group and must
return it to identity on completion, skip, reduced motion or reset. Canceling a
WAAPI animation removes its effect unless committed styles were retained; avoid
`commitStyles` for transient cues so stale inline styles do not survive reset.

## Cleanup and asynchronous setup

Allocate animations/listeners/observers within the owning effect. Track an
explicit disposed flag around dynamic imports or promises. If disposal happened,
do not create a late timeline. For GSAP, scope context/matchMedia and revert on
cleanup; contextSafe alone does not suppress a late async callback. Never
register a global cleanup that kills another workbench's animations.

For DOM event listeners, keep the original callback reference for removal. Cancel
pending animation frames and timers. The state-derived static render must remain
correct even when no completion event fires.
