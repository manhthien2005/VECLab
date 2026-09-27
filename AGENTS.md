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
