# PERF-006 — Remediation Recommendation for CTO Review

No remediation was implemented in PERF-006.

The next approved mission should independently address the two measured bottlenecks:

1. Analyze whether the TenantEngine lookup transaction can be reduced or combined without weakening transaction-local trusted context, RLS, tenant isolation, or fail-closed behavior.
2. Analyze pool contention under concurrency before changing pool size or deployment capacity. The observed pool wait is near zero at concurrency 1 and rises to approximately 970ms p95 at concurrency 8.

Any PERF-007 implementation must preserve:

- `edupro_staging_app` with `rolbypassrls=false`.
- RLS and trusted server-derived context.
- The existing Student SQL contract and API response.
- Request-scoped transactions and pool release.
- No Production access or configuration changes.
