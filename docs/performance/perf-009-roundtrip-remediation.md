# PERF-009 — Round-Trip Remediation

## Scope

Staging only (`edupro-school-erp-staging`). Production was not changed.

Mission: remove one demonstrably redundant PostgreSQL round-trip from the Student read transaction while preserving the approved security and tenancy model.

## Evidence-based change

`server/infrastructure/PostgresTransactionDriver.ts` no longer sends an explicit `SET TRANSACTION ISOLATION LEVEL READ COMMITTED` after `BEGIN`.

The Staging database default was verified as `read committed`, so the removal does not change transaction semantics. The transaction-local trusted context command, UnitOfWork boundary, RLS enforcement, TenantEngine validation, authorization, and fail-closed behavior remain unchanged.

## Before / after

| Measurement | PERF-009 baseline | After remediation | Result |
| --- | ---: | ---: | --- |
| Transaction begin/config p95 | 359.159 ms | 240.596 ms | Improved by 118.563 ms |
| Auth p95 | 536.516 ms | 205.911 ms | Variable remote latency |
| Pool wait p95 | 0.128 ms | 0.161 ms | Stable for sequential run |
| PostgreSQL executor p95 | 0.114 ms | 0.070 ms | Unchanged / low |
| Diagnostic client wall p95 | 1,658.883 ms | 1,733.618 ms | Still above target |
| Normal endpoint client wall p95 | — | 1,445.497 ms | Still above target |

The post-remediation diagnostic run used three warmups followed by twenty sequential authenticated requests. All responses were HTTP 200. The normal endpoint run used the same warmup discipline and twenty authenticated requests; all responses were HTTP 200.

## Call graph impact

The call graph remains one authenticated request → one UnitOfWork → one transaction → trusted transaction-local context → one tenant validation query → one student query → commit. No query, index, schema, cache, pool-size, role, or RLS change was introduced.

## Security preservation

- Missing authentication: HTTP 401.
- Invalid authentication: HTTP 401.
- Forged school query: HTTP 403.
- Forged school header: HTTP 403.
- TenantEngine, authorization, RLS, and trusted context behavior remained active.
- `edupro_staging_app` and the approved no-BYPASSRLS contract were not changed.

## Regression and cleanup

SOP-001 first request returned HTTP 201; the idempotent retry returned HTTP 200 with `idempotent=true`. The temporary records and temporary authentication user were removed in a committed Staging cleanup transaction. The final cleanup marker was `0|0|0|0|0|0|0|0|0|0`; the Authentication UI also showed no PERF-009 test user.

## Decision

This was the smallest safe evidence-based round-trip reduction. It improved transaction setup but did not meet the approved p95 target. Further optimization requires a separate CTO-approved investigation of remaining remote authentication, database connection, and platform latency; this mission does not authorize weakening security or redesigning the tenancy architecture.
