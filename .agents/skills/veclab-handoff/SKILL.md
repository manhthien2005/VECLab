---
name: veclab-handoff
description: Use when preparing a VECLab task, prompt, or source handoff for ChatGPT web, or checking whether a refactor task is ready to dispatch.
---

# VECLab handoff

Read [AGENTS](../../../AGENTS.md) and the [handoff contract](../../../docs/workflow/web-handoff-contract.md), then only the spec/plan sections needed for the task.

Resolve source/tool facts yourself. Ask only about consequential open decisions, with a recommendation; preserve accepted product/model scope. Produce a small task brief using the contract fields: task goal, actual repo/branch/base SHA, inputs, allowed files, interfaces, acceptance checks, verified web capabilities and handback format. Tell web to read [veclab-implement](../veclab-implement/SKILL.md); local review uses [veclab-verify](../veclab-verify/SKILL.md). Use existing domain/UI/database skills only when relevant.

Report readiness explicitly: prepared locally, source access unconfirmed, or ready to dispatch. A committed plan alone is not a handoff. Confirm the preparation stage includes the project skills and contract, and that web can read the pinned source. With read-only access, request a patch; with no terminal, assign verification to local. Never invent remote visibility, tool capabilities or test results.

Drafting a brief does not authorize sending it to another chat or publishing code. Preserve the human's web-implementation/local-review workflow.
