# DB-SEC-004 — Staging RLS Reconciliation

## Mission

Reconcile the live isolated Supabase Staging database against the approved DB-SEC-003 RLS contract. Production was not accessed or modified.

Date: 2026-08-09

## Scope

The exact DB-SEC-004 target set was inspected:

`students`, `guardians`, `student_guardians`, `enrollments`, `enrollment_history`, `enrollment_transfers`, `student_academic_status`, `student_status_transitions`, `student_status_history`, `student_documents`, `student_document_versions`, `student_document_categories`, `student_document_access_log`, `audit_events`, `outbox_events`.

## DB-SEC-003 expected state vs live state

| Control | Expected | Live evidence | Classification |
|---|---:|---:|---|
| Target tables present | 15 | 15 | MATCH |
| RLS enabled | 15/15 | 15/15 | MATCH |
| FORCE ROW LEVEL SECURITY | Not required for the non-owner application role | 0/15 | MATCH |
| Policies | 46 | 46 | MATCH |
| Tables with policies | 15 | 15 | MATCH |
| Policy role | `edupro_staging_app` | All live policy role arrays contain only `edupro_staging_app` | MATCH |
| Policy context | Trusted transaction-local context | Live definitions use `current_setting('app.tenant_id'/'app.school_id'/'app.branch_id'/'app.user_id', true)` | MATCH |
| Immutable table UPDATE/DELETE grants | Denied | Denied for audit events, document versions, and access logs; DB-SEC-003 also covers the remaining immutable history classes | MATCH |
| DB migration file | Present and not rerun automatically | `supabase/migrations/202608081700_db_sec_003_rls.sql` exists | MATCH |
| Supabase migration catalog | Not defined by DB-SEC-003 | `to_regclass('supabase_migrations.schema_migrations')` returned `null` | UNKNOWN / UNTRACKED EXECUTION |

The live catalog therefore shows that the database objects are present and consistent with the DB-SEC-003 migration intent. No correction migration was applied because the live database did not prove missing or degraded RLS objects.

## Role and connection reconciliation

The database role inspection returned:

- `edupro_staging_app`: `rolsuper=false`, `rolbypassrls=false`, `rolcanlogin=true`, `rolcreaterole=false`, `rolcreatedb=false`, `rolreplication=false`.
- `postgres`: `rolsuper=false`, `rolbypassrls=true`, `rolcreaterole=true`, `rolcreatedb=true`, `rolreplication=true`.
- The only membership row involving the application role was `member=postgres`, `granted_role=edupro_staging_app`, with `set_option=false` and `inherit_option=false`. A direct `SET LOCAL ROLE edupro_staging_app` failed with PostgreSQL error `42501: permission denied to set role "edupro_staging_app"`.

Render Staging exposes `DATABASE_URL` to the service. Its non-secret connection identity is the Supabase pooler user `postgres.<project-ref>` on the Supabase pooler host and database `postgres`; `DIRECT_URL` is not present in the Render environment list. The application driver selects `DIRECT_URL || DATABASE_URL` and sets trusted `app.*` context, but repository search found no `SET ROLE`, `set_config(... role ...)`, or equivalent switch to `edupro_staging_app`.

This is an **ENV MISMATCH / EVIDENCE RECONCILIATION BLOCKER**: the RLS policies target the restricted role, while the deployed connection path does not provide evidence that requests execute as that role.

## Controlled evidence

1. SQL Editor role selection exposes only the Supabase-supported `postgres`, `anonymous`, and `authenticated` execution modes; `edupro_staging_app` is not selectable.
2. Under impersonated `authenticated` for the temporary Tenant-A user, the probe returned `current_user=authenticated`, the expected Auth UID, `students_visible=0`, and `student_b_visible=0`. This is a deny result for the wrong database role, not proof of the application-role allow path.
3. Under the administrative inspection role, the temporary fixture probe returned `current_user=postgres`, `rolbypassrls=true`, `students_visible_without_context=2`, and `tenant_b_visible_without_context=1`. This read-only result demonstrates why an administrative connection cannot be accepted as the isolation proof.
4. The temporary fixtures were deleted using explicit IDs. Final verification returned zero rows for the two synthetic tenants, schools, branches, users, students, and audit events. Both synthetic Auth users were deleted; existing performance users remained present.

## Discrepancy classification

The current live state is not a missing-RLS drift. It is a role-path/evidence mismatch:

- **Database objects:** MATCH with DB-SEC-003.
- **Migration history:** UNKNOWN / untracked because the migration catalog relation is absent.
- **Application execution identity:** BLOCKED pending proof that Render uses `edupro_staging_app` or an equivalent non-bypass role.
- **Earlier DB-SEC-003 certification documents:** historical evidence cannot be re-certified from the current SQL Editor because the restricted role is not executable there and the current Render connection role path is not proven.

## Decision

Do not rerun DB-SEC-003. Do not create a duplicate policy migration. Do not modify application code or transaction infrastructure under DB-SEC-004.

Certification remains **BLOCKED** until a controlled Staging session executed by the actual application role proves own-tenant allow, cross-tenant deny, invalid-context deny, write isolation, and immutable-table enforcement.
