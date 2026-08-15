# DB-SEC-003 — Hostile Isolation Test Report

## Environment

Tests ran against the isolated Staging Supabase project using the restricted application role and transaction-local context. Production was not contacted or changed.

## Final hostile matrix

| Check | Expected | Result |
|---|---|---|
| Own student read | Allowed | PASS |
| Own guardian read | Allowed | PASS (one fixture row; the extra attempted insert was rolled back) |
| Own enrollment read | Allowed | PASS |
| Own transfer read | Allowed | PASS |
| Cross-tenant student read | Blocked/0 rows | PASS |
| Cross-branch read | Blocked/0 rows | PASS |
| Own student insert | Allowed | PASS |
| Own student update | Allowed | PASS |
| Cross-tenant student insert | Blocked | PASS |
| Cross-tenant student update | Blocked/0 rows | PASS |
| Cross-tenant student delete | Blocked/0 rows | PASS |
| Tenant reassignment on update | Blocked | PASS |
| Cross-tenant guardian insert | Blocked | PASS |
| Cross-tenant enrollment insert | Blocked | PASS |
| Cross-tenant transfer insert | Blocked | PASS |
| Cross-tenant status insert | Blocked | PASS |
| Cross-tenant transition insert | Blocked | PASS |
| Cross-tenant document insert | Blocked | PASS |
| Cross-tenant document version insert | Blocked | PASS |
| Cross-tenant access-log insert | Blocked | PASS |
| Cross-tenant audit insert | Blocked | PASS |
| Cross-tenant outbox insert | Blocked | PASS |
| Missing-context read | 0 rows | PASS |
| Missing-context write | Blocked | PASS |
| Invalid tenant context read | 0 rows | PASS |
| Invalid branch context read | 0 rows | PASS |
| Immutable audit update | Permission denied | PASS |
| Immutable audit delete | Permission denied | PASS |
| Immutable history update | Permission denied | PASS |
| Immutable history delete | Permission denied | PASS |
| Cross-tenant outbox update | Blocked/0 rows | PASS |
| Tenant B own read | Allowed | PASS |
| Tenant B cross-tenant read | Blocked/0 rows | PASS |

The matrix contains 33 checks. RLS denial errors are expected security outcomes, not test failures. A prior test expectation of two guardians was corrected to one because the extra insert was intentionally rolled back.

## Connection reuse and concurrency

Two restricted clients were exercised with separate tenant contexts and the same pooled infrastructure:

```json
{"status":"PASS","checks":{"concurrentA":2,"concurrentB":1,"afterRollbackMissing":0,"reusedAsB":1}}
```

This confirms no tenant context leaked across concurrent or reused transactions.

## Cleanup

Synthetic fixtures were deleted in dependency order. Verification returned:

```text
tenants_left=0, auth_users_left=0, students_left=0
```

## Certification

`DATABASE-LEVEL TENANT ISOLATION CERTIFIED ON STAGING`

`RLS: CERTIFIED ON STAGING`
