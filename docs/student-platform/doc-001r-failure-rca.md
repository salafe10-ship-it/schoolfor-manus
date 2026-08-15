# DOC-001R Failure RCA

## Status

`IMPLEMENTED — CERTIFICATION BLOCKED`

The canonical Student Documents path compiled, passed local tests, and deployed successfully to Staging. CTO certification is blocked because the mandatory live validation evidence is not available in the current environment.

## Blocker 1: No Approved Live Test Identity

The required live tests need a trusted Staging identity mapped to a tenant, school, branch, academic year, and internal `users` record. No test identity or seed data was created because DOC-001R forbids seed changes and Production access. Without that identity, authenticated create/version/verify/archive/restore and cross-tenant tests cannot be executed honestly.

## Blocker 2: Transport-Level Probe Limitation

The Staging deployment is visible in Render as `Deployed`, but the available local HTTPS probe failed before reaching the application with a Windows Schannel `SEC_E_NO_CREDENTIALS` error. The in-app browser direct navigation to the staging API was also blocked by the browser client. This is an execution-environment limitation, not an application response, so it cannot be recorded as a passing 401/403/tenant test.

## Blocker 3: Existing Role Mapping Boundary

`RoleResolver.ts` contains static role permissions. The approved DOC-001A registered the six StudentDocument permissions but did not modify RoleResolver. Therefore live access for non-wildcard roles such as `student_affairs` and `auditor` requires a separately approved role-mapping mission. DOC-001R forbids modifying the certified authorization package, so no role mapping workaround was introduced.

## Evidence Already Passed

- TypeScript: PASS.
- Vitest: PASS, 23 files and 131 tests.
- Vite production build: PASS.
- Server bundle: PASS.
- `git diff --check`: PASS.
- Static tenant/audit review: PASS.
- Simulated commit failure: rollback PASS.
- Render Staging deploy: PASS, commit `1e7539d`, 18.0 seconds.
- Production: untouched.

## Safest Resolution

Issue a bounded CTO follow-up to provide an approved Staging test identity and authorize the required role-mapping decision (or explicitly certify testing with a wildcard role). Then rerun only the required live security, tenant, transaction, idempotency, immutable-version, legal-hold, and cleanup checks.

No source, schema, RLS, RPC, or Production workaround was applied.
