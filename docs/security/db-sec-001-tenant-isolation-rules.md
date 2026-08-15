# DB-SEC-001 — Tenant Isolation Rules

## Scope and decision

This document records the Staging-only security review for the Student Platform tables. No Production connection was used and no schema or policy was changed during this mission.

**Decision: NOT CERTIFIED.** Database-level tenant isolation cannot be certified until the actual Render transaction role is replaced with a restricted application role that has `rolbypassrls = false` and is not the database owner.

## Direct evidence

- Staging `current_user`: `postgres`.
- Staging `session_user`: `postgres`.
- Database owner: `postgres`.
- `rolsuper`: `false`.
- `rolbypassrls`: `true`.
- The application transaction driver in `server/infrastructure/PostgresTransactionDriver.ts` creates its pool from `DIRECT_URL || DATABASE_URL`.
- The observed Render/Staging transaction identity therefore has RLS bypass capability.
- All reviewed target tables report `relrowsecurity = false`, `relforcerowsecurity = false`, owner `postgres`, and zero entries in `pg_policies`.

Because a role with `BYPASSRLS` is not constrained by row-level policies, enabling policies without first changing the application role would not satisfy the mission's hostile-access criteria.

## Ownership matrix

| Table group | Tables | Required trusted ownership key | Relationship controls required | Current state |
|---|---|---|---|---|
| Student root | `students` | `tenant_id`, `school_id`, optional `branch_id` | Tenant, school and branch composite references; actor references | RLS absent; not certified |
| Guardian root | `guardians` | `tenant_id`, `school_id`, optional `branch_id` | Tenant/school/branch composite references | RLS absent; not certified |
| Student/guardian link | `student_guardians` | `tenant_id`, `school_id`, optional `branch_id`, `student_id` | Student and guardian same-tenant/school scope | RLS absent; not certified |
| Enrollment | `enrollments`, `enrollment_history`, `enrollment_transfers` | `tenant_id`, `school_id`, `branch_id`, `student_id` | Student, academic-year, term, branch and actor scope | RLS absent; not certified |
| Academic status | `student_academic_status`, `student_status_transitions`, `student_status_history` | `tenant_id`, `school_id`, `branch_id`, `student_id` | Student, transition, approval and actor scope | RLS absent; not certified |
| Documents | `student_documents`, `student_document_versions`, `student_document_categories`, `student_document_access_log` | `tenant_id`; student-bearing rows also require school/branch/student scope | Document/category/version/student and actor scope | RLS absent; not certified |
| Audit | `audit_events` | `tenant_id`, optional `school_id`, `branch_id`, `actor_user_id` | Actor, change-set, school and branch scope; append-only policy | RLS absent; not certified |
| Outbox | `outbox_events` | `tenant_id` | Tenant-scoped queue access; no client mutation/read of foreign tenants | RLS absent; not certified |

## Required policy contract for the next approved mission

The next implementation must establish all of the following before policy certification:

1. Render's transaction pool uses a dedicated login role that is not owner, has `rolbypassrls = false`, and has only the required table/schema privileges.
2. Tenant, school, branch and actor context is supplied through a documented trusted server-controlled mechanism. Arbitrary request body, query, header, local storage, or client JWT fields must not be used as authority.
3. Every target table has explicit `SELECT`, `INSERT`, `UPDATE`, and `DELETE` behavior. Audit and immutable history tables must deny update/delete to normal application roles.
4. `USING` and `WITH CHECK` enforce tenant scope, school scope, branch scope, and relationship scope. Updates must prevent reassignment of ownership keys.
5. Audit actor fields and outbox ownership cannot be forged by a normal client role.
6. The hostile test matrix is executed using the actual application role and a separately controlled authorized server path; owner/superuser access cannot be used as evidence.

No security-definer function or new trusted-context mechanism is introduced by this mission. Introducing one requires a separate CTO-approved design and review.

## Certification gate

The database-level gate remains closed until the restricted role and trusted context are provisioned, policies are applied in a narrow new migration, and the hostile tests pass. Historical migrations remain immutable.
