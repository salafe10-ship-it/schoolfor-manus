# CONN-SEC-001 — Failure RCA

## Blocker

The restricted-role connection configuration was applied to Staging and the service remained reachable, but the mandatory server-side identity and RLS probes could not be completed because the authenticated Render and Supabase dashboard sessions expired.

## Root cause

The browser sessions used to inspect Render deployment state, Supabase SQL Editor, and Supabase Auth expired during the live verification window. The available Render tab returned the sign-in page, and the Supabase SQL/Auth tabs returned session-expired dialogs. Without an authenticated dashboard session, the following required evidence cannot be safely captured:

- actual `current_user` and `session_user` from the running application connection;
- pooled-connection identity across multiple transactions;
- a temporary Auth user with trusted app metadata;
- the positive and negative RLS tests through Render and UnitOfWork.

## What is already proven

- The source connection path was inspected.
- The existing non-bypass role was reused.
- The role's database and table grants were complete and least-privilege; no grants were added.
- The role credential was rotated only in Staging.
- Render accepted the Staging environment update and triggered a deployment.
- Deployment build completed successfully.
- The Staging application returned its normal login page after the update.
- TypeScript, 135 tests, production build, server bundle, and diff check passed.

## What is not proven

The runtime role identity is not certified until a new authenticated session permits the required server-side probes. The service must not be treated as production-ready on the basis of the admin SQL Editor or the public login page.

## Safest next action

Re-authenticate the already-open Render and Supabase tabs, then rerun only the CONN-SEC-001 live verification matrix. Do not rotate credentials again, change RLS, use `postgres`, use service role, add `SET ROLE`, or modify application code.

## Mission outcome

**BLOCKED — WAITING FOR AUTHENTICATED DASHBOARD SESSIONS FOR RUNTIME IDENTITY CERTIFICATION**
