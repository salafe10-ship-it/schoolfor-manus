# DOC-006 — Student Documents E2E Readiness Report

## Executive Decision

**DOC-006 = READY FOR LIVE CERTIFICATION**

Student Documents is ready to enter live certification when the approved Operations Evidence Capability becomes available. This is not a declaration that live database, RLS, or cross-tenant evidence has already passed.

## Scope

Reviewed only:

- `src/modules/student-documents/**`
- `src/components/**StudentDocument*`
- Student Documents tests
- Student Documents routes in `server.ts`
- DOC-005 security and validation contracts

No changes were made to authentication, authorization infrastructure, TenantEngine, UnitOfWork general, RLS, migrations, schema, database roles, or Production.

## Code-Level Findings

### PASS

- Canonical API routes authenticate the request and require the registered StudentDocument permission before the service is invoked.
- Tenant, school, branch, actor, request, correlation, timestamp, audit, and outbox metadata are resolved from trusted server context or server-generated values.
- Repository updates reassert trusted tenant, school, and branch predicates instead of relying on client values.
- Lifecycle decisions reject illegal source states and require a reason.
- Legal hold and retention rules prevent unsafe archive/expiry operations.
- Version creation preserves the required verification lifecycle and does not expose historical mutation through the canonical service.
- Business write, audit and outbox operations remain inside the service transaction boundary.
- Idempotency keys are namespaced by operation and resource.
- UI error handling now distinguishes session expiry, permission denial, validation, conflict, and transient server failure.
- The legacy fallback repository is not used by the canonical Student Documents portal/API path; its remaining use is explicitly documented as outside this mission.

### EVIDENCE BLOCKED

- Live database table and constraint behavior.
- Live RLS enforcement.
- Live cross-tenant, cross-school, and cross-branch read/update/delete attempts.
- Live rollback, audit, outbox, cleanup, and historical-version immutability observation.
- Live staging connection and post-test isolation.

## Changes Made During DOC-006

One contract-level UI defect was corrected within the allowed Student Documents scope:

1. Added centralized user-facing mapping for `401`, `403`, `409`, `400/422`, and `5xx` responses.
2. Removed the silent category-load failure for `403`.
3. Added a regression test proving that a stale document detail conflict is shown as a recoverable alert.

No central security or persistence component was modified.

## Validation Evidence

| Check | Result |
|---|---|
| TypeScript | PASS — `tsc --noEmit` |
| Focused Student Documents tests | PASS — 3 files / 14 tests |
| Full Vitest suite | PASS — 29 files / 156 tests |
| Vite production build | PASS — 3,049 modules transformed |
| Server bundle | PASS — `dist/server.cjs` 1.2MB; 4 existing `import.meta`/CJS warnings |
| Static API/route review | PASS |
| UI state review | PASS — loading, success, empty, 401, 403, 409, validation, 5xx/retry-oriented states |
| Legacy path sweep | PASS — canonical path clear; legacy readers documented and not deleted |
| `git diff --check` | PASS for source/report diff; only normal LF/CRLF notices remain |
| Live DB/RLS/cross-tenant evidence | EVIDENCE BLOCKED by Operations gate |
| Production execution | NOT RUN — forbidden by mission |

## Remaining Risks and Dependencies

1. Live certification cannot be completed until Operations Evidence Capability is officially opened.
2. The legacy `FallbackStorage` document readers remain in unrelated student lifecycle and certification paths. Removing them requires a separately approved migration/legacy-retirement mission.
3. The current contract returns the original stored result for a reused idempotency key within its namespace; a conflicting payload fingerprint policy is not part of DOC-006.
4. Existing build warnings about large chunks and `PostingEngine` import mode remain outside DOC-006 and do not block this package’s code-level certification.

## Required Next Live Certification Inputs

When approved, the live mission must provide only the official Operations capability and must prove, with real evidence:

- authenticated 401/403 behavior;
- tenant, school, and branch isolation;
- RLS enforcement;
- audit and outbox atomicity;
- rollback after partial failure;
- historical version immutability;
- idempotent retry and cleanup;
- no residual cross-tenant state after test completion.

Until then, all live rows in the certification matrix remain `EVIDENCE BLOCKED`.

## Final Status

`DOC-006 = READY FOR LIVE CERTIFICATION`

`DOC-003 = PASS`

`DOC-004 = PARTIAL / EVIDENCE BLOCKED`

`DOC-005 = ACCEPTED / PASS`

`DOC-006 = READY FOR LIVE CERTIFICATION`
