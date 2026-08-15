# CONN-SEC-001A — Failure RCA

## Root cause

The Render and Supabase dashboard sessions expired before the live certification matrix began. Render now presents its sign-in page, and Supabase SQL Editor/Auth pages present session-expired dialogs.

## Why execution stopped

CONN-SEC-001A requires proof from the real deployed application connection. The CTO order forbids:

- using postgres, service role, or BYPASSRLS;
- using SET ROLE as a production substitute;
- exposing or requesting credentials in chat;
- adding a diagnostic endpoint without CTO approval;
- trusting a browser/client-visible diagnostic;
- certifying from the SQL Editor administrative role.

Because the required authenticated surfaces are unavailable, continuing would produce unverified security claims. No temporary fixtures were created, and no cleanup is required for CONN-SEC-001A.

## Evidence already available

- Staging service still returns the normal login screen.
- The restricted role and its narrow grants were verified before the session expiry.
- Render environment update was accepted and deployment build completed successfully.
- Local validation passed: TypeScript, 24 Vitest files/135 tests, Vite build, server bundle, and `git diff --check`.
- Production remained untouched.

## Required user action

Sign in normally in the already-open Render dashboard and Supabase Staging dashboard tabs. Do not send passwords, OTPs, or tokens in chat. After both tabs show the authenticated dashboards, the live matrix can resume from deployment verification without repeating configuration changes.

## Mission outcome

**BLOCKED — WAITING FOR NORMAL DASHBOARD RE-AUTHENTICATION**
