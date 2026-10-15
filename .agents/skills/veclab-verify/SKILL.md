---
name: veclab-verify
description: Use when reviewing a VECLab patch or PR, verifying a refactor handback, or deciding whether an assigned simulation task has enough evidence for acceptance.
---

# VECLab verification

Read [AGENTS](../../../AGENTS.md), the assigned brief/spec and the [handoff contract](../../../docs/workflow/web-handoff-contract.md), especially its verification matrix. Obtain the base SHA and actual diff; record the head SHA if committed, or explicitly mark an unapplied patch with no head yet. A summary without source or test evidence is not enough for acceptance.

Trace changed behavior through connected callers and boundaries. Check the assigned scope, legacy compatibility, input validation, ownership, units, null/measurement validity and hidden learner data. Inspect deterministic domain replay and stable action IDs/revision conflicts where touched. Check that UI animation cannot change chemistry. Report concrete failing cases with file/line evidence; avoid speculative style findings.

Run the existing focused tests and affected regressions. Use the contract's commands for the layer changed. `npm run verify` covers type/lint/Vitest/build, not Playwright or database checks. UI acceptance needs an actual learner journey and relevant desktop/mobile/accessibility checks. Cloud acceptance needs local Supabase evidence. Preserve failure screenshots/traces and reproduction steps; use no new runner by default.

Separate formula reproduction, model uncertainty and independent empirical validation. Tests whose expected values come from the implementation do not validate the model. Reject claims of UI, cloud or scientific validity that exceed the evidence.

Return: **needs changes**, **missing evidence**, or **passes assigned scope**; then material findings, actual commands/environment/results, unverified parts and the next step. A missing environment is not a pass. Documentation-only verification does not require unrelated app suites. Do not silently edit a reviewed patch or expand to the next task.
