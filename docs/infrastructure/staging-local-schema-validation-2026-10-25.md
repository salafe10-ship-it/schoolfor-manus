# Staging schema and isolation validation — 25 October 2026

## Scope

The checks below used a new PostgreSQL 17.11 cluster under the current Windows user's LocalAppData directory, listening only on `127.0.0.1`. It contains repository-defined seed records and synthetic fixtures only; no production or Staging rows were copied into it. The Supabase Staging project was inspected read-only; no migration or business-data write was applied to it in this validation.

The EDB PostgreSQL binary archive was downloaded from the vendor's official distribution and its SHA-256 matched the published checksum before extraction.

## Current Staging status — 25 October 2026

This section supersedes the 56-table initial snapshot documented below.

- Staging project `vjcjscqgmijgzagshsca` now has 114 public tables. All 67 repository migrations are recorded with source SHA-256 hashes in the private `edupro_staging_ops.schema_migration_log`; the read-only plan reports zero pending migrations. The standard Supabase migration registry remains empty intentionally; it was not backfilled with an unverified baseline.
- `npm run staging:verify` passes for the dedicated project and the restricted `edupro_staging_app` role. Financial writes remain locked by default.
- The read-only security audit reports no `anon` table grants, no `TRUNCATE`/`REFERENCES`/`TRIGGER` privileges for API roles, no RLS-disabled canonical tables, no missing canonical `FORCE RLS`, 205 matching functions, and 12 matching triggers.
- A fresh DPAPI-encrypted `public` backup was created under `%LOCALAPPDATA%\EduPro\schoolfor-manus\staging\backups`. Its schema was restored to a new local database with `pg_restore --schema-only`: 114 tables, zero copied rows. Repository migration replay and a focused ACL-default probe passed on that clone.
- Local RLS rehearsal passed same-school access and inserts for both `authenticated` and `edupro_staging_app`; cross-school inserts and anonymous student-document reads were denied. All synthetic rows were rolled back.
- The schema comparison still reports name-level differences against the older local canonical snapshot: five generated duplicate identity foreign keys are represented by explicitly named equivalents, a legacy permission foreign key is replaced by a restrictive definition alongside tenant/school/branch scope constraints, and the approver unique index is represented by its unique constraint. The changed reason check is logically equivalent; extra checks and four extra indexes are intentional hardening. The 41 policy changes come from the strict-scope reconciliation migration. Eight missing UPDATE/DELETE grants are the intended append-only protections for financial audit/ledger tables. There are no missing tables or columns, no unsafe API table privileges, and no RLS/`FORCE RLS` gaps.
- No application-level financial or Student Affairs UAT was run. The local UAT configuration has no usable bearer token and test fixture IDs, so those scripts remain fail-closed and no business rows were written through the app.

The local secret vault and `.env.staging` are protected for the current Windows user with DPAPI/ACLs. `npm run staging:restore` and `npm run staging:verify` were rerun successfully. The vault is durable on this Windows profile and is not portable to a different device or Windows account; re-enter Staging credentials on a new profile and save them again. Node.js, npm, and PostgreSQL 17.11 are available from the persisted Windows user/machine `PATH`.

## Migration replay

- All 80 migration files were applied in filename order to the empty local cluster, with local stand-ins for Supabase `auth` and `storage` schemas.
- The explicitly unapproved draft `202608111200_attend_schema_001.sql` was excluded.
- Result: all 80 applied successfully; the reconstructed schema contains 114 public tables and 258 public policies.
- Every reconstructed public table has RLS enabled. 93 tables also use `FORCE ROW LEVEL SECURITY`; the remaining tables still have RLS and execute under the restricted application role. The fees role inherits `authenticated` through `edupro_app`, matching policy targets.

This proves PostgreSQL syntax and the reviewed migration chain against the local compatibility baseline. It is not a live Supabase migration result.

## Synthetic school isolation

Using two synthetic schools and the `edupro_staging_app` role against the local migration database:

- Same-school invoice read, insert, and update succeeded.
- The other school's invoice was not visible.
- An insert into the other school's scope was rejected by the RLS `WITH CHECK` policy.
- `anon` had no SELECT, INSERT, UPDATE, or DELETE privilege on `student_fee_invoices`.
- The application role had login enabled, with neither superuser nor `BYPASSRLS` privileges.

The local cluster contains no production or live Staging rows. These results do not certify the live Supabase request path until the application is connected to Staging through the dedicated restricted role.

## Historical Staging schema comparison — initial 56-table snapshot (superseded)

The findings in this section describe the state before the 67-migration reconciliation above. They are preserved as a record of why the Staging repair was needed and must not be used as the current schema status.

Read-only inspection of project `edupro-school-erp-staging` (`vjcjscqgmijgzagshsca`) was repeated after restoring the local connection. It found:

- 56 public tables, 1,142 columns, 57 policies, 24 tables with RLS enabled, and 8 tables using forced RLS.
- The 56 live table names are a subset of the 114-table canonical reconstruction; 58 canonical tables are absent and no extra live tables were found.
- On the shared tables, the live schema is missing 32 canonical columns across `guardians` (6), `schools` (1), `students` (18), and `users` (7). The 58 absent tables have their own canonical columns listed in the source migrations.
- The live schema has three extra identity review columns: `identity_access_requests.decision_note`, `identity_access_request_approvals.decision`, and `identity_access_request_approvals.note`. `identity_access_requests.ends_at` also has a nullability mismatch. Preserve these live objects until their compatibility is explicitly resolved.
- 32 of the 56 live tables have RLS disabled. `anon` has CRUD table privileges on 48 tables; 32 of those tables have no RLS. `user_permission_grants` has RLS enabled but no policies. These are unresolved access-control findings; map required public reads and application flows before applying a restrictive policy migration.
- Migration history is empty. No baseline has been recorded because the current schema does not equal the complete migration chain.
- No staging migration has been applied. The 58 missing tables, 32 missing columns on existing tables, RLS and `anon` grants, constraints, indexes, migration baseline, and role request path still require a reviewed reconciliation and live verification.

