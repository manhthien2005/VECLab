# VECLab Backend Threat Model

## Scope and authority
- **Scope**: Backend, database, BFF, and data persistence boundaries of VECLab at commit `7a8c330ee54d03f5f3b6a07acb4290af1159d62c`.
- **Precedence and conflict resolution** ([docs/README.md §5](docs/README.md#L106-L137)):
  1. Current repository implementation at `required_base_sha` (`7a8c330ee54d03f5f3b6a07acb4290af1159d62c`).
  2. Authoritative documentation hierarchy: Core Project Scope > Web Application Scope > System Architecture > Data and State Model.
  3. Current database migrations for concrete database schema, constraints, RLS policies, and RPC definitions.
  4. Current application source code for runtime trust boundaries, session verification, and API guards.
  5. Installed official Supabase skills as generic advisory guidance ([.agents/skills/supabase/SKILL.md](.agents/skills/supabase/SKILL.md), [.agents/skills/supabase-postgres-best-practices/SKILL.md](.agents/skills/supabase-postgres-best-practices/SKILL.md)).
  6. Task prompt specifications.

## Architecture and trust boundaries
- **Zone 1: Client Browser (Untrusted)**
  - Operates as an untrusted client environment. Transmits user action intent only (action type, parameters, unit selections, client UUIDs).
  - Accepted vs recomputed inputs: The server accepts initial user configuration and action inputs; all domain states, calculation traces, observation codes, scores, and integrity hashes are recomputed server-side ([docs/system-architecture.md §9](docs/system-architecture.md#L523-L560)).
  - Direct database queries via PostgREST are restricted by RLS to SELECT-only on own rows; direct mutation is impossible.
  - Guest mode runs purely client-side using browser IndexedDB (`guest_attempts`, `guest_attempt_events`, `guest_metadata`) ([src/application/attempts/guest-repository.ts](src/application/attempts/guest-repository.ts), [docs/data-and-state-model.md §16.1](docs/data-and-state-model.md#L786-L792)).
- **Zone 2: Next.js BFF & API Guards**
  - Session verification: Authenticates user identity via `supabase.auth.getUser()`, validating UUIDs ([src/features/auth/session.ts#L48-L64](src/features/auth/session.ts#L48-L64)).
  - CSRF boundary: Verifies `Origin` and `Referer` headers on state-changing requests ([src/app/api/_lib/guard.ts#L78-L114](src/app/api/_lib/guard.ts#L78-L114)).
  - Payload limits: Enforces 64 KiB maximum request body size via `MAX_ACTION_BODY_BYTES` ([src/app/api/_lib/guard.ts#L36](src/app/api/_lib/guard.ts#L36)).
  - Cache prevention: Sets `private, no-cache, no-store, max-age=0, must-revalidate` on all authenticated responses ([src/app/api/_lib/guard.ts#L39](src/app/api/_lib/guard.ts#L39)).
- **Zone 3: Deterministic Simulation Domain**
  - Simulation engine runs outside database transactions in TypeScript ([docs/data-and-state-model.md §12](docs/data-and-state-model.md#L543-L572)).
  - Calculates state transitions, validations, observation codes, resource ledgers, and projection summaries deterministically.
- **Zone 4: Privileged Database Boundary**
  - Server invokes PostgreSQL `SECURITY DEFINER` RPCs using `SUPABASE_SECRET_KEY` ([.env.example#L5](.env.example#L5), [src/infrastructure/supabase/admin.ts#L23](src/infrastructure/supabase/admin.ts#L23)).
  - Service-role credentials remain strictly server-side and are never exposed to browser clients or `NEXT_PUBLIC_` variables.
  - Server RPCs operate under a layered authorization contract: Next.js verifies the authenticated user, the repository forwards that verified actor ID, and RPCs operating on existing attempts re-check row ownership (`v_attempt.user_id = p_actor_user_id`), while `create_attempt` records the verified actor ID upon row creation. Write paths on existing rows use row locking (`SELECT ... FOR UPDATE`) for concurrency serialization; when an attempt ID does not yet exist, primary-key uniqueness on `attempts.id` backstops duplicate creation. Read-only RPCs (`get_attempt`, `list_attempts`) are ownership-filtered and do not use row locks.

## Assets
- **Learner identity and credentials**: Supabase Auth identities (`auth.users`) and application profiles ([public.profiles](supabase/migrations/20260909000100_profiles.sql#L11)).
- **Attempt execution records**: Metadata, current snapshots, projections, and reports ([public.attempts](supabase/migrations/20260909000200_attempts.sql#L11)).
- **Append-only event audit log**: Ordered transitions, calculation traces, and state hashes ([public.attempt_events](supabase/migrations/20260909000300_attempt_events.sql#L13)).
- **Cryptographic secrets**: Server-side `SUPABASE_SECRET_KEY` and `SIMULATION_COMMIT_SECRET` ([.env.example#L5-L8](.env.example#L5-L8)).

## Actors and privileges
- **Anonymous Visitor / Guest**: No database access. All privileges on `profiles`, `attempts`, `attempt_events` revoked from `anon` ([supabase/migrations/20260909000400_grants.sql#L34](supabase/migrations/20260909000400_grants.sql#L34)). Operates purely in browser IndexedDB ([src/application/attempts/guest-repository.ts](src/application/attempts/guest-repository.ts)).
- **Authenticated Learner**: Role `authenticated`. Permitted `SELECT` on own rows only ([supabase/migrations/20260909000500_rls.sql#L50-L95](supabase/migrations/20260909000500_rls.sql#L50-L95)). `INSERT`, `UPDATE`, `DELETE` grants are explicitly revoked ([supabase/migrations/20260909000400_grants.sql#L48-L53](supabase/migrations/20260909000400_grants.sql#L48-L53)).
- **Server BFF Service**: Role `veclab_server` / `service_role`. Possesses table DML grants and `EXECUTE` privileges on RPCs ([supabase/migrations/20260909000400_grants.sql#L84-L92](supabase/migrations/20260909000400_grants.sql#L84-L92), [supabase/migrations/20260909000600_commit_event_rpc.sql#L935-L960](supabase/migrations/20260909000600_commit_event_rpc.sql#L935-L960)).
- **Administrative Roles**: Absent in MVP. The schema contains no admin, teacher, or evaluator roles ([supabase/migrations/20260909000100_profiles.sql#L7](supabase/migrations/20260909000100_profiles.sql#L7)).

## Current security controls
- **Verified Identity Resolution**: `currentLearner` validates session tokens with Supabase Auth via `getUser()` and ensures valid UUID format ([src/features/auth/session.ts#L48-L64](src/features/auth/session.ts#L48-L64)).
- **Same-Origin CSRF Defense**: `assertSameOrigin` validates HTTP `Origin` and `Referer` against expected origin on mutations ([src/app/api/_lib/guard.ts#L78-L114](src/app/api/_lib/guard.ts#L78-L114)).
- **Strict Payload Constraints**: `readJson` enforces `MAX_ACTION_BODY_BYTES` (64 KiB) limit before JSON parsing ([src/app/api/_lib/guard.ts#L127-L154](src/app/api/_lib/guard.ts#L127-L154)).
- **Private Anti-Caching Headers**: `json` helper applies `private, no-cache, no-store, max-age=0, must-revalidate` to avoid proxy caching ([src/app/api/_lib/guard.ts#L39-L58](src/app/api/_lib/guard.ts#L39-L58)).
- **Atomic Concurrency and Idempotency**: `commit_attempt_event` checks `(attempt_id, action_id)` for idempotent retry before checking revision under a row lock ([supabase/migrations/20260909000600_commit_event_rpc.sql#L119-L162](supabase/migrations/20260909000600_commit_event_rpc.sql#L119-L162)).
- **Optimistic Concurrency Protection**: RPC verifies `expected_revision = attempts.revision` under row lock; conflicts return current revision and summary ([supabase/migrations/20260909000600_commit_event_rpc.sql#L175-L182](supabase/migrations/20260909000600_commit_event_rpc.sql#L175-L182)).
- **Hard Event Ceiling**: `veclab_max_attempt_events()` caps total events per attempt at 500 ([supabase/migrations/20260909000600_commit_event_rpc.sql#L56-L66,L184-L192](supabase/migrations/20260909000600_commit_event_rpc.sql#L56-L66)).
- **Database Immutability Guard**: `attempts_immutability_guard` trigger prevents mutation of attempt owners, release IDs, initial states, and completed reports ([supabase/migrations/20260909000500_rls.sql#L112-L158](supabase/migrations/20260909000500_rls.sql#L112-L158)).
- **Information Leakage Shielding**: `parseDatabaseError` and route responders map database exceptions to generic error codes ([src/app/api/_lib/respond.ts#L30-L50](src/app/api/_lib/respond.ts#L30-L50)).

## Threat register
| Threat | Protected Asset | Entry Point | Precondition | Current Control | Evidence | Residual Risk | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Identity spoofing | Learner profile & attempts | Route handlers | Attacker supplies forged user ID | Server calls `getUser()` and validates UUID | [src/features/auth/session.ts](src/features/auth/session.ts#L48-L64) | Stolen valid session cookie | CONTROLLED |
| BOLA / IDOR | Attempt data & reports | `[attemptId]` routes & DB | Attacker guesses attempt UUID | RPC verifies `v_attempt.user_id = p_actor_user_id`; returns 404 shape; RLS read policy | [supabase/migrations/20260909000600_commit_event_rpc.sql](supabase/migrations/20260909000600_commit_event_rpc.sql#L808-L812) | BFF session context tampering | CONTROLLED |
| Direct DB mutation | Trusted simulation state | Direct PostgREST Data API | Authenticated client calls PostgREST | Column/table grants revoked (`INSERT, UPDATE, DELETE`) from `anon` & `authenticated` | [supabase/migrations/20260909000400_grants.sql](supabase/migrations/20260909000400_grants.sql#L48-L53) | Future overly broad grant | CONTROLLED |
| Service-role exposure | Secret API key (service_role access) | Browser bundle / API | Secret leaked to client | `SUPABASE_SECRET_KEY` omitted from `NEXT_PUBLIC_`; imported only in server admin client | [src/infrastructure/supabase/admin.ts](src/infrastructure/supabase/admin.ts#L13-L29) | Accidental server log dump | CONTROLLED |
| RPC privilege exposure | Mutation RPC execution | Direct PostgREST RPC call | Client calls RPC directly | Explicit `REVOKE EXECUTE ... FROM public, anon, authenticated`; granted to server only | [supabase/migrations/20260909000600_commit_event_rpc.sql](supabase/migrations/20260909000600_commit_event_rpc.sql#L908-L960) | Future unrevoked RPC | CONTROLLED |
| SECURITY DEFINER abuse | DB execution privilege | RPC call via service role | Attacker passes arbitrary arguments | Layered actor ID verification, existing-row locks (on write RPCs), and immutability triggers | [supabase/migrations/20260909000600_commit_event_rpc.sql](supabase/migrations/20260909000600_commit_event_rpc.sql#L98-L135) | Compromised BFF invokes RPC | CONTROLLED |
| Search_path hijacking | Function execution integrity | `SECURITY DEFINER` RPC | Malicious schema in search path | All privileged/server RPCs explicitly declare `SET search_path = public, pg_temp` | [supabase/migrations/20260909000600_commit_event_rpc.sql](supabase/migrations/20260909000600_commit_event_rpc.sql#L60,L99,L798) | Future migration or config drift | CONTROLLED |
| RLS bypass assumptions | Row isolation | Server-side queries | Developer assumes RLS filters service role | Architecture strictly routes mutations via explicit RPCs requiring verified actor user ID | [src/infrastructure/supabase/admin.ts](src/infrastructure/supabase/admin.ts#L8-L11) | Future ad-hoc service query | CONTROLLED |
| Idempotency replay | Event log & state order | Action retry endpoint | Network retry on completed action | Check `(attempt_id, action_id)` before revision; matching fingerprint returns existing event | [supabase/migrations/20260909000600_commit_event_rpc.sql](supabase/migrations/20260909000600_commit_event_rpc.sql#L137-L162) | Non-unique client action IDs | CONTROLLED |
| Revision races | Sequential state timeline | Concurrent action requests | Multiple tabs submit simultaneously | RPC executes `SELECT ... FOR UPDATE` and checks `expected_revision = revision` | [supabase/migrations/20260909000600_commit_event_rpc.sql](supabase/migrations/20260909000600_commit_event_rpc.sql#L121,L175-L182) | High contention lock wait | CONTROLLED |
| Post-completion mutation | Finished report integrity | Action commit after complete | Action submitted to completed run | Status check in RPC rejects non-progress attempts; trigger rejects changes to completed attempts | [supabase/migrations/20260909000500_rls.sql](supabase/migrations/20260909000500_rls.sql#L139-L148) | Attempt hard deletion | CONTROLLED |
| Malformed input / DoS | Server memory & compute | HTTP request body | Attacker sends huge payload | `MAX_ACTION_BODY_BYTES = 64 KiB` limit; Zod schema validation; 500 event DB ceiling | [src/app/api/_lib/guard.ts](src/app/api/_lib/guard.ts#L36,L127-L154) | Network-layer DDoS | PARTIALLY_CONTROLLED |
| Untrusted guest import | Cloud account attempts | Guest import endpoint | Malicious local IndexedDB payload | SPEC ONLY: Replay action inputs on server against locked release; table/route not yet implemented | [docs/system-architecture.md §8.3](docs/system-architecture.md#L495-L505) | Naive import implementation | SPEC_ONLY |
| Secret / token logging | Auth credentials | Application logs / traces | Uncaught exception or verbose logging | Structured error responder sanitizes output; calculation trace stores domain data only; logging policy prohibits secrets | [src/app/api/_lib/respond.ts](src/app/api/_lib/respond.ts#L30-L50), [docs/system-architecture.md §15](docs/system-architecture.md#L688-L703) | Accidental logging or APM capture | PARTIALLY_CONTROLLED |
| Database error leakage | Database schema details | API error responses | Database query failure | `parseDatabaseError` and route responder sanitize errors into generic codes | [src/app/api/_lib/respond.ts](src/app/api/_lib/respond.ts#L30-L50) | Dev mode 500 stack trace | CONTROLLED |

### Detailed Threat Analysis
- **T01 Identity Spoofing**:
  - *Control*: Server-side session verification via `supabase.auth.getUser()`; validates UUID format ([src/features/auth/session.ts#L48-L64](src/features/auth/session.ts#L48-L64)).
  - *Status*: `CONTROLLED`.
- **T02 BOLA / IDOR**:
  - *Control*: Lookup and mutation RPCs enforce actor ownership checks (`v_attempt.user_id = p_actor_user_id`) and return identical 404 responses for absent and unowned rows ([supabase/migrations/20260909000600_commit_event_rpc.sql#L808-L812](supabase/migrations/20260909000600_commit_event_rpc.sql#L808-L812)).
  - *Status*: `CONTROLLED`.
- **T03 Direct Database Mutation Bypass**:
  - *Control*: Browser roles have zero write permissions; all `INSERT`, `UPDATE`, `DELETE` grants revoked on user tables ([supabase/migrations/20260909000400_grants.sql#L48-L53](supabase/migrations/20260909000400_grants.sql#L48-L53)).
  - *Status*: `CONTROLLED`.
- **T04 Service-Role Exposure**:
  - *Control*: `SUPABASE_SECRET_KEY` omitted from `NEXT_PUBLIC_` env vars and restricted to server-side client factory ([src/infrastructure/supabase/admin.ts#L13-L29](src/infrastructure/supabase/admin.ts#L13-L29)), preventing leak of service_role database privileges.
  - *Status*: `CONTROLLED`.
- **T05 RPC Privilege Exposure**:
  - *Control*: Default `PUBLIC` execution privileges revoked; `EXECUTE` granted strictly to `service_role` and `veclab_server` ([supabase/migrations/20260909000600_commit_event_rpc.sql#L908-L960](supabase/migrations/20260909000600_commit_event_rpc.sql#L908-L960)).
  - *Status*: `CONTROLLED`.
- **T06 SECURITY DEFINER Abuse**:
  - *Control*: RPCs parameterize queries, enforce actor identity contracts (persisting verified actor ID on creation or checking row ownership on existing attempts), and enforce immutability triggers; write RPCs lock existing rows to serialize validation and updates ([supabase/migrations/20260909000600_commit_event_rpc.sql#L98-L135](supabase/migrations/20260909000600_commit_event_rpc.sql#L98-L135)).
  - *Status*: `CONTROLLED`.
- **T07 Search_path Hijacking**:
  - *Control*: All privileged server-facing functions explicitly declare `SET search_path = public, pg_temp` ([supabase/migrations/20260909000600_commit_event_rpc.sql#L60,L99,L798](supabase/migrations/20260909000600_commit_event_rpc.sql#L60)). The trigger `attempts_immutability_guard` is a standard `SECURITY INVOKER` function without elevated privileges ([supabase/migrations/20260909000500_rls.sql#L112-L158](supabase/migrations/20260909000500_rls.sql#L112-L158)).
  - *Status*: `CONTROLLED`.
- **T08 RLS Bypass Assumptions**:
  - *Control*: Server mutations routed through dedicated RPCs that enforce row ownership on existing attempts and persist verified actor IDs on creation ([src/infrastructure/supabase/admin.ts#L8-L11](src/infrastructure/supabase/admin.ts#L8-L11)).
  - *Status*: `CONTROLLED`.
- **T09 Idempotency Replay / Conflict**:
  - *Control*: Unique constraint on `(attempt_id, action_id)` and JCS SHA-256 fingerprint check replay stored events on duplicate requests ([supabase/migrations/20260909000600_commit_event_rpc.sql#L137-L162](supabase/migrations/20260909000600_commit_event_rpc.sql#L137-L162)).
  - *Status*: `CONTROLLED`.
- **T10 Revision Races / Concurrency**:
  - *Control*: RPC locks attempt row (`SELECT ... FOR UPDATE`) and asserts `expected_revision = attempts.revision` ([supabase/migrations/20260909000600_commit_event_rpc.sql#L121,L175-L182](supabase/migrations/20260909000600_commit_event_rpc.sql#L121)).
  - *Status*: `CONTROLLED`.
- **T11 State & Report Mutation After Completion**:
  - *Control*: Status checks in RPCs and `attempts_immutability_guard` trigger strictly reject modifications to completed runs ([supabase/migrations/20260909000500_rls.sql#L139-L148](supabase/migrations/20260909000500_rls.sql#L139-L148)).
  - *Status*: `CONTROLLED`.
- **T12 Malformed Input / DoS**:
  - *Control*: Request body size capped at 64 KiB; Zod schema validation; hard ceiling of 500 events per attempt in DB ([src/app/api/_lib/guard.ts#L36,L127-L154](src/app/api/_lib/guard.ts#L36)).
  - *Status*: `PARTIALLY_CONTROLLED`.
- **T13 Untrusted Guest Import**:
  - *Control*: SPEC ONLY: Requires server-side replay of inputs against locked release; table/route not yet implemented ([docs/system-architecture.md §8.3](docs/system-architecture.md#L495-L505)).
  - *Status*: `SPEC_ONLY`.
- **T14 Secret & Token Logging**:
  - *Control*: Implemented controls: route responders sanitize API error bodies ([src/app/api/_lib/respond.ts#L30-L50](src/app/api/_lib/respond.ts#L30-L50)) and `calculation_trace` stores only domain calculation data ([supabase/migrations/20260909000300_attempt_events.sql#L71-L72](supabase/migrations/20260909000300_attempt_events.sql#L71-L72)). Documented policy: structured logging guidelines prohibit logging passwords, JWTs, or full auth requests ([docs/system-architecture.md §15](docs/system-architecture.md#L688-L703)).
  - *Status*: `PARTIALLY_CONTROLLED`.
- **T15 Database Error Leakage**:
  - *Control*: `parseDatabaseError` and route responders sanitize errors into generic codes, preventing raw SQL leakage ([src/app/api/_lib/respond.ts#L30-L50](src/app/api/_lib/respond.ts#L30-L50)).
  - *Status*: `CONTROLLED`.

## Project-specific Supabase decisions
- **Intentional deviation from advisory guidance**: Generic Supabase advisory guidance ([.agents/skills/supabase/SKILL.md#L66-L68](.agents/skills/supabase/SKILL.md#L66-L68)) warns against `SECURITY DEFINER` and advises `SECURITY INVOKER`. VECLab intentionally uses `SECURITY DEFINER` because simulation state is calculated in TypeScript outside the database, and browser roles lack table write grants ([supabase/migrations/20260909000400_grants.sql](supabase/migrations/20260909000400_grants.sql#L13-L20)).
- **Do not convert to SECURITY INVOKER**: Server-only RPCs must NOT be converted to `SECURITY INVOKER`. The service-role caller already bypasses RLS, while `authenticated` users possess no write grants to execute table updates under their own role.
- **EXECUTE grant hardening**: PostgreSQL grants `EXECUTE` to `PUBLIC` by default. VECLab explicitly revokes `EXECUTE` from `public, anon, authenticated` on all RPCs and grants it solely to `service_role, veclab_server` ([supabase/migrations/20260909000600_commit_event_rpc.sql#L908-L960](supabase/migrations/20260909000600_commit_event_rpc.sql#L908-L960)).
- **Locking semantics across RPCs**:
  - `commit_attempt_event`: locks the attempt row via `SELECT ... FOR UPDATE` ([supabase/migrations/20260909000600_commit_event_rpc.sql#L121](supabase/migrations/20260909000600_commit_event_rpc.sql#L121)) to serialize concurrent commits and ensure linear revision increments.
  - `complete_attempt` and `stop_attempt`: lock the attempt row via their internal `commit_attempt_event` invocation ([supabase/migrations/20260909000600_commit_event_rpc.sql#L422,L529](supabase/migrations/20260909000600_commit_event_rpc.sql#L422)) to commit the final lifecycle event.
  - `create_attempt`: executes `SELECT ... FOR UPDATE` on `p_attempt_id` ([supabase/migrations/20260909000600_commit_event_rpc.sql#L330](supabase/migrations/20260909000600_commit_event_rpc.sql#L330)), which locks an existing matching row for idempotent retry; when no row exists yet, `FOR UPDATE` acquires no lock, and uniqueness of `attempts.id` remains the database backstop against duplicate insertion.
  - `branch_attempt`: locks the existing parent attempt row via `SELECT ... FOR UPDATE` ([supabase/migrations/20260909000600_commit_event_rpc.sql#L648](supabase/migrations/20260909000600_commit_event_rpc.sql#L648)) to serialize against parent state changes; the initial `SELECT ... FOR UPDATE` on `p_attempt_id` ([supabase/migrations/20260909000600_commit_event_rpc.sql#L629](supabase/migrations/20260909000600_commit_event_rpc.sql#L629)) checks for an existing branch retry but acquires no lock when the new attempt ID is absent.
  - `delete_attempt`: executes `SELECT ... FOR UPDATE` on the target attempt row ([supabase/migrations/20260909000600_commit_event_rpc.sql#L753](supabase/migrations/20260909000600_commit_event_rpc.sql#L753)) during ownership validation before cascade deletion.
  - Read RPCs (`get_attempt`, `list_attempts`): perform ownership-filtered queries and intentionally do not take row locks ([supabase/migrations/20260909000600_commit_event_rpc.sql#L803,L881](supabase/migrations/20260909000600_commit_event_rpc.sql#L803)).
- **Layered authorization contract**: `SUPABASE_SECRET_KEY` is a server-side transport credential operating with service_role privileges, not an authorization bypass. Authorization follows a layered contract: Next.js verifies the authenticated user via `supabase.auth.getUser()`, the privileged repository forwards that verified actor ID, and RPCs operating on existing attempts re-check row ownership as applicable (`v_attempt.user_id = p_actor_user_id`). For `create_attempt`, the database inserts `p_actor_user_id` into the newly created row rather than comparing it against a pre-existing attempt owner ([supabase/migrations/20260909000600_commit_event_rpc.sql#L125-L135,L354](supabase/migrations/20260909000600_commit_event_rpc.sql#L125-L135)).
- **Objective residual risks**: If the Next.js server environment is compromised, the service-role key permits calling RPCs with arbitrary actor IDs. Additionally, concurrent requests creating or branching with the exact same new attempt ID race on primary-key insertion rather than a pre-insert lock, requiring verification for concurrent duplicate handling.

## Future-state taxonomy and gaps
- **SPECIFIED_NOT_IMPLEMENTED**:
  - `guest_imports` table: Documented in [docs/data-and-state-model.md §8](docs/data-and-state-model.md#L44), but not created in any database migration.
  - Guest import service & endpoint: Documented in [docs/system-architecture.md §8.3](docs/system-architecture.md#L495-L505), but no route handler or replay import pipeline exists in `src/app/api/`.
  - pgTAP database testing harness: Documented in [docs/verification-and-acceptance.md §3](docs/verification-and-acceptance.md#L132), but current database tests use raw psql scripts ([tests/sql/00_auth_stub.sql](tests/sql/00_auth_stub.sql), [tests/sql/10_rpc_behavior.sql](tests/sql/10_rpc_behavior.sql)).
- **IMPLEMENTED_DB_NOT_WIRED_APP**:
  - Database RPCs `stop_attempt` ([supabase/migrations/20260909000600_commit_event_rpc.sql#L491](supabase/migrations/20260909000600_commit_event_rpc.sql#L491)) and `branch_attempt` ([supabase/migrations/20260909000600_commit_event_rpc.sql#L590](supabase/migrations/20260909000600_commit_event_rpc.sql#L590)) exist in PostgreSQL migrations but are not yet wired into application route handlers or repositories.
- **OUT_OF_SCOPE_MVP**:
  - Multi-role authorization (e.g. admin, teacher): Deliberately out of scope for MVP; the schema supports learners only ([supabase/migrations/20260909000100_profiles.sql#L7](supabase/migrations/20260909000100_profiles.sql#L7)). Not a specified future commitment.

## Verification checklist
- [ ] No direct write grants (`INSERT`, `UPDATE`, `DELETE`) exist for `anon` or `authenticated` on user tables ([supabase/migrations/20260909000400_grants.sql](supabase/migrations/20260909000400_grants.sql#L48-L53)).
- [ ] `EXECUTE` on all mutation RPCs is revoked from `public, anon, authenticated` ([supabase/migrations/20260909000600_commit_event_rpc.sql](supabase/migrations/20260909000600_commit_event_rpc.sql#L908-L933)).
- [ ] All privileged server-facing RPC functions declare `SET search_path = public, pg_temp` ([supabase/migrations/20260909000600_commit_event_rpc.sql](supabase/migrations/20260909000600_commit_event_rpc.sql#L60,L99)). Non-SECURITY DEFINER trigger functions (`attempts_immutability_guard`) execute as default SECURITY INVOKER without elevated privileges ([supabase/migrations/20260909000500_rls.sql#L112-L158](supabase/migrations/20260909000500_rls.sql#L112-L158)).
- [ ] Route handlers authenticate sessions via `supabase.auth.getUser()` before constructing repositories ([src/features/auth/session.ts](src/features/auth/session.ts#L48-L64)).
- [ ] `SUPABASE_SECRET_KEY` is never prefixed with `NEXT_PUBLIC_` or imported in browser code ([src/infrastructure/supabase/admin.ts](src/infrastructure/supabase/admin.ts#L13-L29)).
- [ ] Immutability trigger prevents changing attempt owners, releases, or completed snapshots ([supabase/migrations/20260909000500_rls.sql](supabase/migrations/20260909000500_rls.sql#L112-L158)).
- [ ] Automated verification suite passes without errors: `npm run verify`.

## Known unknowns
- **Edge DDoS & IP-level rate limiting**: Protection against high-frequency distributed request bursts is dependent on edge infrastructure (e.g. Vercel / Cloudflare WAF) rather than local application code.
- **pgTAP migration strategy**: Transitioning database test execution from standalone psql scripts to a pgTAP harness requires an additive migration plan without breaking existing CI.
- **Session revocation latency**: Window between credential revocation in Supabase Auth and token invalidation across active Edge/BFF requests.
