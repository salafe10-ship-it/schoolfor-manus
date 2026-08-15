# PERF-012 — Production Readiness Gate

## Gate scope

This gate evaluates the Staging runtime only. Production remains outside scope and is not certified by this report.

## Verification results

- TypeScript: PASS.
- Full Vitest suite: PASS — 21 files, 125 tests.
- Vite production build: PASS; existing bundle-size and dynamic-import warnings remain.
- Server bundle: PASS; existing CommonJS `import.meta` warnings remain.
- Student Read security regression: PASS — valid 200, missing/invalid authentication 401, tenant/school/branch/academic-year spoofing 403.
- RLS: PASS for the inspected Student, Enrollment, Audit, and Outbox tables; RLS enabled on all inspected tables.
- Application role: PASS — `edupro_staging_app.rolbypassrls = false`.
- SOP-001: PASS — first request 201, same-key retry 200, idempotent result and identifiers matched.
- Synthetic PERF-012 user and all generated test records: PASS cleanup verification — zero remaining rows in the checked Student, Guardian, public-user, and Auth-user markers.

## Performance decision

| Gate | Decision | Evidence |
|---|---|---|
| Application-controlled database/query budget | PASS | PostgreSQL executor remained near 0.1 ms; no SQL change required. |
| End-to-end Staging Student Read SLA | NOT CERTIFIABLE CURRENT RUNTIME | Normal p95 1114.749 ms; new connection creation p95 approximately 887.926 ms. |
| Security and isolation gate | PASS | Exact 401/403/200 regression and RLS/bypass verification passed. |
| Production readiness | BLOCKED for performance certification | Current Staging runtime contains unisolated external infrastructure latency. |

## Final classification

**F — multiple external infrastructure bottlenecks.**

The application-side database work passes its measured budget, but the current end-to-end Staging runtime does not pass the requested latency target. This is not a production-readiness claim. A production-like performance gate requires an infrastructure configuration capable of isolating or removing the external connection-establishment bottleneck, followed by a new approved benchmark.

## Known limitations

- DNS, TCP, TLS/SSL, and pooler handshake timings were not separately available without prohibited changes.
- The REST control path is directional evidence only and is not a PostgreSQL substitute.
- Free-tier cold-start/runtime attribution is documented as unverified rather than assumed.
