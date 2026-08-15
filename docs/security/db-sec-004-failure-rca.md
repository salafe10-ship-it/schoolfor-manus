# DB-SEC-004 — Failure RCA

## Failure

The live RLS objects are present, but the required hostile isolation certification cannot be completed with the deployed execution identity.

## Root cause

DB-SEC-003 policies are intentionally granted to `edupro_staging_app`. The current Render Staging environment exposes `DATABASE_URL` whose non-secret connection identity is the Supabase pooler `postgres.<project-ref>` user. The application driver consumes `DIRECT_URL || DATABASE_URL` and establishes trusted transaction-local context, but no code or environment evidence switches the database session to `edupro_staging_app`.

The custom role is not available in Supabase SQL Editor's role selector. The only membership involving it has `set_option=false` and `inherit_option=false`; attempting `SET LOCAL ROLE edupro_staging_app` returned PostgreSQL `42501`.

## Why this is a release blocker

The `postgres` inspection role has `rolbypassrls=true`. A read-only probe under that role saw all temporary fixture rows without tenant context, so an administrative connection cannot be used as proof of tenant isolation. Conversely, the `authenticated` impersonation path is not the application role targeted by the policies and only proves a deny result, not the required own-tenant allow path.

## Impact

- The database objects themselves are not missing or degraded.
- The effective application enforcement path is unproven and may bypass the intended RLS policy set.
- Cross-tenant isolation must not be certified or released until the real service role is demonstrated to be non-bypass and policy-matched.

## Evidence

- Live target count: 15.
- Live RLS count: 15/15.
- Live policy count: 46 across 15 tables.
- Live policy role: `edupro_staging_app` only.
- App role: `rolsuper=false`, `rolbypassrls=false`.
- Admin role: `rolbypassrls=true`.
- `SET LOCAL ROLE edupro_staging_app`: PostgreSQL `42501`.
- Render variables: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and diagnostics flags; no `DIRECT_URL` listed.
- Repository search: no `SET ROLE`, role-changing `set_config`, or equivalent app-role switch.
- Migration catalog relation: absent (`to_regclass(...) = null`).
- Temporary fixtures: fully removed; synthetic Auth users deleted; existing performance users preserved.

## Safest remediation direction

CTO approval is required for a separate environment/connection mission. The remediation must provision a least-privilege Staging connection that executes as `edupro_staging_app` (or an explicitly approved equivalent non-bypass role), preserve transaction-local trusted context, and then rerun DB-SEC-004 hostile tests. Do not solve this by using service role, superuser, `BYPASSRLS`, client-supplied context, or by duplicating DB-SEC-003 policies.

## Mission outcome

**BLOCKED — WAITING FOR CTO APPROVAL FOR CONNECTION-ROLE REMEDIATION**
