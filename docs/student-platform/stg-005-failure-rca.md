# STG-005 — Failure RCA

## Incident

The real authenticated Student Registration request on Staging was rejected with HTTP 403 before the business transaction started.

## Classification

- Severity: P1 Staging certification blocker
- Environment: Staging only
- Production impact: none observed
- Security posture during failure: fail closed
- Data integrity impact: no partial writes

## Exact failure point

`TenantEngine` resolves the trusted identity after Supabase Auth verification. Its academic-year provider requests `academic_calendars`. The Staging database does not expose that relation. The provider falls back to local mock data, which has no matching UUID for the synthetic Staging academic year. Tenant validation returns `TENANT_ISOLATION_ERROR` and the request stops before `StudentRegistrationService`.

## Evidence

1. Supabase Auth login: HTTP 200.
2. Session restoration: HTTP 200.
3. Registration request with bearer token and `Idempotency-Key`: HTTP 403.
4. Error: `TENANT_ISOLATION_ERROR`, trusted academic year invalid or missing.
5. Staging schema inspection: `academic_calendar`, `academic_years`, and `terms` exist; `academic_calendars` does not.
6. All Student Registration target tables remained empty after the rejected request.

## Safest remediation boundary

The next mission should make the smallest provider/schema compatibility correction in the tenant-context path. It must:

- use the existing approved Staging schema;
- continue deriving academic context from trusted identity and database state;
- preserve Authentication → Authorization → Tenant Validation → Business Logic order;
- retain fail-closed behavior for missing or invalid academic context;
- avoid RLS, migration, duplicate-table, request-value, or mock-data workarounds.

## Verification required after remediation

Rerun the full STG-005 matrix: basic registration, idempotent replay, idempotency conflict, duplicate detection and override, guardian scope denial, student-number override, safe rollback observations, concurrency, audit evidence, outbox evidence, cleanup, and RLS observation.

