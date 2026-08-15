# PERF-014 — Failure RCA and CTO Decision Request

## Mission status

**BLOCKED — required production-like isolated Staging runtime is not available without an out-of-scope infrastructure change.**

## Objective that could not be completed

PERF-014 requires a second, isolated Staging runtime that is materially closer to the intended production runtime, followed by the same Student Read benchmark used by PERF-013. The purpose is to distinguish application performance from the current Render Free runtime limitation.

## Direct evidence

Render project inspection found:

- One Production environment with one Node service: `edupro-school-erp`.
- One Staging environment with one Node service: `edupro-school-erp-staging`.
- Environment capacity is already `2/2`; no additional project environment is available.
- No separate Staging runtime closer to Production exists in the project.
- Staging exposes a server-side `DATABASE_URL` key; no separate `DIRECT_URL` key was available for a safe direct-path comparison.
- The current Staging service is the same Render Free runtime measured and accepted under PERF-013.

PERF-013 already established the baseline: warm pool reuse is sub-millisecond, new remote connection establishment is approximately 720–730 ms, pool waiting is zero, and PostgreSQL execution is approximately 0.1 ms. Re-running the same service would not answer the PERF-014 question.

## Root cause

The mission is blocked by missing isolated infrastructure, not by an application defect. A production-like comparison requires one of the following out-of-scope changes:

1. Provisioning an additional isolated Staging service with an appropriate runtime plan.
2. Upgrading or changing the existing Staging runtime.
3. Supplying a separate server-side-only Staging `DIRECT_URL` for a controlled comparison.

Each option requires infrastructure/plan/secret authority that was not granted by PERF-014 itself and may create billing or topology consequences.

## Safety checks

- Production was not accessed or modified.
- No Production credentials were read, copied, or exposed.
- No application code, schema, RLS, authentication, authorization, tenant context, or API contract was changed.
- No plan upgrade was initiated.
- No database writes were executed for this blocked mission.

## Safest recommendation

Keep the repository and current Staging service unchanged. CTO must explicitly approve one isolated runtime path and its billing/secret ownership before PERF-014 can resume. After that approval, repeat the exact PERF-013 benchmark and compare the results in the three PERF-014 deliverables.

## Awaiting CTO decision

Required decision: provide an approved non-Production, production-like Staging runtime or explicitly authorize the required Render/Supabase infrastructure change. Until then, the only defensible status is **BLOCKED**.
