# ENROLL-SCHEMA-ALIGN-002 — Validation Report

Date: 2026-08-11

## Validation matrix

| Check | Result | Evidence |
|---|---|---|
| Render staging service healthy | PASS | Render deployment page shows succeeded deployment for `d23780d`. |
| Correct Render branch | PASS | Service is linked to `codex/sop-001-staging`. |
| Migration present in deployed commit | PASS | Render deployment links to commit `d23780d`. |
| Supabase Staging accessible | PASS | Project dashboard and Database Migrations page opened. |
| Supabase migration history | BLOCKED | Dashboard reports `No migrations` / `Run your first migration`. |
| Supabase repository pipeline | BLOCKED | Dashboard reports no repository connected and no branches. |
| Supabase CLI available locally | BLOCKED | `supabase` command is not installed in the workspace environment. |
| Authenticated migration connection | BLOCKED | No approved CLI link/token/connection is available in workspace. |
| Live `active → withdrawn` verification | NOT RUN | Migration is not applied. |
| Live canonical withdrawal smoke test | NOT RUN | No valid migrated staging state. |
| Live rollback/fault injection | NOT RUN | No safe staging execution channel. |
| Production access/action | NOT ATTEMPTED | Prohibited by mission. |

## Root cause

Staging Supabase is an empty/unmigrated project from the migration system's perspective, while the repository's Render service is deployed separately. There is no connected Supabase repository, no local Supabase CLI and no authenticated migration pipeline available to apply `202608111000_enroll_schema_align_001.sql`.

## Required unblock

Provide or configure the approved staging migration channel:

1. install/enable the official Supabase CLI;
2. authenticate it without exposing secrets in chat or source;
3. link project ref `vjcjscqgmijgzagshsca`;
4. run `supabase db push` from the approved branch/pipeline;
5. re-open the migrations page and verify the migration history;
6. run the live constraint and smoke tests with explicit evidence.

## Final decision

**ENROLL-SCHEMA-ALIGN-002 = BLOCKED + RCA**

This is an operational access/pipeline blocker. It is not a code-level failure, and no workaround is authorized.
