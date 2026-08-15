# STU-AFFAIRS-P1-006-14 — Tenant and Object Scope Matrix

Status: `AUDIT ONLY — NO TENANT CHANGES`

| Target | Trusted identity/context evidence | Client-value rejection evidence | Object-level scope result |
|---|---|---|---|
| Student list | `tenantEngine.resolve/validate` in request flow | Authentication mismatch checks plus server context | `PROVEN / OBSERVABILITY PARTIAL` |
| Student export | `resolveStudentTenantContext` and bounded filters | Filters do not choose tenant/school/branch | `PROVEN` |
| Student write | Trusted context and canonical repository for supported paths | Tenant/school/branch derived server-side | `PARTIAL — legacy operations remain` |
| Guardian target | Context plus canonical guardian service | Target student is server path parameter and scope-checked | `PROVEN for reviewed canonical path` |
| Document target | `studentDocumentContext` and repository scoped queries | Client cannot select trusted tenant context | `PROVEN for metadata paths` |
| Timeline student ID | Context and server route target | No client tenant/school/branch override accepted | `PROVEN at route/repository level` |
| Lifecycle student ID | Middleware and service path | Legacy service target and operation-specific rules require review | `PARTIAL / DOMAIN BLOCKED` |
| Transfer target branch/school | Middleware exists; legacy `targetSchoolId` behavior not proven | Cross-school/branch business authorization not proven | `P0 BLOCKED` |
| Bulk item targets | Route accepts `operation/items` | Per-item object authorization not proven in route contract | `NOT PROVEN` |

## Scope rules confirmed by audit

- Client-supplied `schoolId`/`school_id` mismatch is rejected by authentication checks and recorded.
- Student Affairs canonical paths resolve trusted tenant context rather than trusting request body identity.
- The existence of middleware does not prove cross-object authorization for every lifecycle command.
- Transfer and bulk target scope require separate security/operations decisions.

## Required proof before authorization closure

1. Every lifecycle operation has an explicit permission or approved policy.
2. Every target student and related object is verified in the trusted tenant/school/branch scope.
3. Transfer destination scope is validated by trusted context and approved business authorization.
4. Bulk commands authorize each operation and each target, not only the request envelope.
5. Failed authorization produces a denial audit event and no success-shaped response.
