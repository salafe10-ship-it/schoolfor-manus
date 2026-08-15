# CONN-SEC-001A — Live Certification Report

## Mission

Verify the currently deployed Render Staging connection identity and the existing DB-SEC-003 RLS contract through the real application path. Staging only; Production was not accessed.

Date: 2026-08-10

## Baseline accepted from CONN-SEC-001

- `edupro_staging_app` exists, is login-enabled, non-superuser, non-bypass, non-owner, and has the approved narrow grants.
- The role credential was rotated in Staging only.
- Render Staging `DATABASE_URL` was changed to the role-qualified pooler session connection.
- No RLS, schema, authorization, tenant, UnitOfWork, or application code was changed.
- Local TypeScript, 135 tests, production build, server bundle, and diff check passed.

## Live deployment observation

- The Staging application URL returned the normal EduPro login screen after the configuration update.
- No 502, 503, or application-error page was observed.
- The Render dashboard session expired before the final deployment-status screen could be inspected.

## Required live matrix

| Gate | Result | Reason |
|---|---|---|
| Deployment status/commit/build/health | BLOCKED | Render dashboard session expired |
| Connection `current_user` | BLOCKED | Requires authenticated server-side diagnostic path |
| Connection `session_user` | BLOCKED | Same |
| `rolsuper` / `rolbypassrls` on runtime connection | BLOCKED | Same |
| Transaction identity through UnitOfWork | BLOCKED | Requires authenticated application path |
| Pool identity | BLOCKED | Requires several live application transactions |
| RLS positive own-tenant read | BLOCKED | Temporary Auth probe user could not be created; Supabase Auth session expired |
| Cross-tenant/school/branch negative tests | BLOCKED | Same |
| Missing/invalid context | BLOCKED | Same |
| Immutable audit/document mutation tests | BLOCKED | Same |
| AUTH-004 role/permission regression | BLOCKED | Same |
| SOP-001 idempotency regression | BLOCKED | Same |
| Cleanup for this mission | NOT STARTED | No fixtures were created in CONN-SEC-001A |
| Production impact | PASS | No Production access, read, write, deploy, or configuration change |

## Decision

**IMPLEMENTED — CERTIFICATION BLOCKED**

The blocker is authentication to the Render and Supabase dashboards, not a demonstrated RLS or connection failure. No code or database workaround is permitted. Re-authentication is required before the live matrix can resume.
