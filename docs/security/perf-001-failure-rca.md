# PERF-001 — Failure RCA and Remediation Gate

## Decision

`NOT CERTIFIED`

The PostgreSQL execution layer passes its DB-SEC-003 budgets, but the production-like end-to-end Student paths do not.

## Evidence

1. Cold authenticated session after Staging restart: 1,143.58 ms.
2. Warm Student lookup p95: 1,774.23 ms against a 300 ms budget.
3. Warm Student registration write p95: 4,948.89 ms against an 800 ms budget.
4. Staging database contained 21 synthetic students, while the authenticated Student API returned 0 rows and totalCount 0.
5. No dedicated current-status or document HTTP lookup endpoints exist in the reviewed server route surface.

## Root-cause classification

- **R1 — Runtime/network overhead:** Render Free cold-start and pooler/network behavior materially contribute to request latency.
- **R2 — Read-path inconsistency:** the legacy Student read repository uses the generic Supabase client/fallback path rather than the same request-scoped PostgreSQL path used by SOP-001. The observed empty response versus 21 committed rows proves the current read path is not suitable as production performance evidence.
- **R3 — Measurement surface gap:** current academic status and Student document budgets cannot be tested end-to-end because protected HTTP endpoints for those resources are absent.

R2 and R3 require engineering remediation before a valid Student API performance certificate. R1 requires a production-like Staging runtime before infrastructure latency can be judged fairly.

## Safest next action

Create a narrowly scoped CTO-approved remediation mission for the Student read path and missing measurement surfaces. Preserve DB-SEC-003 RLS policies and the SOP-001 registration transaction. Re-run PERF-001 only after the read path returns the committed tenant-scoped rows and the status/document endpoints exist or are explicitly excluded from the approved SLA.

## Cleanup and rollback

All synthetic PERF-001 data and the temporary Auth user were removed. No source, migration, RLS policy, or Production setting was changed by this mission.
