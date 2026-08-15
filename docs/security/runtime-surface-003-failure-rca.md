# RUNTIME-SURFACE-003 — Failure RCA

## Root cause

The permitted tools can prove the Git source, local Vite output, Render branch/deployment status, parent route, and live browser asset name, but cannot read the deployed static artifact or its cache/deployment metadata. The browser blocks direct static-asset inspection with `ERR_BLOCKED_BY_CLIENT`, and Render does not expose the required artifact contents through the approved inspection surface.

## Impact

Connection identity certification cannot be completed. No claim is made about `current_user`, `session_user`, `rolsuper`, or `rolbypassrls`. No RLS, immutability, AUTH-004, SOP-001, or Production certification may proceed from this evidence.

## What was not changed

No source code, endpoint, environment variable, cache, CDN, Render setting, SQL, migration, RPC, RLS policy, PostgreSQL role, UnitOfWork, authentication, authorization, database, or Production resource was changed.

## Final decision

`RUNTIME-SURFACE-003 = BLOCKED / PLATFORM OBSERVABILITY LIMITATION`.

Further work requires a platform capability or CTO-approved evidence path that can read the deployed artifact mapping without bypassing browser or security controls. No diagnostic workaround or fourth runtime-surface mission should be started from this RCA alone.
