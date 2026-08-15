# PERF-006 — Runtime Latency Breakdown

**Environment:** Staging only

## Sequential benchmark

Three warm-up requests were followed by 20 sequential Student Read requests. All responses were HTTP 200.

| Metric | p50 | p95 | p99 | Max |
|---|---:|---:|---:|---:|
| Client wall time | 1664.221ms | 1790.346ms | 1935.318ms | 1935.318ms |
| Authentication | 176.412ms | 188.059ms | 488.956ms | 488.956ms |
| TenantEngine | 592.451ms | 593.124ms | 594.292ms | 594.292ms |
| Tenant pool acquisition | 0.082ms | 0.139ms | 0.158ms | 0.158ms |
| Tenant trusted context | 118.319ms | 118.590ms | 118.645ms | 118.645ms |
| Tenant PostgreSQL query | 119.094ms | 119.371ms | 119.642ms | 119.642ms |
| Student pool acquisition | 0.061ms | 0.088ms | 0.136ms | 0.136ms |
| Student trusted context | 118.261ms | 118.706ms | 119.828ms | 119.828ms |
| Student PostgreSQL query | 118.614ms | 118.826ms | 118.902ms | 118.902ms |
| Student commit | 118.021ms | 118.178ms | 118.289ms | 118.289ms |
| Student release | 0.030ms | 0.037ms | 0.044ms | 0.044ms |
| Student mapping | 0.002ms | 0.003ms | 0.003ms | 0.003ms |
| Serialization preparation | 0.002ms | 0.003ms | 0.005ms | 0.005ms |
| Server response residual | 0.000ms | 0.618ms | 0.618ms | 0.618ms |
| Server total | 1361.265ms | 1373.017ms | 1373.017ms | 1373.017ms |

The stage p50/p95/p99/max values are calculated from the 20-request client sample where available. The server `response residual` and `server total` values are calculated from the final server traces visible in Render Logs (8 traces available in the log window); they include the Express `finish` timestamp.

## Controlled concurrency

Eight requests were executed at each level, with no batch exceeding the requested concurrency. All responses were HTTP 200 and no errors occurred.

| Concurrency | Wall p50 | Wall p95 | Wall p99 | Max | Pool wait p95 | Errors |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 1636.160ms | 1708.549ms | 1708.549ms | 1708.549ms | 0.165ms | 0 |
| 4 | 2026.273ms | 2783.958ms | 2783.958ms | 2783.958ms | 735.918ms | 0 |
| 8 | 2062.613ms | 3743.418ms | 3743.418ms | 3743.418ms | 970.100ms | 0 |

## Certification decision

PERF-006 does not certify performance. The Student Read target remains unmet: the sequential client wall p95 is 1790.346ms, above the 300ms target.

The evidence supports two separate next-step concerns:

- Sequential: TenantEngine transaction/context/commit remains the largest measured server-side stage.
- Concurrent: pool wait grows sharply at 4 and 8 concurrent requests.