The canonical tables missing from live Staging are:

```text
borrowed_books, buses, erp_account_groups, erp_account_mappings,
erp_chart_of_accounts, erp_cost_centers, erp_expense_accruals,
erp_financial_audit_events, erp_financial_document_sequences,
erp_financial_periods, erp_general_ledger, erp_journal_entries,
erp_journal_lines, exams_database, exams_result_archives,
financial_portal_snapshots, fixed_asset_events, fixed_assets,
hr_advance_repayment_schedules, hr_bank_disbursements,
hr_employee_settlements, inventory_database, library,
platform_incident_events, platform_incidents, platform_permissions,
platform_role_permissions, platform_roles, platform_school_releases,
platform_templates, platform_user_roles, platform_users,
student_document_storage_objects, student_enrollment_certificates,
student_fee_allocations, student_fee_assignments, student_fee_audit_events,
student_fee_concessions, student_fee_configurations,
student_fee_installment_plan_history, student_fee_installment_plans,
student_fee_installment_schedules, student_fee_invoices,
student_fee_journal_entries, student_fee_journal_lines,
student_fee_payment_attempts, student_fee_payment_webhooks,
student_fee_receipt_sequences, student_fee_receipts, student_fee_templates,
student_graduation_records, student_transportation, student_uniform_accounts,
uniform_item_variants, uniform_sale_lines, uniform_sales,
uniform_stock_movements, uniforms
```

The 32 missing canonical columns on shared tables are: `guardians.occupation`,
`guardians.education_level`, `guardians.mother_name`, `guardians.mother_phone`,
`guardians.mother_whatsapp`, `guardians.mother_occupation`,
`schools.central_metadata`; `students.academic_previous_school`,
`students.academic_previous_grade`, `students.academic_previous_year`,
`students.academic_performance_level`, `students.academic_writing_level`,
`students.academic_reading_level`, `students.academic_spelling_level`,
`students.academic_average`, `students.academic_notes`,
`students.health_chronic_diseases`, `students.health_medications`,
`students.health_allergies`, `students.health_notes`, `students.social_living_with`,
`students.social_birth_order`, `students.social_family_view`,
`students.social_outside_traits`, `students.national_id`; and
`users.username`, `users.email`, `users.job_title`, `users.department`,
`users.session_revoked_at`, `users.force_password_change`, `users.employee_id`.

RLS is disabled on: `academic_calendar`, `academic_years`, `api_keys`,
`audit_access_events`, `audit_change_sets`, `branches`, `facilities`,
`feature_flags`, `guardian_contact_preferences`, `guardian_verifications`,
`notification_queue`, `notification_templates`, `permissions`,
`role_permissions`, `roles`, `school_settings`, `schools`, `service_accounts`,
`sessions`, `setting_definitions`, `setting_values`, `subscriptions`,
`system_jobs`, `tenants`, `terms`, `trusted_sessions`, `user_roles`, `users`,
`workflow_definitions`, `workflow_instances`, `workflow_tasks`, and
`workflow_versions`.

The empty migration catalog is not evidence that all historical files should be replayed. Preserve the current data, verify a restorable backup, reconcile the exact live objects to source migrations, and only then apply a tested additive migration.

## Previous local connection hand-off (historical)

At this point in the work, `.env.staging` identified the dedicated Staging project, the `edupro_staging_app` login was checked as non-superuser and without `BYPASSRLS`, and strict TLS succeeded with the stored Supabase CA. The later migration, backup, and isolation results are in the current-status section above.

An encrypted `public` schema-and-data archive was created outside Git under `%LOCALAPPDATA%\EduPro\schoolfor-manus\staging\backups`. The archive was parsed with `pg_restore --list` both before and after DPAPI protection; plaintext archive and temporary password files were removed by the backup routine. The Supabase scheduled physical backup is still the full-project restore source. The encrypted logical archive is a separate migration recovery point.

The local PostgreSQL test service responds only on `127.0.0.1:63991`; its `postgres` database has the 114-table canonical reconstruction and synthetic isolation fixtures. The audit and backup operations in that earlier hand-off were read-only.

## TLS hand-off diagnosis — 2026-10-25

The first owner form submission returned only `STAGING_DATABASE_AUTH_OR_TLS_FAILED`. A credential-free network probe confirmed DNS and TCP reachability to the Staging Supavisor endpoint. A Node.js TLS probe then isolated the cause to `SELF_SIGNED_CERT_IN_CHAIN`. The official Supabase root CA was downloaded from the project Database Settings certificate control, parsed locally as an X.509 CA, and verified by a TLS negotiation that reached the PostgreSQL password challenge. The setup now passes this CA to both PostgreSQL pools while retaining `rejectUnauthorized: true`.

The owner completed the local setup form after the TLS correction. The credential-free root certificate remains outside Git at `%LOCALAPPDATA%\EduPro\schoolfor-manus\staging\prod-ca-2021.crt`; the environment file and DPAPI vault are protected by current-user ACLs and DPAPI encryption. No secret values are recorded in this report.
