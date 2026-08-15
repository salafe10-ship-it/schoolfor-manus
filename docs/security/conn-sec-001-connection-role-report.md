# CONN-SEC-001 — Staging Connection-Role Report

## Mission

Remediate and prove the Render Staging PostgreSQL connection identity without changing Production, RLS, authorization, tenant logic, transaction architecture, or business code.

Date: 2026-08-10

## Forensic findings

- `server/infrastructure/PostgresTransactionDriver.ts` selects `DIRECT_URL || DATABASE_URL`.
- Render Staging exposed `DATABASE_URL`; no `DIRECT_URL` was listed.
- The driver configured transaction-local `app.*` trusted context but did not change the PostgreSQL role.
- Repository search found no production `SET ROLE`, role-changing `set_config`, or equivalent role switch.
- The former connection identity was the Supabase pooler `postgres.<project-ref>` class on session-mode port 5432, which is not an approved RLS-enforcement identity for the application.
- Supabase Staging already contained the valid `edupro_staging_app` role. Its live grants were complete and narrow: database CONNECT, public schema USAGE, SELECT/INSERT on all DB-SEC-004 targets, and only the approved UPDATE/DELETE capabilities.

## Controlled configuration action

Within Staging only:

1. A new strong password was generated internally for the existing `edupro_staging_app` role. The password is not stored in this document, source code, chat, or logs.
2. The role password was rotated through the authenticated Supabase SQL Editor session.
3. Render Staging `DATABASE_URL` was updated to the role-qualified Supabase pooler connection form for `edupro_staging_app`.
4. Render acknowledged the environment update and triggered a deploy for commit `45ea0583d62ec6eef5aec0471893821c22286a26` on branch `codex/sop-001-staging`.

No Production configuration was opened or modified.

## Runtime observation

- Render build logs reached a successful Vite build and server bundle step.
- The Staging service remained reachable at `https://edupro-school-erp-staging.onrender.com/` and returned the normal EduPro login screen without a 502/503/application error.
- Final Render deploy status and PostgreSQL `current_user` could not be captured because the Render and Supabase dashboard sessions expired during the verification window.
- Therefore the connection change is **configured but not certified**. The required proof of `current_user=edupro_staging_app` remains open.

## Security boundary

The administrative `postgres` role was not used as the application connection. No `SET ROLE` workaround, service role, `BYPASSRLS`, owner privilege, broad grant, or policy change was introduced.

## Production impact

None. Production was not accessed, changed, or redeployed.

## Decision

**CONFIGURATION APPLIED — RUNTIME IDENTITY CERTIFICATION BLOCKED** pending a fresh authenticated Render/Supabase session and the server-side identity, pool, transaction, RLS, immutability, AUTH-004A, and cleanup probes required by CONN-SEC-001.
