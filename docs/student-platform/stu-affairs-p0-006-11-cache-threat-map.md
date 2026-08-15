# STU-AFFAIRS-P0-006-11 — Authorization Cache Threat Map

Status: `STATIC PROOF — NO LIVE TEST OR MUTATION`

| Threat path | Current exposure | Required control | Status |
|---|---|---|---|
| User A → role cache → User B | Engine cache key is role; middleware clears per request, direct consumers remain relevant | Identity/scope/revision key or no shared cache | `REQUIRES SECURITY APPROVAL` |
| School A → cached authorization → School B | Role cache lacks school scope | Include tenant/school/branch and fail closed | `REQUIRES SECURITY APPROVAL` |
| Branch A → cached authorization → Branch B | Role cache lacks branch scope | Include branch and assignment revision | `REQUIRES SECURITY APPROVAL` |
| Permission source unavailable | Database loader can fail and middleware denies | Preserve deny; no static broad fallback in live mode | `DESIGNED` |
| Scope unavailable | Engine context is not used in allow decision | Central scope policy plus repository predicates | `DESIGNED` |
| Wildcard bypass | Static admin/schooladmin wildcard definitions exist | Explicit production/wildcard decision | `OPEN DECISION` |
| Direct engine consumer | `ClientAuthorization` and services call engine/helper directly | Restrict enforcement to approved server policy path | `REVIEW REQUIRED` |
| `requirePermissionOnly` misuse | Tenant validation is endpoint-owned | Route contract tests and explicit context assertion | `REVIEW REQUIRED` |
| Sensitive operation without approval | No central maker/checker primitive | Domain/security approval policy | `REQUIRES DOMAIN DESIGN` |

## Result

The hardening changes are separable from business modules, but implementation cannot begin until the open security and operations decisions are recorded.
