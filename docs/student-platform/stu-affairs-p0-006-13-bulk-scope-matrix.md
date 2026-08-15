# STU-AFFAIRS-P0-006-13 — Bulk Scope and Authorization Matrix

| Control / question | Static evidence | Classification | Impact |
|---|---|---|---|
| Authentication | `authenticateRequest` verifies trusted Supabase session and stores trusted identity | PROVEN SAFE | Identity is not client-selected |
| Actor identity | Service audit metadata is built from trusted request identity | PROVEN SAFE at request boundary | Client cannot choose actor in this route contract |
| School source | Route uses `(req as any).user.schoolId` | PROVEN SAFE at request boundary | Body school spoofing is rejected by authentication middleware |
| Tenant validation | `requirePermission` indirectly invokes `tenantValidationMiddleware` before the route | PROVEN SAFE at request boundary | Request-level tenant/school/branch/year target is checked |
| Operation permission | One broad `Student.Write` permission covers all six operations | PROVEN RISK | No separate decision for insert/update/delete/transfer/promote/archive |
| Operation value authorization | Allow-list now exists for runtime operation values | PROVEN SAFE for unknown operation rejection | Does not establish business authorization for each valid operation |
| Per-item student scope | Legacy lookups/writes use student ID + school ID; no item TenantContext contract | PROVEN RISK / PARTIAL | Cross-school item is constrained; branch/year ownership is not proven |
| Branch scope | `StudentRepository.update` predicates omit branch; transfer accepts arbitrary `branchId` for privileged roles without target-branch existence/scope proof | PROVEN RISK | Same-school cross-branch mutation is not fully constrained by trusted branch context |
| Academic-year scope | Bulk service does not receive/use academic year; Legacy writer does not predicate by academic year; Promote contains a hardcoded year | PROVEN RISK / DOMAIN DEPENDENCY | Year-specific operation cannot be proven to target the trusted academic year |
| Cross-school update | Legacy update query includes `.eq('school_id', schoolId)` and StudentService rejects a changed `schoolId` update | PROVEN SAFE for observed update path | No direct cross-school update path proven statically |
| Cross-school transfer | `targetSchoolId` is accepted by transfer DTO but not applied by the observed writer | PROVEN SAFE against that specific assignment / CONTRACT GAP | No canonical cross-school transfer behavior is proven |
| Per-item authorization | No per-item authorization decision is visible inside Bulk loop | NOT PROVEN / SECURITY GAP | A single route permission is reused for every item and operation |
| Bulk Transfer protection | Legacy transfer path, nested UnitOfWork risk, broad permission | PROVEN RISK / P0 DEPENDENCY | Must remain blocked until TransferOperation contract |
| Tenant-aware repository requirement | Bulk service calls Legacy repositories that use school argument rather than required TenantContext | PROVEN RISK | Branch/year and canonical tenant invariants are not carried to writer |
| Transaction boundary | Outer Bulk UoW can call sub-services that open inner UoWs | PROVEN RISK | Atomicity is not proven; nested UoW can fail |
| Persistence source | Legacy repository can fall back to FallbackStorage after Supabase failure | PROVEN RISK | A response may reflect local fallback rather than committed PostgreSQL state |
| Audit scope | Legacy audit receives school/user but canonical branch/year/operation scope is not consistently proven | PROVEN RISK | Audit may not fully explain item-level scope and operation decision |
| Idempotency | No Bulk idempotency key contract is proven | DEPENDENCY | Replay/deduplication is unresolved |
| Version | Legacy update checks version only if item data supplies it; Bulk contract does not require it | PROVEN RISK | Stale item behavior is not uniformly guaranteed |
| Outbox/history | Legacy lifecycle branches do not prove canonical history/outbox | DEPENDENCY | Downstream consistency is unresolved |
| Fallback after failed authorization | No static path found that executes service after middleware denial | PROVEN SAFE for observed route order | Runtime test not performed by order |

