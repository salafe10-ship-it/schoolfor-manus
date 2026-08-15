# DB-SEC-002 — Staging Application Role Report

## Decision

**STAGING APPLICATION SECURITY IDENTITY CERTIFIED FOR RLS VALIDATION**

This is not an RLS certification. RLS remains pending for DB-SEC-003.

## Scope

Staging only. Production was not accessed, read, or modified. No database schema, RLS policy, RPC, or function was added.

## Role validation

| Gate | Result | Evidence |
|---|---|---|
| Dedicated application role | PASS | `edupro_staging_app` exists and accepts the direct PostgreSQL connection |
| Superuser | PASS | `rolsuper = false` |
| BYPASSRLS | PASS | `rolbypassrls = false` |
| Createdb | PASS | `rolcreatedb = false`; database CREATE privilege is false |
| Createrole | PASS | `rolcreaterole = false` |
| Inheritance | PASS | `rolinherit = true`; no administrative role membership |
| Ownership | PASS | Reviewed protected/reference tables remain owned by `postgres`; application role owns none |
| Schema creation | PASS | `has_schema_privilege(..., 'public', 'CREATE') = false`; forbidden DDL returned permission denied |
| Least privilege | PASS | Explicit table grants only; no blanket `GRANT ALL` |
| Application connection | PASS | Render Staging started with the restricted role and reported the transaction driver configured and the service live |
| Production impact | PASS | None |

## Staging runtime configuration

Render Staging `DATABASE_URL` was updated to the restricted role connection and redeployed. No `DIRECT_URL` variable was present in the Staging service, so the existing driver resolves `DATABASE_URL`. The credential was generated and handled only in memory/Render secret configuration; it is not in Git, code, logs, or this report.

## Live security checks

- Role connection identity: `edupro_staging_app`.
- Database CREATE: denied.
- Public schema CREATE: denied.
- Target table ownership alteration is unavailable to the role.
- Audit UPDATE and DELETE privileges: denied.
- Transaction-local context survived inside a transaction and cleared after COMMIT.
- Transaction-local context survived inside a transaction and cleared after ROLLBACK.
- Two concurrent role connections observed independent tenant values (`tenant-a` and `tenant-b`).
- Render Staging authenticated login returned HTTP 200 after the corrected trusted fixture was provisioned.
- Render Staging Student Registration returned HTTP 201 through commit `92134b9`; the transaction driver connected with the restricted role and persisted the expected Student Platform aggregate rows.
- The temporary Auth, tenant, school, branch, academic-year, term, application-user, role, permission, business, audit, and outbox fixtures were removed and verified at zero.

## Limitations

RLS policies are not installed and hostile cross-tenant RLS tests are intentionally deferred to DB-SEC-003. The role's permissions are a prerequisite for that mission, not proof that policies already enforce isolation.
