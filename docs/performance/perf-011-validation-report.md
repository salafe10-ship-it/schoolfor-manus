# PERF-011 — Validation and Certification Report

## Environment

- Branch: `codex/sop-001-staging`
- Deployment: Staging only, commit `6a19c9d`
- Production: not accessed or modified

## Implementation Validation

| Check | Result |
|---|---|
| TypeScript | PASS |
| Focused PERF-011/PERF-006 tests | PASS: 2 files, 5 tests |
| Full Vitest suite | PASS: 21 files, 125 tests |
| Vite production build | PASS |
| Node server bundle | PASS |
| RLS/schema/migrations | Unchanged |
| API response shape and `totalCount` | Unchanged |

Existing build warnings remain: large frontend chunks/dynamic-import advisory and four CommonJS `import.meta` warnings. They are not introduced by PERF-011.

## Security Results

| Scenario | HTTP |
|---|---:|
| Invalid tenant | 403 |
| Invalid school | 403 |
| Invalid branch | 403 |
| Invalid academic year | 403 |
| Missing authentication | 401 |
| Invalid authentication | 401 |
| Genuine authorized request | 200 |
| RLS | Enabled |
| Application role bypass | `false` |

The valid response contained one scoped Student row during the controlled test and preserved the existing Student fields and `totalCount` metadata. No cross-tenant data was returned.

## SOP-001 Regression

- First controlled registration: HTTP 201.
- Same idempotency key and payload: HTTP 200 with `idempotent=true`.
- Required aggregate rows were created and then removed in the same Staging cleanup transaction.
- Synthetic Auth identity and public user record were removed.

## Pool Classification

Root cause: **G — B + C/F**. Pool waiting stayed at zero; high acquisition aligned with connection creation, while executor and release remained low. No pool or infrastructure change was made.

## Final Decision

**PERF-011 SECURITY ERROR NORMALIZATION: CERTIFIED**

**STUDENT READ PERFORMANCE: NOT CERTIFIED**

The security/API defect is fixed and verified. The remaining latency is attributable to connection creation and external hosting/database-network behavior under the current Staging environment; pursuing the 300 ms target requires a separately approved infrastructure mission.
