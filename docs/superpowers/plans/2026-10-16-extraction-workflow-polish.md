# Acid–base extraction: workflow and guidance refinement

Scope: the existing extraction checkout and server on port 3004. No other experiment, dependency, database or released chemistry/scoring changes.

1. Verify the locked model and scoring: three nominal 100 mg substances, recovery at least 80%, model purity at least 90%, dry products with a mass reading after the last operation, and calculation error at most one percentage point. Version 2 also assesses mixing before withdrawing a phase. Preserve version 1 attempts.
2. Expose only the existing, learner-safe `needsMix` operating flag as an optional projection annotation. Keep hidden composition and numerical grading out of the working view.
3. Make control constraints visible, distinguish measurement from product declaration, and retain independent answer drafts for A/B/N. Preserve valid alternative extraction sequences and incomplete submissions.
4. Show short, action-specific animation and saved-action feedback; distinguish mixed and separated layers without inventing kinetics or pressure. Do not replay old animations on inspection or resume.
5. Keep measurements/products in their bento layout and move paginated action history into a keyboard-accessible notebook tab.
6. Separate the detail overview from the full guide. Cover inputs, outputs, criteria, terminology, phase routing, per-step purpose, observable outcomes, troubleshooting, safety and limitations. pH/pKa relations are model guidance, not a universally optimal recipe.
7. Verify focused projection/engine/session checks, typecheck, changed-file lint and extraction desktop/mobile flows. Keep the server available for human review; no screenshots, merge, push or deployment.

Reference checked: MIT OCW, “Transfer and Extraction Techniques” (2026-10-16). It supports planning a three-component extraction and isolating/weighing products; VECLab's abstract substances and 80%/90% criteria remain its own teaching conventions.

## Verification

- 16 focused Vitest checks passed: engine, inspection/projection, report and IndexedDB session; covers both extraction orders, missing mixing, replay, idempotency, conservation and legacy version 1.
- 12 desktop/mobile Playwright checks passed: full valid/incomplete-protocol flows, resume/report, direct entry, inspection, notebook tabs, phase states, volume constraints and independent product drafts.
- After the final accessibility/submission-review adjustment, the four affected desktop/mobile cases passed again.
- Typecheck, changed-file ESLint and diff whitespace check passed. No screenshots, production build or empirical chemistry validation performed in this round.
- The additive optional `needsMix` annotation uses existing version 2 state only; legacy projections omit it. Stored completed report snapshots are not rewritten.
