# CONN-SEC-001 — Staging Validation Report

## Status

**IMPLEMENTED — CERTIFICATION BLOCKED**

## Local validation

| Check | Result |
|---|---|
| TypeScript (`tsc --noEmit`) | PASS |
| Focused transaction/security tests | PASS within full suite |
| Full Vitest suite | PASS — 24 files, 135 tests |
| Vite production build | PASS |
| Server bundle | PASS |
| `git diff --check` | PASS |

The build emitted existing non-blocking warnings about large chunks and `import.meta` in CommonJS output. No new code was modified for CONN-SEC-001.

## Live validation

| Gate | Result | Notes |
|---|---|---|
| Render environment update acknowledged | PASS | Staging-only environment update triggered a deploy |
| Render build | PASS observed | Vite and server bundle completed successfully in deployment logs |
| Staging HTTP service reachable | PASS | Normal login screen returned; no 502/503/application error |
| `current_user=edupro_staging_app` from running service | BLOCKED | Render session expired before server-side identity probe |
| `session_user` consistency | BLOCKED | Same session-expiration blocker |
| Pool connection identity 100% restricted role | BLOCKED | Same session-expiration blocker |
| `rolbypassrls=false` on runtime connection | BLOCKED | Must be captured from the running service connection |
| RLS positive path through Render → UnitOfWork → PostgreSQL | BLOCKED | Requires authenticated temporary probe user and live session |
| Cross-tenant negative path | BLOCKED | Requires the actual application connection |
| Missing/invalid context fail-closed | BLOCKED | Requires the actual application connection |
| Immutable audit/document mutation denial | BLOCKED | Requires the actual application connection |
| AUTH-004A regression | BLOCKED | Requires the live authenticated application path |
| Cleanup | PARTIAL | Previous DB-SEC-004 fixtures and Auth users were removed; CONN-SEC-001 probe user was not created because Auth dashboard session expired |

## Non-secret connection metadata

- Environment: Render Staging.
- Connection mode: Supabase shared pooler session mode, port 5432.
- Application role target: `edupro_staging_app`.
- SSL: enabled by the existing PostgreSQL driver unless `PGSSLMODE=disable` is explicitly configured; no such override was added.
- Production: untouched.

## Certification decision

The configuration is prepared, but the mission cannot be certified without runtime proof. Do not issue AUTH-004A final certification or DOC-002 reactivation yet.
