# PERF-008 — Remediation Recommendation for PERF-009

## Status

This document is a recommendation only. PERF-008 was diagnostics-only and implemented no performance remediation.

## Root-cause classification

**Final decision: MULTIPLE BOTTLENECKS.**

1. Database/network/driver round-trip latency is material: the EXPLAIN call round-trip was approximately 119 ms p50 while PostgreSQL executor time was approximately 0.073 ms p50.
2. Transaction lifecycle and remote context/commit work add repeated approximately 118–120 ms spans.
3. Authentication is material at approximately 173 ms p50 and 334 ms p95 in the 20-response trace.
4. Pool wait is normally low in the warm sequential trace but shows a roughly 728 ms tail under diagnostic concurrency.
5. Render/application response residual is small, approximately 0.414 ms p50 and 0.493 ms p95 in the available server-log sample.

## PERF-009 investigation order

### 1. Preserve security invariants first

Any optimization must retain the existing order and trusted sources:

```text
Authentication -> session validation -> authorization -> tenant context -> Student read
```

Do not remove tenant context validation, replace trusted identity with client input, bypass RLS, or use service-role credentials in the request path.

### 2. Re-measure without diagnostic overhead

Run a controlled warm/cold matrix with the PERF-008 probe disabled:

- one authenticated user and one tenant context;
- sequential warmup followed by 20 requests;
- concurrency 1, 4, and 8;
- cold Render instance versus warm instance;
- client wall time, server timeline, pool wait, and database round-trip.

This separates normal production behavior from the EXPLAIN diagnostic overhead observed in PERF-008.

### 3. Profile authentication separately

Measure token validation and any remote identity lookup independently from database work. The PERF-008 p95 authentication span exceeded the overall target by itself. Any change must include missing-token, invalid-token, session-expiry, logout, and tenant/role spoofing regression tests.

### 4. Reduce unnecessary transaction lifecycle round-trips

Review the transaction begin/configuration, trusted-context, tenant query, Student query, commit, and release sequence as one secure unit. Consider only evidence-backed reductions in remote calls or session setup. Preserve request scoping, rollback semantics, tenant context, and RLS compatibility. Do not merge this into a long-lived shared transaction or static context.

### 5. Investigate pool behavior without changing Production

Use Staging-only metrics to distinguish real pool exhaustion from probe-induced queueing. Capture pool size, active connections, waiters, acquire duration, release duration, and connection errors. Any pool configuration change requires a separate approved change with concurrency, leak, timeout, and cross-tenant regression tests.

### 6. Avoid speculative SQL/index work

The measured plan and executor time do not support an index rebuild or query rewrite as the first fix. Revisit SQL only if the no-probe baseline or a larger realistic dataset shows executor time becoming material.

### 7. Validate the response boundary

The current server-log residual is small, but repeat the measurement with Render metrics and client timing to rule out cold-start, platform, or network effects at the exact time of the request.

## Required PERF-009 acceptance gates

- Student read p95 <= 300 ms on the agreed Staging workload.
- No 401/403 regression for missing/invalid/forged identity or tenant inputs.
- No cross-tenant read, update, or delete exposure.
- Single request-scoped transaction behavior remains intact.
- Commit/rollback/concurrency tests remain green.
- SOP-001 first request remains 201 and same-key retry remains 200/idempotent.
- No Production changes until Staging evidence is reviewed and CTO-approved.

## Explicit non-recommendations

Do not disable authentication, skip tenant context, trust client school/branch values, increase limits blindly, add indexes without plan evidence, or certify the current path based on the low PostgreSQL executor time alone.

## CTO decision requested

Approve or reject PERF-009 as a separate remediation mission. PERF-008 is complete as a forensic diagnostic package and does not authorize implementation of any item above.
