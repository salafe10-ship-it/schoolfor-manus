# PERF-011 — Pool Contention Forensics

## Scope

Staging only. Pool configuration, Render plan, Supabase topology, database schema, and connection limits were not changed.

Endpoint: `GET /api/students?limit=100`.

Measurement: three warmups excluded, twenty sequential requests, then one concurrency sample at C1, C4, and C8. Diagnostics recorded pool size snapshots, active/idle/waiting counts, acquisition, connection creation, transaction occupancy, release, and PostgreSQL executor time.

## Sequential Baseline

| Measure | Result |
|---|---:|
| Client wall p50 | 1217.526 ms |
| Client wall p95 | 1633.706 ms |
| Client wall p99 | 1633.706 ms |
| Client maximum | 1885.783 ms |
| Server p50 | 905.912 ms |
| Server p95 | 1263.647 ms |
| DB executor p95 | Approximately 0.1 ms in the observed sample |
| Response statuses | All 200 |

## Concurrency Results

| Level | Wall batch time | Server p95 | Pool wait p95 | Acquire p95 | Connection creation p95 | Transaction occupancy p95 | DB executor p95 |
|---:|---:|---:|---:|---:|---:|---:|---:|
| C1 | 1240.283 ms | 915.388 ms | 0.079 ms | 0.079 ms | 0 ms | 716.045 ms | 0.097 ms |
| C4 | 2455.212 ms | 1633.522 ms | 0.070 ms | 726.544 ms | 726.544 ms | 716.368 ms | 0.077 ms |
| C8 | 2645.024 ms | 2147.266 ms | 0.096 ms | 905.411 ms | 905.411 ms | 742.261 ms | 0.085 ms |

Wall p95/p99 for the single-sample concurrency batches is not used as a production SLA claim; it is diagnostic evidence only.

## Pool State Evidence

- `waitingCount` maximum observed: `0` at C1, C4, and C8.
- The pool expanded to the concurrent workload; no pool-exhaustion signature was observed.
- Existing pooled-connection acquisition was sub-millisecond.
- The high acquisition values aligned with connection creation duration, not waiting requests.
- Transaction occupancy remained approximately 716–742 ms p95; release remained below 0.05 ms p95.
- PostgreSQL executor time remained below 0.1 ms p95 in the captured query metrics.

## Root-Cause Classification

**G — Multiple causes, specifically B + C/F:** connection creation latency and external Render/Supabase network or pooler behavior. Transaction occupancy is also measurable, but the evidence does not show pool exhaustion (A), and no pool-size or architecture change is authorized.

## Decision

Do not change pool size, Render plan, Supabase infrastructure, database topology, cache, Redis, or read replicas. The correct engineering conclusion is an environment/infrastructure boundary, not an unsafe application shortcut.
