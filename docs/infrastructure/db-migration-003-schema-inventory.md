# DB-MIGRATION-003 — Staging Schema Inventory

## Scope and Method

- Target: Supabase Staging project `vjcjscqgmijgzagshsca`.
- Method: official Supabase CLI `inspect db table-stats` and `inspect db index-stats`.
- Access mode: read-only.
- No SQL Editor, reset, DDL, DML, service role, or direct workaround was used.

## Inventory Summary

| Object class | Count | Evidence |
|---|---:|---|
| Public tables | 47 | `inspect db table-stats` |
| Non-public tables | 3 | `inf001a_* .records` auxiliary test schemas |
| Total inspected tables | 50 | `inspect db table-stats` |
| Public indexes | 264 | `inspect db index-stats` |
| Non-public indexes | 6 | Auxiliary test schemas |
| Total inspected indexes | 270 | `inspect db index-stats` |
| Estimated public rows | 14 | `inspect db table-stats` |

## Public Tables Observed

`academic_calendar`, `academic_years`, `api_keys`, `audit_access_events`,
`audit_change_sets`, `audit_events`, `branches`, `enrollment_history`,
`enrollment_transfers`, `enrollments`, `facilities`, `feature_flags`,
`guardian_contact_preferences`, `guardian_verifications`, `guardians`,
`notification_queue`, `notification_templates`, `outbox_events`, `permissions`,
`role_permissions`, `roles`, `school_settings`, `schools`, `service_accounts`,
`sessions`, `setting_definitions`, `setting_values`, `student_academic_status`,
`student_document_access_log`, `student_document_categories`,
`student_document_versions`, `student_documents`, `student_guardians`,
`student_status_history`, `student_status_transitions`, `students`,
`subscriptions`, `system_jobs`, `terms`, `tenants`, `trusted_sessions`,
`user_roles`, `users`, `workflow_definitions`, `workflow_instances`,
`workflow_tasks`, `workflow_versions`.

## Auxiliary Non-Public Tables

- `inf001a_a4332a0fcf284e6cbdf705e25b49f465.records`
- `inf001a_733277a747bf4fa48d1c1672efa2d644.records`
- `inf001a_b038c49c91ab4cfb87f67d89e0e50166.records`

Each auxiliary table had an estimated three rows and was not present in the ten approved migration files.

## Evidence Limits

The CLI schema diff path attempted to provision a local Shadow Database and stopped because Docker Desktop is unavailable. Therefore this inventory confirms object presence and operational index metadata only; it does not certify column definitions, constraints, policies, grants, triggers, functions, or RLS semantics.
