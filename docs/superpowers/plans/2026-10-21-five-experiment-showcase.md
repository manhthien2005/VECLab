# Five experiment showcase

Owner: coder 2. Branch: `feature/five-experiment-showcase`. Target: `develop`.
Base: latest `origin/develop` plus the human-accepted video update (local commit `8f8c418`).

Human request: landing showcases Jar Test, Fe/Zn/Pb water treatment, acid–base extraction, soap and virgin plastic separation, in that order; polish only this section and remove the discontinued introduction, its dedicated image and references throughout current files.

- [x] Update existing catalog/showcase tests and observe baseline failures.
- [x] Replace the landing list, complete artwork mapping and simplify library overviews to avoid duplicate cards.
- [x] Keep the centered ring with two neighbours, hide/inert rear slides, add named desktop navigation and mobile position feedback. Reuse CSS transform/opacity transitions and existing easing; preserve swipe, keyboard, rapid interruption and live reduced motion.
- [x] Remove discontinued content/assets and obsolete references in documentation/tests/instructions. Preserve unrelated water-treatment chemistry, saved user data and historical migrations.
- [x] Run focused unit/browser checks, responsive visual review and type/lint checks. Self-review only; no subagents, merge or deployment.

Direction: preserve the approved light teal/navy technology section and detailed existing images. Use more separation around the selected card, calmer background linework and a clearer active state. Carousel travel uses the existing 420ms motion token to explain spatial selection; controls use 120/240ms feedback. Reduced motion keeps a short opacity cue and immediate placement.

## Evidence and local review — 2026-10-21

- RED: two catalog tests failed because a non-served sixth overview remained; browser test failed because the five-lesson heading was absent. GREEN: both unit files now pass (3 tests).
- Final showcase checks: 10/10 desktop/mobile browser cases passed, covering loaded artwork, all five links, wrapping, keyboard focus/scroll, swipe, rear-slide inertness, interruption and live reduced motion.
- Library checks: 5/6 passed in the combined run; the desktop plastic navigation case timed out during first compilation. Added a missing wait for breadcrumb navigation and allowed the same 15-second navigation budget used by neighbouring tests. Its focused rerun passed (1/1). No simulator code changed.
- Catalog/evidence smoke checks passed on desktop/mobile (2/2), including five library/evidence entries and real routes.
- Final TypeScript and targeted ESLint passed. `git diff --check` passed. Repository-wide tracked-text search found zero occurrences of the discontinued lesson name; its dedicated image was removed.
- Visual review: section captures inspected at desktop, tablet, mobile and dark mobile; adjusted the mobile heading inset and equalized card header spacing in one correction pass. No page overflow at 390/768/1440px. At 320px all seven carousel controls fit and retain 44px touch targets.
- Impeccable detector returned no findings. Taste source lint flags the existing approved section eyebrow and the functional page counter; retained under the landing preservation contract and actual navigation purpose, rather than removing product identity to satisfy generic house rules.
- Motion review: transforms/opacity use existing 420/240ms tokens; the longer travel conveys ring position. Hover displacement is gated to fine pointers, reduced motion disables displacement, rear slides cannot receive focus, and selection is independent of animation completion. No actionable motion findings.
- Self-review performed per the human no-subagent rule. No new runtime dependency, scientific engine change, saved-data deletion, migration rewrite, remote mutation, push, merge or deployment.
- Full build, unrelated suites and required CI not run for this incremental UI task; required CI remains a merge gate.
