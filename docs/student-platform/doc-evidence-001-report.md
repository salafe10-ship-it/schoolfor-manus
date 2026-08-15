# DOC-EVIDENCE-001 Operations Evidence Report

## Mission

Synthetic Fixture + Read-only Evidence Capability — Staging only.

## Final decision

`DOC-004 = PARTIALLY CERTIFIED / EVIDENCE BLOCKED`

The approved Operations channel required to create isolated synthetic fixtures and observe the resulting database rows was not available in the current execution context. The mission therefore stopped at the first CTO stop condition. No application, schema, RLS, role, authentication, or production change was made.

## Environment verification

| Item | Evidence | Result |
| --- | --- | --- |
| Render service | `edupro-school-erp-staging` | PASS |
| Render environment | Staging | PASS |
| Render branch | `codex/sop-001-staging` | PASS |
| Latest deployed commit | `e4af819` — DOC-003 | PASS |
| Authenticated school route | `PERF003 Test School`, isolated banner | PASS |
| Student Affairs route | Available in the authenticated Staging UI | PASS |
| Production access | Not used | PASS |

## Operations capability assessment

| Required capability | Available safely in this mission | Result |
| --- | --- | --- |
| Create temporary Tenant fixture | No approved operation channel | BLOCKED |
| Create School/Branch/Academic Year/Term fixtures | No approved operation channel | BLOCKED |
| Create temporary App User/Auth User and assignment | No approved operation channel | BLOCKED |
| Create temporary Student/Category fixtures | No approved operation channel | BLOCKED |
| Execute live DOC-004 mutations under synthetic identity | Cannot execute safely | BLOCKED |
| Read only required database rows after mutations | No approved read-only database channel | BLOCKED |
| Prove audit/outbox rows | No approved read-only database channel | BLOCKED |
| Delete only task fixtures | Fixtures were not created | NOT APPLICABLE |
| Prove zero residual fixture rows | No database observation channel | BLOCKED |

## Fixture inventory

No fixtures were created by this mission.

| Fixture type | Created by mission | Cleanup required |
| --- | ---: | --- |
| Test tenants | 0 | None |
| Test schools | 0 | None |
| Test branches | 0 | None |
| Test academic years/terms | 0 | None |
| Test users/auth users | 0 | None |
| Test students | 0 | None |
| Test categories | 0 | None |
| Test documents | 0 | None |
| Test versions | 0 | None |
| Test access logs | 0 | None |
| Test audit rows | 0 | None |
| Test outbox rows | 0 | None |

The values above mean “created by this mission”, not a claim about total database contents. Existing Staging records were not used or altered.

## Prohibited alternatives not used

- No `postgres` role.
- No `service_role` key.
- No `SET ROLE`.
- No SQL Editor execution.
- No browser token extraction.
- No RLS bypass.
- No direct database connection string.
- No Render Shell database operation.
- No existing school/student data used as synthetic fixtures.

## Connection Identity

`CONNECTION IDENTITY = EVIDENCE BLOCKED`

The mission did not reopen `PLATFORM-EVIDENCE-001` and did not attempt to prove `current_user`, `session_user`, `rolsuper`, or `rolbypassrls` through an unapproved path.

## Required next capability

CTO/Operations must provide a narrowly scoped Staging-only capability that can:

1. Create uniquely tagged synthetic fixtures.
2. Run the existing application flow under approved test identities.
3. Read only the required post-operation rows.
4. Delete only the tagged fixtures.
5. Prove zero residual tagged rows.

The capability must not grant Production, `postgres`, `service_role`, token extraction, RLS bypass, schema changes, or role changes.

## Status

`DOC-EVIDENCE-001 = BLOCKED AT SAFE OPERATIONS CAPABILITY`

This is an evidence availability limitation, not proof of a Student Documents security failure.
