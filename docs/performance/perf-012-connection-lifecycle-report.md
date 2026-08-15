# PERF-012 — Connection Lifecycle Report

## Scope and safety

This report covers only the Staging connection lifecycle. No production access, pool-size change, plan change, cache, replica, schema, migration, function, or API change was made.

## Lifecycle stages measured

1. Pool lease requested.
2. Existing lease availability wait.
3. Pool `connect()` resolution and newly created connection observation.
4. Transaction begin and transaction-local trusted context setup.
5. Application transaction work.
6. PostgreSQL executor measurement.
7. Commit and lease release.

The current safe instrumentation records the aggregate pool-connect/creation interval. It does not claim to split DNS, TCP, TLS/SSL, or pooler handshake sub-stages.

## Evidence by concurrency level

| Load | Warm lease acquisition | New lease acquisition/creation | Waiting count | Executor | Occupancy |
|---|---:|---:|---:|---:|---:|
| C1 | 0.071 ms | 0 ms | 0 | ~0.090 ms | ~719 ms |
| C4 | 0.084 ms sample | up to 902.855 ms | 0 | ~0.059–0.119 ms | ~710–770 ms |
| C8 | 0.107 ms sample | up to 752.986 ms | 0 | ~0.057–0.102 ms | ~707–719 ms |

Aggregate comparison across C1/C4/C8:

- Warm leases: n=6; acquisition p95 approximately 0.089 ms.
- New leases: n=7; acquisition/creation p95 approximately 887.926 ms; maximum 902.855 ms.
- Pool `waitingCount`: 0 in every observed sample.
- Database executor: approximately 0.1 ms, not a material contributor to the end-to-end delay.

## Attribution

The slow interval is associated with newly established remote pooled connections, not with waiting for an exhausted pool and not with Student SQL execution. Render outbound path, Supabase pooler/network, and free-tier runtime behavior remain combined external contributors. The exact free-tier mechanism is unverified.

## Operational decision

Do not weaken RLS, use a service role, bypass TenantEngine, change pool settings, disable SSL, or optimize the Student query based on this evidence. The safe next step is an infrastructure/hosting decision or a separately approved network-level measurement mission.
