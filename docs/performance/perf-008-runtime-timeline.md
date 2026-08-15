# PERF-008 — Student Read Runtime Timeline

## Request path

```text
HTTP request
  -> authentication
  -> authorization
  -> transaction requested
  -> pool connection acquired
  -> transaction begin/configuration
  -> trusted tenant context
  -> tenant PostgreSQL context step
  -> Student PostgreSQL read
  -> mapping
  -> commit
  -> connection release
  -> response preparation / serialization
  -> client receives response
```

## Timeline semantics

The trace records elapsed time from request receipt. The values below are p50 values from the 20 sequential PERF-008 probe responses.

| Stage | p50 elapsed/span (ms) | Evidence interpretation |
|---|---:|---|
| Authentication complete | 173.110 | Remote identity validation occurs before business work. |
| Authorization complete | 0.039 span | Central permission decision is cheap in this path. |
| Pool connection wait | 0.083 span | Warm path is low, but its tail is not stable under probe concurrency. |
| Transaction acquire / begin configuration | 355.791 span | Transaction setup is a major lifecycle cost. |
| Trusted tenant context | 118.682 span | Trusted context injection includes a remote database step. |
| Tenant PostgreSQL step | 119.433 span | Context validation/setup round-trip. |
| Student PostgreSQL span | 238.322 span | Application-observed Student query step. |
| Mapping | 0.022 span | Not material. |
| Commit | 118.464 span | Remote commit lifecycle cost. |
| Release | 0.028 span | Not material. |
| Serialization preparation | 0.002 span | Not material. |

## Database diagnostic split

The same read was measured with a read-only EXPLAIN diagnostic inside the Staging transaction:

- Planning p50: 0.172 ms.
- Executor p50: 0.073 ms.
- EXPLAIN call round-trip p50: 119.265 ms.
- Executor p99: 1.743 ms.

The timeline therefore separates SQL execution from the time spent reaching and returning from PostgreSQL through the application driver/session.

## Final server handoff

Render application logs recorded completed server traces. Across the 10 log records retained in the log view:

- Server total p50: 1053.714 ms; p95: 2124.407 ms.
- Response residual p50: 0.414 ms; p95: 0.493 ms.

The residual after application timing is not material. The client wall-time p95 of 1916.698 ms is primarily accumulated upstream in authentication, transaction setup, tenant context, database round-trips, and commit rather than in JSON serialization.

## Tail behavior

The sequential client p99 reached 3136.559 ms. The trace showed a pool/transaction acquisition p99 of 1084.765 ms, while the warm pool p50 was 0.083 ms. This is a tail-latency problem, not a consistently expensive SQL executor problem.

## Concurrency timeline observation

With the diagnostic probe enabled, wall p95 was 2593.908 ms at concurrency 1, 2804.404 ms at concurrency 4, and 2713.780 ms at concurrency 8. Probe pool-wait p95 stayed around 727–729 ms while EXPLAIN executor p95 stayed below 0.13 ms. This isolates contention around session/transaction access from PostgreSQL executor work, while also marking the probe as an artificial diagnostic load.

## Security ordering confirmation

The observed application order remained:

```text
Authentication -> session/identity validation -> authorization -> tenant context -> business read
```

Hostile requests returned 401/403 as expected. No client-selected school or header value replaced trusted identity context.

## Cleanup confirmation

The temporary PERF-008 Student, Guardian, enrollment, academic-status, audit, outbox, and related rows were removed from Staging. The targeted verification query returned zero in all nine checked domains, and the refreshed Auth Users screen showed no PERF-008 temporary accounts.

## Conclusion

The timeline supports a multi-layer latency finding. No timing remediation was applied in PERF-008; the next phase must preserve this security ordering while reducing remote lifecycle and round-trip overhead.
