# STU-AFFAIRS-P0-006-08 — Authorization Enforcement Feasibility

Status: `AUTHORIZATION ENFORCEMENT FEASIBLE — SECURITY APPROVAL REQUIRED`

## Scope

Static feasibility review only. No PermissionRegistry, AuthorizationEngine, TenantEngine, middleware, API, database, RLS, SQL, migration, or UI changes were made.

## Full enforcement path

`Permission Definition → Role Assignment → Authenticated User → Permission Resolution → Authorization Check → Route Middleware → Business Operation → Audit`

The current code contains each layer, but the proposed Student Affairs contract is not fully enforceable without operation-specific route permissions and explicit security approval.

## Feasibility matrix

| Area | Evidence | Classification |
|---|---|---|
| Permission definition | `PermissionRegistry` normalizes canonical and legacy strings | `PROVEN` |
| Role mapping | `RoleResolver` maps static roles and can load database assignments | `PROVEN / LEGACY FALLBACK` |
| Database role assignment | `DatabaseRolePermissionSource` queries trusted identity/scope tables | `PROVEN when driver configured` |
| Unknown permission handling | `AuthorizationEngine` returns `UNKNOWN_PERMISSION` and middleware denies | `PROVEN` |
| Invalid role handling | Resolver/engine deny invalid roles | `PROVEN` |
| Permission check | Engine is a normalized string/set membership check | `PROVEN — ACTION-ONLY` |
| Resource/object context | Engine receives context but does not use it in the allow decision | `NOT PROVEN` |
| Branch/school authorization | Tenant middleware/tenant engine provide separate checks | `PARTIAL — NOT ENGINE-CENTRALIZED` |
| Denial audit | Middleware calls `recordAuthorizationDenial` | `PROVEN` |
| Multiple permissions | `requireAnyPermission` exists | `PROVEN` |
| Operation-specific Student lifecycle permissions | Routes currently use broad `Student.Write` | `NOT FEASIBLE WITHOUT ROUTE/REGISTRY WORK` |
| Maker/checker | No general support proven in AuthorizationEngine | `REQUIRES SECURITY/DOMAIN DESIGN` |
| Reason/version/idempotency | Business services/routes, not authorization engine | `BUSINESS-LAYER DEPENDENCY` |
| UI/backend parity | Client helper exists, but no single operation contract is proven | `NOT PROVEN` |

## Important technical risks

1. `AuthorizationEngine` caches permissions by role key, while database assignments are identity/scope-specific. Middleware clears the cache per request, but direct engine consumers can still be exposed to role-level cache semantics.
2. Static `admin` and `schooladmin` role definitions contain `*`; the database loader rejects wildcard assignments. This creates two authorization modes that require an explicit security decision.
3. `requestContext` reads branch values from request headers/query/body, but the engine does not make scope-aware authorization decisions from that context.
4. `requirePermissionOnly` intentionally omits wrapper tenant validation; each endpoint must prove its own trusted tenant resolution.
5. No maker/checker or operation approval primitive exists in the central authorization engine.

## Feasibility decision

The current architecture can carry separate permission strings and route checks, but it cannot safely enforce the complete proposed contract without bounded security-approved changes. Therefore:

`AUTHORIZATION ENFORCEMENT FEASIBLE — SECURITY APPROVAL REQUIRED`.
