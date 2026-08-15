# DB-SEC-001 — Engineering Validation Report

## 1. Mission summary

This Staging-only mission audited database-level tenant isolation for the Student Platform and its audit/outbox paths. The review was inspection-only. No Production access, SQL migration, RLS policy, function, role change, or schema change was performed.

## 2. Evidence collected

### Connection identity

| Check | Result |
|---|---|
| Current user | `postgres` |
| Session user | `postgres` |
| Database owner | `postgres` |
| Superuser | `false` |
| `BYPASSRLS` | `true` |
| Database | `postgres` |
| Schema | `public` |

### Catalog state

The reviewed target tables were present and their tenant/school/branch/student/actor ownership columns and composite relationship constraints were inspected. All target tables had RLS disabled, force-RLS disabled, owner `postgres`, and zero policies in `pg_policies`.

### Application path

`server/infrastructure/PostgresTransactionDriver.ts` obtains the transaction pool from `DIRECT_URL || DATABASE_URL`. This confirms that the Render application database path is the path whose role must be restricted before RLS can be treated as an enforcement boundary.

## 3. Findings

| Finding | Severity | Impact | Status |
|---|---|---|---|
| Actual application role has `rolbypassrls = true` | P0 | Any RLS policy would be bypassable by the application connection | VERIFIED-P0 |
| Target tables have no RLS enabled | P0 | Database cannot independently block cross-tenant reads/writes | VERIFIED-P0 |
| Target tables have zero policies | P0 | No database-level tenant, school, branch or actor enforcement | VERIFIED-P0 |
| Owner role is used by the application path | P0 | Least-privilege and RLS certification gates fail | VERIFIED-P0 |

## 4. Validation outcome

- Static ownership and relationship inspection: **COMPLETE**.
- Actual role privilege inspection: **COMPLETE**.
- RLS catalog inspection: **COMPLETE**.
- Hostile cross-tenant RLS tests: **NOT EXECUTED** because the current role bypasses RLS and policies are absent; executing them would produce misleading evidence.
- RLS regression suite: **NOT EXECUTED** because no enforceable policy exists.
- Performance certification: **NOT CERTIFIED**; p95 measurements under an enforced restricted role are still required.

## 5. Stop-condition assessment

The mission stop condition is met: the actual application role cannot enforce RLS. Applying a policy migration now would create false confidence. A security-definer function or invented session-context mechanism was not added.

## 6. Required next mission

Provision and verify a dedicated Staging application role with `rolbypassrls = false`, not owned by the database, and with least-privilege grants. Approve and document the trusted server-controlled tenant context. Then apply a narrow new RLS migration and execute the full hostile test matrix using the actual Render role. Production remains blocked until the same controls are independently verified there.

## 7. Final decision

**DATABASE-LEVEL TENANT ISOLATION CERTIFIED ON STAGING: NO**

**Mission status: BLOCKED — RLS enforcement is not possible with the actual application role.**
