# STU-AFFAIRS-P0-002O — Security Gate

## Mission status

**DECISION PACKAGE — IMPLEMENTATION BLOCKED**

This document closes the current engineering analysis by separating approved security invariants from decisions that belong to Security, Operations, and Product. It creates no SQL, migration, RLS policy, database object, permission, or application code.

`PLATFORM-EVIDENCE-002` remains **CLOSED — BLOCKED + RCA** and is not reopened by this mission.

## Final decision table

| Decision | Current status | Required owner/action |
|---|---|---|
| Application role | **UNPROVEN** | Security/Operations must approve the exact deployed non-owner, non-`BYPASSRLS` role; the recorded Render path did not prove `edupro_staging_app` |
| Owner/`BYPASSRLS` exclusion | **UNPROVEN** | Security must prove the real application connection cannot use owner, superuser, or `BYPASSRLS` execution |
| `FORCE RLS` | **NOT APPROVED** | Security must explicitly approve or reject it; engineering recommendation is to mandate it unless permanent owner/BYPASSRLS exclusion is proven |
| Trusted identity source | **APPROVED — DESIGN** | Supabase Auth plus server-controlled `app_metadata`; never client metadata |
| Missing context = DENY | **APPROVED — DESIGN** | Any missing, malformed, or inconsistent context must fail closed |
| Cross-tenant = DENY | **APPROVED — DESIGN** | Read, create, claim, update, reconcile, and purge must remain tenant-scoped |
| Claim/reconcile authority | **UNPROVEN** | Security/Operations must approve the service/operator boundary and audit requirements; no new permission is created here |
| Purge authority | **UNPROVEN** | Operations/Product/Security must approve authority, legal hold, tenant scope, and append-only evidence |
| Retention durations | **UNPROVEN** | Operations/Product must approve retry, reconciliation, committed, failed, and legal-hold windows |

## Gate interpretation

The package is not a partial approval for schema work. The following conditions are all required before `P0-002O` can be closed:

1. The deployed application role is identified and approved.
2. Owner and `BYPASSRLS` exclusion is proven on the real application path.
3. The `FORCE RLS` decision is recorded by Security.
4. Claim and reconciliation ownership is approved.
5. Purge authority and retention policy are approved by the accountable business owners.
6. The hostile tenant and connection-reuse test plan is accepted for the later migration gate.

Until then, `TransferOperation` must not be created and no RLS migration may be written or executed.

## Evidence boundary

The repository proves a suitable design shape for Auth verification, trusted context creation, transaction-local context propagation, and fail-closed middleware. It does not prove the live Render database role or live RLS behavior. Administrative SQL Editor results are not application-role evidence.
