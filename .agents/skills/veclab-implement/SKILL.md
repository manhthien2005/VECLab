---
name: veclab-implement
description: Use when implementing a scoped VECLab refactor task, including a ChatGPT web task brief or one task from an approved simulation plan.
---

# VECLab implementation

Read [AGENTS](../../../AGENTS.md), the [handoff contract](../../../docs/workflow/web-handoff-contract.md), and the assigned brief/spec at its base SHA. Confirm source access and available tools; a GitHub reader does not imply a terminal or write access.

Map the affected input → domain → projection → storage/API → UI path and its callers before editing. Read installed Next.js guides for Next changes. Mark code facts separately from proposed changes. Resolve facts from source; ask only about consequential decisions still open, without reopening accepted requirements.

Implement one assigned task through its acceptance checks. Prefer existing helpers, platform APIs and installed dependencies. Preserve legacy releases, boundary validation, ownership checks and error behavior. Change an interface with its affected callers. A second scenario alone does not justify a generic framework, renderer, hook system or new dependency.

For simulation work, follow the experiment's units, profile bounds and numerical provenance. Keep domain outcome, measurement validity and presentation separate: missing readings stay null/N/A, animation does not determine chemistry, and pre-completion learner views do not expose hidden answers. Check replay/idempotency when the task touches those paths.

For meaningful new behavior, use a focused failing public-behavior test, implement the smallest complete change, then run affected regressions. Derive expected values independently; do not calculate expectations by calling the implementation. Avoid tests that merely mirror trivial edits. Use relevant existing React/design/Supabase skills for their actual scope.

Hand back the actual diff or complete file contents, base/head identities, changed files, commands and pass/fail/not-run evidence using the contract. Without execution tools, provide the patch and leave verification to local. Stop at the assigned task boundary.
