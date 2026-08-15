# PERF-005 — Trusted Transaction Context Round-Trip Remediation

## Scope

PERF-005 optimized only the trusted transaction-context setup path in the Staging environment. Production, database schema, RLS policies, Student SQL shape, pool size, API contracts, and business rules were not changed.

## Previous path

Each request used two request-scoped PostgreSQL transactions: one for tenant-context resolution and one for the canonical Student read. Each transaction applied up to six transaction-local settings independently:

- `app.tenant_id`
- `app.school_id`
- `app.branch_id`
- `app.academic_year`
- `app.user_id`
- `app.role`

The six settings were written with `set_config(..., true)`. The warm PERF-004 trace measured approximately 722ms p95 for each trusted-context stage and 12 context round trips per request.

## Remediation

`PostgresTransactionDriver.applyTrustedContext` now emits one parameterized PostgreSQL command containing all present setting/value pairs. Each value remains bound as a parameter and every `set_config` call retains the third argument `true`, so the settings remain transaction-local.

The transaction order remains:

1. Acquire a connection.
2. Begin the transaction.
3. Set the transaction isolation level.
4. Apply trusted context in one parameterized command.
5. Execute the business query.
6. Commit, or roll back on failure.
7. Release the connection.

No session-level settings, interpolated context values, shared transaction state, or pool reuse across requests were introduced.

## Measured effect

| Metric | PERF-004 baseline | PERF-005 result |
|---|---:|---:|
| Tenant trusted-context p95 | 722.042ms | 119.364ms |
| Student trusted-context p95 | 721.345ms | 119.272ms |
| Context round trips/request | 12 | 2 |
| Business queries/request | 2 | 2 |
| Tenant pool acquisition p95 | 0.159ms | 0.116ms |
| Student pool acquisition p95 | 0.071ms | 0.091ms |
| Warm Student Read wall p95 | 3243ms | 1712ms |
| Warm Student Read wall p99 | 3268ms | 1719ms |

The trusted-context bottleneck was materially reduced. The Student Read target of p95 <=300ms is still not met.

## Security invariants preserved

- `edupro_staging_app` remains the application database role.
- The application role remains non-bypass-RLS.
- RLS remains enabled and authoritative.
- Tenant, school, branch, academic year, user, and role values remain server-derived from trusted identity/context.
- Missing or invalid trusted context fails closed.
- Context remains transaction-local.
- Client-supplied tenant and school values remain rejected.

## Next measured bottleneck

The remaining warm p95 is dominated by the combined authentication stage, the two transaction/query paths, and the remaining response/network residual after serialization. The next optimization must instrument or reduce those measured costs; no unmeasured optimization is approved by this report.
