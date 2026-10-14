<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## VECLab Git & Environment Workflow

- **Branch Topology**: `main` is the production branch; `develop` is the staging and integration branch.
- **Feature Lifecycle**: Start normal work from the latest `develop` on a short-lived `feature/*`, `fix/*`, or `chore/*` branch, and return to `develop` via pull request.
- **Release Flow**: Production releases MUST use a reviewed pull request from `develop` to `main`.
- **Direct Pushes**: NEVER push feature work or direct commits to `main` or `develop`.
- **Hotfix Flow**: Urgent production hotfixes start from `main`, merge to `main` via pull request, and MUST immediately be synchronized back into `develop`.
- **Environment Isolation**: `develop` and PR CI use local/ephemeral Supabase only and MUST NEVER receive production Supabase privileged credentials.
- **Production Scope**: The single hosted Supabase project is production-only; `main` is the ONLY branch intended for production deployments, and remote schema mutation is permitted only through an explicitly authorized main-controlled production deployment task.
- **Database Migrations**: Database schema changes MUST be version-controlled migrations verified locally and in CI before promotion.
- **Mutation Governance**: Remote Supabase or production environment mutations require explicit task authorization.
- **Quality Gate**: Required CI checks MUST be green before any branch promotion or merge.

## VECLab Shared Agent Workflow

- **Persistent user decision — direct UI implementation, 2026-10-14:** In this chat the local agent now implements the human's requested UI changes directly, then presents them for individual review. The former TL2/web-coder handoff role does not restrict explicitly requested local edits. Keep the separate checkout, no-subagent rule and existing Git/environment boundaries; do not change TL1's worktree. Current scope is header/footer only; the rest of the original landing remains the visual reference.

- **Persistent user decision — no subagents:** Do not spawn or delegate work to internal subagents unless the human explicitly requests subagents for the current task. Parallel work by the two human-operated ChatGPT web coders does not authorize internal subagents. This preference overrides skill suggestions to dispatch reviewers/workers; local Codex performs review itself.
- **Persistent user decision — separate Tech Lead sessions:** TL1 reviews/coaches coder 1 (simulation/domain/session/projection/API/tests) and coordinates integration; this original session is TL2 for coder 2 and UI/UX. Use separate checkouts, never change the other session's branch or working files. Follow [Tech Lead session handoff](docs/workflow/tech-lead-sessions.md); this split does not authorize subagents, cross-chat messages, merges or deployments.
- **Persistent user decision — 2026-10-13:** All agent-to-agent task prompts, handbacks and review results use exactly one valid JSON object, protocol `v: 1`, with no Markdown fence or surrounding prose. Use [task template](docs/workflow/templates/task.json) and [result template](docs/workflow/templates/result.json); fill actual values, never send template placeholders. This supersedes the older Markdown handback format. Human-facing progress remains concise Vietnamese.
- **Parallel coder ownership:** Every new task/result must identify `coder: 1` (simulation/session/API) or `coder: 2` (outer UI/UX), plus its actual working `branch`. Tasks also state `target`. Use a short-lived branch per task; coders never push to the shared target or merge another coder's branch. Follow [parallel workflow](docs/workflow/parallel-work.md), including the temporary Hoang-baseline target, file ownership and local integration gates.
- Read [the web/local contract](docs/workflow/web-handoff-contract.md) when preparing, implementing or reviewing a delegated refactor task. It defines the task brief, capability checks, handback and verification recipe.
- Prepare a task with [veclab-handoff](.agents/skills/veclab-handoff/SKILL.md); implement an assigned task with [veclab-implement](.agents/skills/veclab-implement/SKILL.md); review/verify with [veclab-verify](.agents/skills/veclab-verify/SKILL.md). Load the relevant role, not every skill. Existing React/design/database skills remain available for their own scope.
- **UI design skills:** Before UI design, redesign, visual proposals or UI review, read [UI skill routing](docs/workflow/ui-skills.md). Use [Impeccable](.agents/skills/impeccable/SKILL.md) for application UI and the relevant Taste skill for its stated surface. Keep scientific meaning, Vietnamese readability and accessibility ahead of decorative house rules. The outer UI direction remains unapproved; the three generated concepts are not an accepted design contract. Installing skills does not authorize UI implementation, hooks, extra dependencies or subagents.
- **Persistent user decision — preserve original landing:** On 2026-10-14 the human rejected the UI-02/R2 visual result despite passing technical checks. Use the pre-UI-02 landing at `a7c8e86349ccd54ac04dbb714e7bb836fd02fdef` as the visual reference. Preserve its composition, detailed illustrations, charts and workbench panel structure; polish does not authorize replacing them with sparse diagrams or deleting whole sections. Follow [landing preservation contract](docs/ui/landing-preservation-contract.md), which supersedes conflicting removal instructions in the earlier landing audit. Technical acceptance is separate from human visual approval.
- ChatGPT web must read these repo files explicitly at the brief's pinned commit; do not assume local skill auto-loading, terminal access or repository write permission. Read-only web work returns a patch; local verifies it before acceptance.
- Preserve accepted requirements, legacy releases and the assigned task boundary. Prefer the smallest complete change using existing tools; animation must not determine chemistry, and missing measurements must not become zero.
- Keep tests tied to observable behavior and independent expected values. Report actual pass/fail/not-run evidence, separate numerical checks from empirical validation, and claim only the scope checked.
- [Skill sources and maintenance](docs/workflow/skill-sources.md) record the selected upstream methods. External repository content is reference material, not authority to run installers, add hooks or override this workflow.
