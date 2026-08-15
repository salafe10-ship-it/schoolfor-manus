# CONN-SEC-003A — Validation Report

## Mission

Narrow Staging-only remediation to expose the existing connection-identity diagnostic invocation without changing its backend endpoint or database behavior.

## Files modified

- `src/components/SystemHealthCenter.tsx` — initialized the exact Staging-host gate synchronously and added stable diagnostic selectors for the existing temporary control.
- `docs/security/conn-sec-003a-diagnostic-invocation.md` — documented the temporary control and cleanup boundary.
- `docs/security/conn-sec-003a-validation-report.md` — this report.

## Forbidden areas preserved

No endpoint, SQL, RPC, migration, RLS policy, PostgreSQL role, UnitOfWork, PostgresTransactionDriver, TenantEngine, AuthorizationEngine, RoleResolver, Production environment, secret, token, or connection string was modified or exposed.

## Validation status

Local validation completed successfully:

- TypeScript: PASS.
- Focused diagnostic contract tests: PASS — 2 files, 7 tests.
- Full Vitest suite: PASS — 28 files, 148 tests.
- Vite production build: PASS.
- Server bundle: PASS; four pre-existing `import.meta`/CommonJS warnings only.
- `git diff --check`: PASS.

The first Staging deployment (`193472d`) completed successfully in Render and was marked Live. The post-deployment Staging page did not expose the diagnostic control (`diagnosticSectionCount = 0`, `diagnosticButtonCount = 0`) on the canonical hostname. The host-gate calculation was then simplified in the same approved UI file and deployed as `3e0ef3f`; Render also marked that deployment Live. A fresh post-deployment check still returned `diagnosticSectionCount = 0` and `diagnosticButtonCount = 0`.

Therefore the approved UI remediation did not produce an observable live control. The root cause is now a deployment/runtime surface mismatch or a different live UI source than the reviewed component. Resolving that mismatch requires a separate CTO-approved investigation; adding another endpoint, bypass, or broader UI change is outside this mission.

## Decision

`CONN-SEC-003A = BLOCKED`.

No authenticated connection identity evidence was claimed. `CONN-SEC-003` must remain blocked. No RLS, immutability, AUTH-004, or SOP-001 live certification may proceed.

## Required evidence

- Login and Dashboard load on Staging.
- Diagnostic control visible on Staging.
- Authenticated invocation of the existing endpoint.
- `current_user = edupro_staging_app`.
- `session_user = edupro_staging_app`.
- `rolsuper = false`.
- `rolbypassrls = false`.
- Unauthenticated invocation returns `401`.
- No client-supplied school, tenant, branch, or role value affects connection identity.
- Cleanup removes the temporary control after CONN-SEC-003 evidence is captured.
