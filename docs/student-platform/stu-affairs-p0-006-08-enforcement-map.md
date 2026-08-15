# STU-AFFAIRS-P0-006-08 — Authorization Enforcement Map

Status: `STATIC MAP — NO IMPLEMENTATION`

| Contract point | Current mechanism | Can support proposed contract? | Required gate |
|---|---|---:|---|
| Canonical permission registration | `PermissionRegistry` | Yes, string registration | Security approval |
| Legacy alias normalization | `LEGACY_ALIASES` | Yes, but must be governed | Security decision |
| Role-to-permission resolution | `RoleResolver` | Yes, with database assignment | Security + migration decision |
| Authenticated identity | Trusted auth middleware | Yes | Existing auth baseline |
| Permission middleware | `requirePermission` | Yes, one permission per route | Route changes require approval |
| Authorization-only middleware | `requirePermissionOnly` | Yes, but endpoint must own tenant validation | Route review |
| Tenant validation | `tenantValidationMiddleware` / `TenantEngine` | Separate from permission engine | Scope review |
| Object authorization | Service/repository checks | Partial and operation-dependent | Security/domain design |
| Denial audit | `AuthorizationAuditHooks` | Yes | Audit availability review |
| Approval workflow | No central primitive proven | Not without design | Owner/security decision |
| Version/idempotency/reason | Business-layer contracts | Not an authorization primitive | Domain contract |
| UI capability visibility | `ClientAuthorization` helper | Partial | UI/backend parity review |

## Student Affairs route map

| Route family | Current permission | Feasibility |
|---|---|---|
| Read/export | Dedicated permissions | Feasible |
| Registration | Dedicated permission | Feasible |
| Guardian | Broad Student.Write on update; Guardian.Link registered | Requires contract decision |
| Documents | Dedicated permissions | Feasible |
| Timeline | Student.View | Feasible technically; sensitivity decision required |
| Lifecycle | Student.Write for multiple commands | Requires operation-specific route contract |
| Transfer | Student.Write | Remains P0 blocked |
| Bulk | Student.Write plus request operation | Requires per-item and per-operation contract |
| Graduation | Student.Write | Must remain withheld/domain-gated |

## Security approval questions

- Are static wildcard admin roles allowed in production?
- Must all permissions be database-driven in live environments?
- Should cache keys include identity and scope rather than role only?
- Is object scope evaluated centrally or in each domain service?
- Which operations require maker/checker approval?
- Which client capabilities may be displayed before server authorization?

No answer is inferred by this map.
