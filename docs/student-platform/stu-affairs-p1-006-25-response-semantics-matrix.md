# STU-AFFAIRS-P1-006-25 — Response Semantics Matrix

## Status semantics

| Condition | Canonical expected status | Observed / static status | Client distinguishability |
|---|---:|---:|---|
| New student committed | 201 | 201 on canonical registration | Clear |
| Idempotent replay | 200 | 200 with `idempotent` on canonical registration/documents | Clear on canonical paths |
| Student update committed | 200 | 200 | Clear |
| Guardian update committed | 200 | 200 | Clear |
| Document metadata committed | 201 | 201 or 200 idempotent | Clear |
| Read with zero rows | 200 | 200 with empty data/list | Must be documented as empty, not failure |
| Validation error | 400 | Preserved on canonical paths; Legacy lifecycle wrapped to 500 | Inconsistent |
| Business rule rejection | 422 | Preserved by central handler only when not wrapped; Legacy lifecycle often becomes 500 | Inconsistent |
| Authorization denial | 403 | Middleware/typed error expected; per-route wrappers may hide service errors as 500 | Inconsistent |
| Tenant denial | 403/404 policy-dependent | Canonical read normalizes; Legacy service route handling not uniform | Inconsistent |
| Not found | 404 | Canonical/document paths preserve; Legacy wrappers convert to 500 | Inconsistent |
| Version conflict | 409 | Canonical/document paths preserve; Legacy update wrappers convert to 500 | Inconsistent |
| Idempotency conflict | 409 | Canonical/document paths use typed conflict; Bulk has no proven contract | Inconsistent / missing Bulk |
| Unknown Bulk operation | 4xx | Static path can return 200 success with empty results and `processedCount` | Unsafe false-success envelope |
| Transaction unavailable | 503/500 policy | Often wrapped as `DATABASE_ERROR` 500 | Distinction lost |
| Failed mutation | 5xx or typed domain failure | Canonical paths throw before success; Legacy wrappers obscure root category | Needs contract harmonization |
| Graduation not ready | 409 | Explicit 409 `GRADUATION_NOT_READY`, `success:false` | Clear |

## Response envelope requirements

Every mutating Student Affairs API should consistently return:

- `success` matching committed state, never intent or no-op.
- `data` only when the operation result is known.
- stable `errorCode` on failure.
- `requestId` and `correlationId` in headers or metadata.
- `version` and `idempotent` for replayable writes.
- explicit `persistence` and workflow metadata only when proven.
- no raw database details or secrets.

