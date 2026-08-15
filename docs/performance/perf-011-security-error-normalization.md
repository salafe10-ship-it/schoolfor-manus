# PERF-011 — Student Read Security Error Normalization

## Objective

Normalize expected Student Read security rejections to HTTP 403 without weakening authentication, authorization, TenantEngine validation, transaction-local context, or RLS.

## Root Cause

`GET /api/students` owns its transaction-local tenant validation because it uses `requirePermissionOnly`. Inside the route, `TenantIsolationError` was caught by a broad handler and wrapped as `DatabaseError`. The central error handler therefore returned HTTP 500 for a correctly rejected tenant, branch, academic-year, or target-school request.

## Implementation

Files changed:

- `server.ts` — Student Read catch now delegates classification to the focused normalizer.
- `src/middleware/studentReadError.ts` — maps `TenantIsolationError` and authorization failures to a generic 403; maps unexpected failures to a generic 500 without database details.
- `src/__tests__/perf011SecurityErrorNormalization.test.ts` — verifies 403/500 separation and detail redaction.

The public messages do not include SQL text, tenant identifiers, stack traces, connection strings, or tokens. Unexpected failures remain 500 and are not converted into 403.

## Staging Security Results

| Test | Result |
|---|---:|
| Missing session | 401 |
| Invalid token | 401 |
| Forged school query | 403 |
| Forged school header | 403 |
| Forged tenant target | 403 |
| Forged branch target | 403 |
| Invalid academic-year target | 403 |
| Genuine authorized Student Read | 200 |
| RLS on `public.students` | Enabled |
| `edupro_staging_app.rolbypassrls` | `false` |

Unexpected-error behavior is covered by the unit boundary test: a generic internal error remains a 500 `DATABASE_ERROR` with null public details. No fault injection, RLS change, service role, or Production access was used.

## Regression

SOP-001 completed with HTTP 201 on the first request and HTTP 200 with `idempotent=true` on the same-key retry. All synthetic PERF-011 records and the temporary Auth identity were removed from Staging.

## Certification

**PERF-011 security error normalization: CERTIFIED**

Student Read performance remains uncertified; this mission does not change the `<=300 ms` performance result.
