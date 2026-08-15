# PERF-005 — Validation Report

**Environment:** Staging only (`edupro-school-erp-staging`)

**Date:** 2026-08-08

**Mission:** Trusted Transaction Context Round-Trip Optimization

## Implementation result

The six trusted transaction-local context assignments were combined into one parameterized PostgreSQL command per transaction. The command uses bound setting names and values and retains `set_config(..., true)` for every assignment. Invalid tenant/school context is rejected before any context command is issued.

The only test-code change after validation was updating the DB-SEC-002 expectation from six context commands to one combined command. No business module or security policy was changed.

## Required test results

| Check | Result | Evidence |
|---|---|---|
| TypeScript | PASS | `pnpm exec tsc --noEmit` |
| Focused transaction/context tests | PASS | 2 files, 5 tests |
| Full Vitest suite | PASS | 19 files, 119 tests |
| Vite production build | PASS | 3045 modules transformed |
| Server bundle | PASS | `dist/server.cjs` generated |
| Diff check | PASS | `git diff --check` |
| Missing authentication | PASS | HTTP 401 |
| Forged school query value | PASS | HTTP 403 |
| Forged school header value | PASS | HTTP 403 |
| Student registration | PASS | HTTP 201; committed successfully |
| Registration retry | PASS | HTTP 200; idempotent response |
| Cleanup | PASS | All scoped public fixture counters are 0; Auth fixture counter is 0 |

## Live warm benchmark

The benchmark used three warm-up requests followed by 20 sequential Staging requests. All 20 responses were HTTP 200.

| Metric | Result |
|---|---:|
| Wall p50 | 1675ms |
| Wall p95 | 1712ms |
| Wall p99 | 1719ms |
| Wall max | 1719ms |
| Internal-to-serialization p95 | 1387.802ms |
| Authentication p95 | 200.846ms |
| Tenant context p95 | 119.364ms |
| Tenant PostgreSQL query p95 | 120.414ms |
| Student context p95 | 119.272ms |
| Student PostgreSQL query p95 | 119.684ms |
| Response residual p95 | 342.646ms |
| Context round trips/request | 2 |
| Business queries/request | 2 |

## Security and regression result

Authentication, authorization, trusted tenant context, transaction-local settings, pool release, and RLS behavior remained intact. Missing authentication was rejected with 401. Client attempts to select a different school through query or header were rejected with 403. The SOP-001 registration path committed successfully and its retry was idempotent. The temporary Staging fixture and Auth user were removed and verified absent.

## Warnings

- Vite reports existing large-chunk warnings.
- The server CommonJS bundle reports four existing `import.meta` compatibility warnings in financial-closing files.
- No PERF-005 SQL, RLS, or tenant-isolation warning was observed.

## Certification decision

**NOT CERTIFIED for the Student Read latency target.**

The trusted-context round-trip issue is fixed and measured, but the mission target of Student Read p95 <=300ms remains unmet at 1712ms. The next bottleneck is the combined authentication cost, the two remaining transaction/query paths, and response/network residual. Further performance work requires a new CTO-approved mission.
