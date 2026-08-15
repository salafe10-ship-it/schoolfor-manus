# PERF-013 — Validation Report

## Security regression

| Case | Expected | Observed |
|---|---:|---:|
| Valid Student Read | 200 | 200 |
| Missing authentication | 401 | 401 |
| Invalid bearer token | 401 | 401 |
| Forged school query | 403 | 403 |
| Forged school header | 403 | 403 |
| Forged tenant | 403 | 403 |
| Forged branch | 403 | 403 |
| Forged academic year | 403 | 403 |

Authentication, authorization, trusted TenantContext, transaction-local context, and fail-closed behavior were preserved.

## Database security verification

- RLS enabled on: `students`, `guardians`, `student_guardians`, `student_academic_status`, `student_status_history`, `student_status_transitions`, `enrollments`, `enrollment_history`, `enrollment_transfers`, `audit_events`, and `outbox_events`.
- `edupro_staging_app.rolbypassrls = false`.
- No RLS, policy, schema, or role change was made.

## SOP-001 regression

- First registration: HTTP 201, `idempotent=false`.
- Same idempotency key and payload: HTTP 200, `idempotent=true`.
- Student and Guardian identifiers matched between first request and retry.
- Temporary Student, Guardian, public identity, Auth identity, audit/outbox markers: zero after cleanup verification.

## Static and repository validation

- The PERF-013 change set is documentation-only; no application source was changed.
- TypeScript (`tsc --noEmit`): PASS.
- Full Vitest suite: PASS — 21 test files, 125 tests.
- Vite production build: PASS; existing large-chunk and dynamic-import warnings remain.
- `git diff --check`: PASS for the PERF-013 documentation.

## Gate decision

- APPLICATION PERFORMANCE: PASS for the measured database/query path.
- STAGING INFRASTRUCTURE SLA: NOT CERTIFIABLE on the current runtime.
- PRODUCTION PERFORMANCE: NOT CERTIFIED.
- Mission result: **READY FOR CTO REVIEW**.
