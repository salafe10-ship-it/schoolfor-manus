# Staging schema and isolation validation — 25 October 2026

## Scope

The checks below used a new PostgreSQL 17.11 cluster under the current Windows user's LocalAppData directory, listening only on `127.0.0.1`. It contains repository-defined seed records and synthetic fixtures only; no production or Staging rows were copied into it. The Supabase Staging project was inspected read-only; no migration or business-data write was applied to it in this validation.

The EDB PostgreSQL binary archive was downloaded from the vendor's official distribution and its SHA-256 matched the published checksum before extraction.

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

## Staging schema comparison

Read-only inspection of project `edupro-school-erp-staging` (`vjcjscqgmijgzagshsca`) found:

- 56 public tables, 1,142 columns, 57 policies, 24 tables with RLS enabled, and 8 tables using forced RLS.
- The live table names are a subset of the 114-table canonical reconstruction.
- Comparing columns on the 56 shared tables found three columns absent from the canonical chain and one nullability difference: `identity_access_requests.decision_note`, `identity_access_request_approvals.decision`, `identity_access_request_approvals.note` are absent; `identity_access_requests.ends_at` has a nullability mismatch.
- Migration history is empty. No baseline has been recorded because the current schema does not equal the complete migration chain.
- No staging migration has been applied. The 58 additional canonical tables, missing RLS objects, role execution path, constraints, indexes, and data backup still require a reviewed reconciliation and live verification.

The empty migration catalog is not evidence that all historical files should be replayed. Preserve the current data, verify a restorable backup, reconcile the exact live objects to source migrations, and only then apply a tested additive migration.

## Current completion gate

The local connection hand-off is not yet verified until `.env.staging` contains the Staging app and admin URLs and the encrypted DPAPI vault exists. Do not connect to production or use production credentials as a fallback. The local schema checks above can be repeated with the dedicated cluster; live read/write and restore checks remain pending.
