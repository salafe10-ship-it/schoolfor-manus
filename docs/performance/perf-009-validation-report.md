# PERF-009 — Validation Report

## Deployment

- Environment: Staging only
- Commit: `f9b47d7` — `PERF-009 remove redundant transaction round-trip`
- Render deployment: `dep-d9s5erb7uimc73betqjg`
- Deployment status: Live
- Production change: None

## Local validation

| Check | Result |
| --- | --- |
| TypeScript (`tsc --noEmit`) | PASS |
| Vitest suite | PASS — 20 files, 122 tests |
| Vite production build | PASS; existing chunk-size warnings remain |
| Server bundle | PASS; existing CommonJS `import.meta` warnings remain |

## Staging benchmark

Protocol: three warmups excluded, then twenty sequential authenticated requests. All diagnostic and normal endpoint responses were HTTP 200.

| Metric | Baseline p95 | Post-remediation p95 | Target / interpretation |
| --- | ---: | ---: | --- |
| Transaction begin/config | 359.159 ms | 240.596 ms | Safe improvement |
| Trusted context | 120.118 ms | 120.308 ms | Preserved |
| Tenant query | 120.830 ms | 121.846 ms | Preserved |
| Student query span | 240.759 ms | 242.587 ms | Preserved |
| Commit | 120.358 ms | 119.937 ms | Preserved |
| PostgreSQL executor | 0.114 ms | 0.070 ms | Database execution is not the bottleneck |
| Diagnostic client wall | 1,658.883 ms | 1,733.618 ms | Target <=300 ms — FAIL |
| Normal endpoint client wall | — | 1,445.497 ms | Target <=300 ms — FAIL |

Post-remediation concurrency (wall p95): concurrency 1 = 1,271.209 ms; concurrency 4 = 2,608.475 ms; concurrency 8 = 2,600.225 ms. Pool wait p95 at those levels was 0.112 ms, 732.019 ms, and 937.979 ms respectively.

The available Render log window did not expose structured PERF-004 diagnostic duration records for this final run; therefore no server-log p95 claim is made. The client and trace measurements above are the authoritative captured evidence for this mission.

## Security tests

| Test | Result |
| --- | --- |
| Missing authentication | PASS — 401 |
| Invalid token | PASS — 401 |
| Forged school query | PASS — 403 |
| Forged school header | PASS — 403 |
| Trusted tenant context | PASS — unchanged path exercised |
| RLS / service-role bypass | PASS — no bypass introduced |

## SOP-001 regression

- Valid first request: HTTP 201.
- Idempotent retry: HTTP 200 and `idempotent=true`.
- Invalid payload test: HTTP 400 with no committed side effects.
- Cleanup: PASS; all ten verification counters were zero after cleanup, and the temporary Auth user was absent.

## Final decision

**PERFORMANCE NOT CERTIFIED — ADDITIONAL REMEDIATION REQUIRED**

The implementation is safe and deployable to Staging, but the approved p95 target of 300ms was not met. No Production promotion is authorized by this report.

## Remaining work

The next mission should isolate the remaining remote latency without changing RLS, trusted tenant resolution, authorization order, transaction boundaries, schema, pool size, or cache architecture. Candidate work must be separately approved and benchmarked before implementation.
