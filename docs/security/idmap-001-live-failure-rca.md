# IDMAP-001-LIVE-002 — Authenticated Diagnostic Invocation Gap

## Mission status

`IDMAP-001 = IMPLEMENTED — CERTIFICATION BLOCKED`

The mapping implementation is deployed and the live authentication/session gates pass. The final PostgreSQL connection-identity proof cannot be certified because the existing application UI exposes no natural workflow that invokes `/api/internal/staging/connection-identity`.

## Environment evidence

- Service: `edupro-school-erp-staging`
- Environment: Staging only
- Render deployment: `dep-d9sobp37uimc73bsontg`
- Commit: `d9a50161f6f2208f5628d1e8dd699fdfcf5a3da3`
- Render build: successful
- Render startup: successful
- PostgreSQL connection: established successfully in Render logs
- Public health endpoint: HTTP 200, `success=true`, `status=healthy`

## Verified live gates

- Supabase Auth login: PASS
- Trusted school UUID mapping: PASS
- Dashboard session creation: PASS
- Browser refresh/session restoration: PASS
- Unauthenticated diagnostic request: HTTP 401 `AUTHENTICATION_ERROR` — PASS
- Temporary Auth and application fixtures: removed
- Final fixture row verification: all zero
- Production, schema, RLS, and configuration: untouched

## Blocked evidence

The required authenticated invocation of `/api/internal/staging/connection-identity` was not executed. The route is protected and is not called by an existing UI action. Calling it through SQL Editor, a direct service/API bypass, `service_role`, `SET ROLE`, or extracting the browser token would violate the CTO execution contract.

Therefore the following values remain unverified in the required live path:

- `current_user`
- `session_user`
- `rolsuper`
- `rolbypassrls`

No claim is made about those values.

## Root cause

The implementation provides the protected diagnostic endpoint, but no application screen or normal client workflow currently invokes that specific endpoint. The live browser session proves authentication and session restoration, not the endpoint's authenticated PostgreSQL identity output.

## Safest recommendation

Keep the implementation and Staging environment unchanged. Add a narrowly scoped, CTO-approved application test path or approved test harness in a later mission, then invoke the existing endpoint through the normal authenticated request path and capture only the four required non-secret fields. Do not modify the endpoint, database, RLS, roles, or Production as part of this blocked certification.
