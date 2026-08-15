# STU-AFFAIRS-P0-006-11 — Authorization Hardening Change Map

Status: `READINESS ONLY — NO FILES MODIFIED`

| File/area | Required change if approved | Reason | Risk | Dependency | Isolatable? |
|---|---|---|---|---|---:|
| `src/authorization/AuthorizationEngine.ts` | Consume approved scope-aware decision and safe cache contract | Prevent role-only privilege leakage | High | Security/cache decision | Yes |
| `src/authorization/PermissionCache.ts` | Support approved scoped key/revision/invalidation | Align cache with identity/scope assignments | High | Revision owner | Yes |
| `src/authorization/PermissionRegistry.ts` | Add only security-approved operation permissions | Separate lifecycle capabilities | Medium | Permission approval | Yes |
| `src/authorization/RoleResolver.ts` | Apply authoritative role source and approved wildcard policy | Remove dual-mode ambiguity | High | Security/Operations | Yes |
| `src/middleware/authorization.ts` | Pass trusted context and preserve denial audit/fail-closed | Enforce route decision consistently | High | Scope policy | Yes |
| `src/middleware/auth.ts` | Keep ordering and endpoint-owned tenant validation explicit | Prevent `requirePermissionOnly` misuse | Medium | Route audit | Yes |
| Student Affairs lifecycle route declarations | Replace broad `Student.Write` only after approval | Operation-specific enforcement | High | Registry + roles + owner policy | Yes |
| `src/authorization/ClientAuthorization.ts` | Keep UI hints non-authoritative; align approved capability names | Avoid UI/backend mismatch | Medium | Permission contract | Yes |
| Direct service consumers | Review `StudentRegistrationService` and guardian service checks | Avoid bypass/inconsistent permission checks | High | Consumer inventory | Yes |
| `src/authorization/AuthorizationAuditHooks.ts` | Only approved denial/cache metadata additions | Preserve compliance evidence | Low/Medium | Audit policy | Yes |
| Results/Graduation/Transfer/Storage/DB/RLS | `DO NOT CHANGE` in this package | Explicit scope boundary | N/A | Separate missions | Yes |

## Classification

### MUST CHANGE if implementation is approved

AuthorizationEngine, PermissionCache, middleware binding, and route permission declarations selected by the approved contract.

### SHOULD CHANGE only if approved

PermissionRegistry, RoleResolver, direct consumers, client capability hints, and audit metadata.

### DO NOT CHANGE

Results, Graduation, TransferOperation, Student Read/Export, Import, Binary Storage, database schema, RLS, production, or UI behavior outside capability visibility.
