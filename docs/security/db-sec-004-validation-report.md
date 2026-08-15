# DB-SEC-004 — Staging Validation Report

## Status

**IMPLEMENTED — CERTIFICATION BLOCKED**

Inspection and controlled probes completed on isolated Staging only. No Production action occurred. No application or migration files were modified.

## Validation matrix

| Validation | Result | Evidence |
|---|---|---|
| All 15 target tables exist | PASS | Live `pg_class` catalog count = 15 |
| RLS enabled on all targets | PASS | `relrowsecurity = 15/15` |
| No forced-RLS drift | PASS | `relforcerowsecurity = 0/15`, matching DB-SEC-003 contract |
| Policy count and coverage | PASS | 46 policies across 15 tables |
| Policy role restriction | PASS | `pg_policies.roles` contains only `edupro_staging_app` |
| Trusted tenant/school/branch/user predicates | PASS | Live definitions use transaction-local `current_setting('app.*', true)` |
| Restricted role non-bypass attributes | PASS | `edupro_staging_app`: non-superuser, no bypass, no create-role/create-db/replication |
| Restricted role execution | BLOCKED | `SET LOCAL ROLE edupro_staging_app` returned PostgreSQL `42501` |
| Authenticated-role read probe | PASS as deny-only probe | `current_user=authenticated`, Auth UID present, visible rows = 0; this is not the application-role allow-path test |
| Administrative bypass probe | SECURITY WARNING | `current_user=postgres`, `rolbypassrls=true`, no-context read saw both temporary fixture rows |
| Missing/invalid context under actual app role | BLOCKED | Actual app role could not be selected or executed |
| Cross-tenant read/insert/update/delete under actual app role | BLOCKED | Actual app role could not be selected or executed |
| Cross-branch access under actual app role | BLOCKED | Actual app role could not be selected or executed |
| Tenant spoofing under actual app role | BLOCKED | Actual app role could not be selected or executed |
| Immutable updates/deletes | PARTIAL PASS | Grants denied for audit events, document versions, and access logs; executing all hostile statements as the actual app role remained blocked |
| Fixture cleanup | PASS | Explicit-ID cleanup returned zero for all synthetic DB rows; both synthetic Auth users absent |
| Migration history | UNKNOWN | `supabase_migrations.schema_migrations` is absent; migration file exists locally |

## Live object counts

```json
{
  "target_tables": 15,
  "rls_enabled": 15,
  "force_rls": 0,
  "policy_count": 46,
  "policy_tables": 15,
  "policy_roles": [["edupro_staging_app"]],
  "migration_catalog": null,
  "immutable_privileges": {
    "audit_update": false,
    "audit_delete": false,
    "doc_version_update": false,
    "doc_version_delete": false,
    "access_log_update": false,
    "access_log_delete": false
  }
}
```

## Security conclusion

The database policy layer is present and narrow, but the release gate is not satisfied. A policy set that targets `edupro_staging_app` cannot certify the deployed service until the service's connection role is proven to be that non-bypass role. Render currently exposes only `DATABASE_URL`; the application connection driver uses that URL and contains no role switch. The Supabase SQL Editor cannot execute the custom role because its membership has `set_option=false`.

## Required next gate

The CTO must approve a separate environment/connection remediation that does not use a superuser or `BYPASSRLS` connection. After that remediation, rerun the hostile matrix with the real application role and retain the successful allow/deny evidence. DB-SEC-004 itself made no such remediation because the order forbids modifying the transaction infrastructure.

## Production impact

None. Production was not opened, queried, modified, or redeployed.
