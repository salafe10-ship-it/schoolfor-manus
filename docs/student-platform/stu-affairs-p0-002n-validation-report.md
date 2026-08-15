# STU-AFFAIRS-P0-002N — Validation Report

## Mission result

**STOP + SECURITY DECISION REQUIRED**

This mission produced a design/decision package only. No source, migration, schema, RLS policy, database, API, UI, permission, or Production artifact was modified.

## Static inspection performed

- Reviewed `src/middleware/trustedAuthentication.ts` for Auth verification, `app_metadata`, disabled-user handling, and editable metadata boundaries.
- Reviewed `server.ts` authentication middleware for bearer-token verification and rejection of mismatched client school targets.
- Reviewed `src/middleware/tenantValidation.ts` and `src/tenant/TenantEngine.ts` for trusted context construction and request-target validation.
- Reviewed `src/authorization/RoleResolver.ts`, `src/authorization/DatabaseRolePermissionSource.ts`, and authorization middleware for database role resolution and fail-closed behavior.
- Reviewed `src/database/UnitOfWork.ts`, `src/database/transactions/TransactionContracts.ts`, and `server/infrastructure/PostgresTransactionDriver.ts` for transaction scope, `set_config(..., true)`, commit/rollback, and pool release.
- Reviewed `supabase/migrations/202608081700_db_sec_003_rls.sql` and `docs/security/db-sec-004-staging-rls-reconciliation.md` for current RLS mechanism, table coverage, and the unresolved application-role mismatch.

## Decision checks

| Check | Result | Reason |
|---|---|---|
| Trusted Auth source identified | PASS design-wise | Supabase Auth user is re-read; security claims use `app_metadata` |
| Client-controlled tenant rejected | PASS in current middleware path | Mismatching request targets are rejected and audited; future TransferOperation must preserve this rule |
| Fail-closed path defined | PASS design-wise | Missing/invalid identity and context deny |
| Request-scoped transaction shape | PASS design-wise | `BEGIN` → transaction-local context → work → COMMIT/ROLLBACK → release |
| Pool leakage proven live | NOT PROVEN | Requires controlled concurrent application-role evidence |
| Canonical non-bypass DB role proven | FAIL / BLOCKED | DB-SEC-004 records a PostgreSQL pooler identity and no proven switch to `edupro_staging_app` |
| Current RLS covers TransferOperation | FAIL | The table and policy do not exist yet |
| `FORCE RLS` decision | OPEN SECURITY GATE | Current evidence does not prove owner/BYPASSRLS exclusion for the future object |
| Retention durations | OPEN EXTERNAL DECISION | Operations/Product must define windows; no number was invented |
| Live RLS certification | NOT CLAIMED | This mission is design-only |
| Production certification | NOT CLAIMED | Production is out of scope |

## Required next evidence before P0-002O

- actual application connection identity and role attributes;
- proof of non-owner and non-`BYPASSRLS` execution;
- two-tenant read/write denial tests using the real application path;
- missing, forged, stale, and reused transaction-context tests;
- approved `FORCE RLS` decision;
- Operations/Product retention and purge-authority decision;
- Security approval of the claim/reconcile/purge boundaries.

## Integrity checks

- No secrets or tokens were read or included.
- No SQL was executed.
- No database or RLS mutation was performed.
- `git diff --check`: run after document creation; pre-existing CRLF warnings remain outside this package.

## Certification boundary

The package is ready for CTO review as a decision document. It is not permission to create `TransferOperation`, write a migration, change RLS, or reopen `PLATFORM-EVIDENCE-002`.
