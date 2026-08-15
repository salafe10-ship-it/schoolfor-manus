# PLATFORM-EVIDENCE-001 — Operations Evidence Report

## Scope

Staging Operations / Platform decision analysis only. No code, endpoint, environment variable, database, RLS, PostgreSQL role, secret, token, or Production resource was changed.

## Phase A — Deployment Identity

| Item | Result | Evidence |
|---|---|---|
| Render service | PASS | Service `edupro-school-erp-staging` is visible in the Render workspace. |
| Branch | PASS | Render service is linked to `codex/sop-001-staging`. |
| Environment | PASS | Render breadcrumb identifies the service environment as `Staging`. |
| Live deployment | PASS | Render marks the current deployment Live and shows the current branch chain through `ca0f40e`. |

## Phase B — Authenticated Application Session

| Item | Result | Evidence |
|---|---|---|
| Staging application | PASS | The existing browser session loads the Staging application and the protected System Health route. |
| Login/session restoration | PASS (existing evidence) | The user previously confirmed successful real Staging login; no password or token was inspected. |
| Trusted school UUID | UNKNOWN in this operation | The current approved surface does not expose a trusted school UUID without reading identity/session state. No client value was accepted as evidence. |

## Phase C — Connection Identity

| Required evidence | Result | Evidence |
|---|---|---|
| Authenticated invocation of the existing endpoint | BLOCKED | The live UI has no invocation control; direct browser navigation is blocked by `ERR_BLOCKED_BY_CLIENT`; token extraction is forbidden. |
| `current_user` | UNPROVEN | No valid application-role invocation available. |
| `session_user` | UNPROVEN | No valid application-role invocation available. |
| `rolsuper` | UNPROVEN | No valid application-role invocation available. |
| `rolbypassrls` | UNPROVEN | No valid application-role invocation available. |
| Proof of `edupro_staging_app` via the actual app | UNPROVEN | SQL Editor / `postgres` / `service_role` / `SET ROLE` are prohibited evidence substitutes. |

## Available platform channel decision

No currently approved platform channel can invoke the existing endpoint through the actual authenticated application session while returning only the four approved fields. Render deployment metadata proves deployment state, but does not provide the application PostgreSQL connection identity. The current browser surface cannot read the deployed artifact or perform the required authenticated invocation without a forbidden token extraction or bypass.

## Security decision

The certification is **blocked by evidence availability, not by a proven security failure**. No security control was weakened and no fallback proof was accepted.

## Final decision

`PLATFORM EVIDENCE CHANNEL UNAVAILABLE`.

Do not start `CONN-SEC-003`, `DB-SEC-004`, `AUTH-004A`, or `DOC-002`. Do not open another diagnostic mission for the same missing evidence channel. Any future action requires an approved Operations/platform capability that can invoke the existing Staging endpoint without secrets, token extraction, administrative impersonation, or code changes.
