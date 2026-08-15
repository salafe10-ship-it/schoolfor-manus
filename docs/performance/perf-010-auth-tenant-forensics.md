# PERF-010 — Authentication and Tenant Forensics

## Scope

This report covers the Staging-only investigation required by PERF-010 for `GET /api/students?limit=100`. Production, schema, migrations, RLS policies, authentication architecture, authorization, and tenant architecture were not modified.

## Evidence Sources

- `src/middleware/trustedAuthentication.ts:106-170` — trusted login and session verification.
- `src/tenant/TenantEngine.ts:308-334` — centralized tenant context resolution and validation.
- `src/database/UnitOfWork.ts:211-231` — diagnostic attribution for the TenantEngine lookup and the canonical student read.
- `src/database/repositories/CanonicalStudentReadRepository.ts:151` — student query diagnostic counter.
- `src/performance/Perf004LatencyDiagnostics.ts:44-49,101-102` — counters and stage instrumentation.
- Staging runtime diagnostics from three warmups followed by twenty sequential requests, plus concurrency samples at 1, 4, and 8 requests.

## Remote-Call Inventory

The diagnostic counters consistently reported:

| Counter | Observed |
|---|---:|
| `authRemoteCalls` | 1 |
| `tenantDbQueries` | 1 |
| `studentDbQueries` | 1 |
| `otherDbQueries` | 0 |
| `transactions` | 1 |
| `contextCommands` | 1 |
| `poolAcquisitions` | 1 |
| `httpRemoteCalls` | 1 |
| `studentExplainQueries` | 1 only for diagnostic requests |

The one HTTP remote call is the required Supabase Auth identity/session verification. The one Tenant query is required to establish trusted tenant context before the Student query. The one Student query is the business read. No duplicate application-level remote call was found.

## Authentication Findings

1. Authentication is performed through the trusted session path and Supabase Auth verification.
2. The client-supplied identity, school, role, and tenant values are not used as the source of identity.
3. Removing the Auth verification would make the endpoint accept an unverified or stale session and would violate the approved authentication foundation.
4. No safe PERF-010 optimization was identified in this layer.

## Tenant Findings

1. Tenant context is resolved and validated before the canonical Student read.
2. The transaction-local trusted context is required by the approved RLS design.
3. Removing the Tenant lookup, moving it after the Student query, or caching it globally would weaken isolation or violate the approved architecture.
4. No cross-tenant data was returned during the security checks.

## Security Verification

| Test | Result |
|---|---|
| Missing authentication | Blocked with HTTP 401 |
| Invalid authentication | Blocked with HTTP 401 |
| Forged school query | Blocked with HTTP 403 |
| Forged school header | Blocked with HTTP 403 |
| Forged tenant header | Blocked; current outer route maps the invalid-target error to HTTP 500 |
| Forged branch header | Blocked; current outer route maps the invalid-target error to HTTP 500 |
| Forged academic-year header | Blocked; current outer route maps the invalid-target error to HTTP 500 |
| RLS enabled on `public.students` | Verified |
| `edupro_staging_app.rolbypassrls` | Verified `false` |

The last three cases are fail-closed from a data-access perspective, but their HTTP status mapping remains a pre-existing defect: invalid target input should be normalized to 403 rather than 500. It was not changed because PERF-010 forbids authorization, tenant, and error-architecture changes.

## Decision

No redundant Auth or Tenant remote call was demonstrated. Removing either would violate the required trust boundary. Further improvement requires an explicitly approved architecture or platform investigation outside PERF-010.
