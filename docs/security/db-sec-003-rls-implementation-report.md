# DB-SEC-003 — RLS Implementation Report

## Mission

Apply database-level tenant isolation to the Student Affairs and platform event tables on the isolated Staging project only. Production was not modified.

## Migration

- File: `supabase/migrations/202608081700_db_sec_003_rls.sql`
- Scope: one additive, immutable migration; no tables, functions, triggers, views, seed data, or RPC were introduced.
- Target role: `edupro_staging_app` only.

## Tables and policy coverage

RLS is enabled on all 15 approved tables:

`students`, `guardians`, `student_guardians`, `enrollments`, `enrollment_history`, `enrollment_transfers`, `student_academic_status`, `student_status_transitions`, `student_status_history`, `student_documents`, `student_document_versions`, `student_document_categories`, `student_document_access_log`, `audit_events`, `outbox_events`.

The migration creates 46 table-specific policies. Policies are scoped to the application role and use transaction-local trusted settings (`app.tenant_id`, `app.school_id`, `app.branch_id`, `app.user_id`) plus existing tenant, school, branch, user, student, enrollment, and document relationships. Client request values are not used as the source of tenant identity.

## Write protection

- Immutable history and audit tables are granted `SELECT, INSERT` only and have no update/delete policy: `enrollment_history`, `student_status_history`, `student_document_versions`, `student_document_access_log`, and `audit_events`.
- `student_documents`, `student_document_categories`, and the approved mutable operational tables have only the minimum grants and policies required by their lifecycle.
- Cross-tenant and invalid-context rows fail the `USING`/`WITH CHECK` predicates.
- The application role is not a superuser, does not bypass RLS, has no database/role creation privilege, has no memberships, and is not owner of the target tables.
- Table owners remain `postgres`; `FORCE ROW LEVEL SECURITY` is not required for the non-owner application role and was intentionally not added to avoid changing owner-side operational behavior.

## Validation outcome

- RLS enabled: 15/15.
- Policies: 46/46.
- Broad-role policies: 0.
- Immutable table update/delete grants: denied for all five immutable classes.
- Corrected policy predicates were applied and verified on Staging.
- Synthetic DB-SEC-003 fixtures were removed; post-cleanup counts for test tenants, test Auth users, and test students are all zero.
- Production: untouched.

## Rollback

Rollback is limited to the Staging migration by dropping the `p_dbsec003_*` policies and reverting the role grants/revokes. No historical migration was edited. Any rollback requires CTO approval because it would intentionally remove database isolation.

## Status

Security isolation is certified by the hostile matrix on Staging. End-to-end latency remains an environment-level verification item documented separately; database execution latency passed its budget.
