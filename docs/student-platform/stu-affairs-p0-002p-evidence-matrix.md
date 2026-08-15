# STU-AFFAIRS-P0-002P — Evidence Matrix

## Scope and classification

This matrix records only evidence observable without SQL execution, secret
access, database mutation, or Production access. `PROVEN` means directly
supported by an observable source. `UNPROVEN` means the source explicitly lacks
the required proof or the observation is insufficient. `NOT OBSERVABLE` means
the approved channels did not expose the attribute.

| ID | Control | Required proof | Observable evidence | Status | Confidence | Gap owner |
|---|---|---|---|---|---|---|
| A | Application role | `current_user` and `session_user` from the real Render application connection | Render UI/logs show the Staging branch, deployment, service startup, and Supabase connectivity, but no PostgreSQL session identity. `staging-evidence-sanitized.md` records `DATABASE_ROLE=not-proven`. | **UNPROVEN** | High | Operations / Security |
| B | Owner / `BYPASSRLS` exclusion | `rolsuper`, `rolbypassrls`, ownership, membership, and privilege path for the actual application role | No current application-path role attributes were observed. The DB-SEC-003 migration states an intended role boundary only. | **UNPROVEN** | High | Security |
| C | `FORCE RLS` | Final Security decision plus live `force_rls` state for target tables | `stu-affairs-p0-002o-force-rls-decision.md` records `NOT APPROVED`; no live relation-level evidence is available. | **UNPROVEN / NOT APPROVED** | High | Security |
| D | Claim / reconcile | Approved service/worker identity, permissions, trusted context, and audit boundary | P0-002O defines conditional service/worker responsibilities, but no signed Operations/Security artifact proves the deployed authority. | **UNPROVEN** | High | Security / Operations |
| E | Purge | Named authority, execution path, tenant scope, audit, and legal-hold enforcement | P0-002O explicitly states purge is not implemented and must remain outside the ordinary application role. | **UNPROVEN** | High | Operations / Security |
| F | Retention | Approved `COMMITTED`, `FAILED`, retry, and reconciliation windows | P0-002O intentionally contains no durations and requires Operations/Product/Compliance decisions. | **UNPROVEN** | High | Operations / Product / Compliance |
| G | Legal hold | Approved precedence, placement, release workflow, and audit evidence | Legal hold is listed as a required decision; no approved policy artifact was available in the inspected sources. | **UNPROVEN** | High | Compliance / Security |

## Evidence that is proven but outside A–G

| Control | Status | Evidence |
|---|---|---|
| Git branch and commit | **PROVEN** | `codex/sop-001-staging` at `2a909d1b86d35853bfbe98198701f775bee2cdf2`, matching the remote branch. |
| Render deployment | **PROVEN** | `edupro-school-erp-staging`, Auto-Deploy for `2a909d1b`, status `live`. |
| Runtime connectivity | **PROVEN** | Render logs show connection established and `Supabase linked`; this is connectivity evidence, not role evidence. |
| Production isolation | **PROVEN for this mission** | No Production access or mutation was performed. |
| Secret handling | **PROVEN for this mission** | No secrets, credentials, tokens, or database connection strings were read or recorded. |
| Approved design direction | **PROVEN as design** | Existing P0-002O reports approve trusted identity, missing-context denial, and cross-tenant denial as design invariants. This is not live certification. |

## Evidence conflicts and resolution

An older performance report records `edupro_staging_app.rolbypassrls=false`.
That observation is not linked to a current `current_user` value from the
Render application connection. The conservative resolution is to retain A and
B as `UNPROVEN`, not to promote an intended or historical role observation to
current live evidence.

## Gate result

```text
A UNPROVEN
B UNPROVEN
C UNPROVEN / NOT APPROVED
D UNPROVEN
E UNPROVEN
F UNPROVEN
G UNPROVEN

P0-002P = BLOCKED / SECURITY & OPERATIONS EVIDENCE PENDING
P0-002Q = NOT AUTHORIZED
```
