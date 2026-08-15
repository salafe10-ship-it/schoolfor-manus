# STU-AFFAIRS-P1-006-25 — Student Affairs API Contract Audit

## Mission mode

Static API contract and response-semantics audit only. No endpoint, service, repository, database, migration, RLS, authorization, tenant, storage, staging, or production change was made. No business request was executed.

## Executive decision

`P1-006-25 = API CONTRACT AUDIT COMPLETE — CONTRACT GAPS IDENTIFIED`

The canonical registration, update, guardian, document metadata, export, and read paths have substantially clearer success semantics than the Legacy lifecycle and Bulk paths. Material gaps remain:

1. Promote/Re-enroll/Dismiss/Archive/Transfer catch all failures and wrap them as `DATABASE_ERROR`/HTTP 500, hiding validation, conflict, authorization, and not-found semantics.
2. Bulk can return generic success for an unknown operation with `processedCount` equal to input length and no mutation.
3. Bulk lacks a visible resolved `TenantContext`, operation-specific permission, and per-item scope/authorization contract.
4. Timeline returns `success: true` from an audit-log projection without proving a canonical student timeline or returning an explicit empty-state contract.
5. POST `/api/students` is a compatibility route with mixed create/update semantics and a narrower canonical field projection than the legacy UI model.
6. Several successful legacy responses do not expose request/correlation, version, idempotency, or persistence metadata consistently.

No runtime evidence was collected for a success-after-failed-mutation or unauthorized mutation; therefore the ordered P0 stop condition was not triggered.

## Endpoint inventory

| Endpoint | Auth | Permission | Tenant context | Mutation/read | Transaction | Success semantics | Error semantics | Contract status |
|---|---|---|---|---|---|---|---|---|
| `GET /api/students` | `authenticateRequest` | `Student.Read` only | Resolved and validated inside read UoW | Read | Read UoW | 200 with canonical result and diagnostics metadata | Read errors normalized; expected authorization is not exposed as internal detail | ACCEPTABLE WITH DOCUMENTED LIMITS |
| `GET /api/students/export` | `authenticateRequest` | `Student.Export` | `resolveStudentTenantContext` | Read/export | Service-defined export path | 200 XLSX only after generator returns; audit success recorded first | Validation is audited as rejected; other failures preserved to central handler | ACCEPTABLE |
| `POST /api/students` create | `authenticateRequest` | `Student.Write` | `resolveStudentTenantContext` | Create | Canonical registration UoW | 201 new, 200 idempotent; persistence/workflow metadata | Central AppError semantics preserved | ACCEPTABLE / COMPATIBILITY ROUTE |
| `POST /api/students` update | `authenticateRequest` | `Student.Write` | `resolveStudentTenantContext` | Update | Canonical PostgreSQL writer | 200 with canonical persistence metadata | Central AppError semantics preserved | ACCEPTABLE / NARROW PATCH |
| `POST /api/student-registration` | `authenticateRequest` | `Student.Registration.Create` | `resolveStudentTenantContext` | Create | Single request-scoped UoW | 201 new, 200 idempotent; requires `Idempotency-Key` | Validation and conflicts preserve typed errors | CANONICAL |
| `PATCH /api/students/:studentId/guardian` | `authenticateRequest` | Broad `Student.Write` | `resolveStudentTenantContext` | Update | Canonical guardian service | 200 with guardian result and canonical persistence metadata | Typed errors preserved | ACCEPTABLE / PERMISSION REVIEW |
| `GET /api/student-document-categories` | `authenticateRequest` | Document view | Resolver middleware | Read | Service transaction | 200 array, including empty array | Typed errors preserved | ACCEPTABLE |
| `POST /api/student-document-categories` | `authenticateRequest` | Document create | Resolver middleware | Create | Service transaction | 201 new, 200 idempotent | Typed errors preserved | ACCEPTABLE |
| `PATCH /api/student-document-categories/:id` | `authenticateRequest` | Document create | Resolver middleware | Update | Service transaction | 200 result | Typed conflict/version errors preserved | ACCEPTABLE |
| `GET /api/student-documents` | `authenticateRequest` | Document view | Resolver middleware | Read | Service transaction | 200 rows + pagination meta | Typed errors preserved | ACCEPTABLE |
| `GET /api/students/:studentId/documents` | `authenticateRequest` | Document view | Resolver middleware | Read | Service transaction | 200 rows + pagination meta | Typed errors preserved | ACCEPTABLE |
| `POST /api/students/:studentId/documents` | `authenticateRequest` | Document create | Resolver middleware | Create | Service transaction | 201 new, 200 idempotent | Typed validation/conflict errors | ACCEPTABLE |
| `GET /api/student-documents/:id` | `authenticateRequest` | Document view | Resolver middleware | Read + access log | Service transaction | 200 document + versions | Typed errors preserved | ACCEPTABLE |
| `POST /api/student-documents/:id/versions` | `authenticateRequest` | Document version create | Resolver middleware | Create | Service transaction | 201 new, 200 idempotent | Typed version/conflict errors | ACCEPTABLE |
| `POST /api/student-documents/:id/verification` | `authenticateRequest` | Document verify | Resolver middleware | Update | Service transaction | 200 committed decision | Typed conflict/validation errors | ACCEPTABLE |
| `POST /api/student-documents/:id/archive` | `authenticateRequest` | Document archive | Resolver middleware | Update | Service transaction | 200 archive/restore result | Typed legal-hold/version errors | ACCEPTABLE |
| `GET /api/student-documents/:id/access-log` | `authenticateRequest` | Access-log view | Resolver middleware | Read | Service transaction | 200 access history, possibly empty | Typed errors preserved | ACCEPTABLE |
| `POST /api/students/bulk` | `authenticateRequest` | Broad `Student.Write` | Authenticated `user.schoolId`; resolved TenantContext not proven | Multi-write | Outer UoW can reach nested UoWs | Generic 200 success; unknown operation can report processed count without mutation | All errors wrapped as `DATABASE_ERROR`/500 | MATERIAL GAP |
| `DELETE /api/students/:id?action=soft|restore` | `authenticateRequest` | `Student.Delete` | `resolveStudentTenantContext` | Update lifecycle | Canonical writer transaction | 200 canonical persistence metadata | Typed validation/conflict/tenant errors preserved | ACCEPTABLE / POLICY REVIEW |
| `POST /api/students/:id/transfer` | `authenticateRequest` | Broad `Student.Write` | Resolver middleware present | Update | Legacy UoW/repository path | Generic 200 success message | All errors wrapped as `DATABASE_ERROR`/500 | MATERIAL GAP |
| `POST /api/students/:id/promote` | `authenticateRequest` | Broad `Student.Write` | Resolver middleware present | Update + possible invoice | Legacy UoW/repository path | Generic 200 success message | All errors wrapped as `DATABASE_ERROR`/500 | MATERIAL GAP |
| `POST /api/students/:id/re-enroll` | `authenticateRequest` | Broad `Student.Write` | Resolver middleware present | Update | Legacy UoW/repository path | Generic 200 success message | All errors wrapped as `DATABASE_ERROR`/500 | MATERIAL GAP |
| `POST /api/students/:id/graduate` | `authenticateRequest` | Broad `Student.Write` | Resolver middleware present | No mutation | Intentionally blocked | 409 `GRADUATION_NOT_READY`, `success:false` | Explicit fail-closed contract |
| `POST /api/students/:id/dismiss` | `authenticateRequest` | Broad `Student.Write` | Resolver middleware present | Update | Legacy UoW/repository path | Generic 200 success message | All errors wrapped as `DATABASE_ERROR`/500 | MATERIAL GAP |
| `POST /api/students/:id/archive` | `authenticateRequest` | Broad `Student.Write` | Resolver middleware present | Update | Legacy UoW/repository path | Generic 200 success message for archive or restore | All errors wrapped as `DATABASE_ERROR`/500 | MATERIAL GAP |
| `GET /api/students/:id/timeline` | `authenticateRequest` | `Student.Read` | Resolver middleware present | Read | Audit repository read | 200 `success:true` with audit-derived events, including empty list | All failures wrapped as `DATABASE_ERROR`/500 | MATERIAL GAP |

## Cross-cutting contract observations

- Authentication is present on the audited routes.
- Permission checks are present, but lifecycle and Bulk use broad `Student.Write` rather than operation-specific permissions.
- Trusted tenant resolution is explicit on canonical/document/lifecycle single-item paths, but Bulk has only authenticated `user.schoolId` visible in the route.
- Canonical create/update/guardian/document services carry idempotency/version/audit/outbox behavior more consistently than Legacy lifecycle services.
- The central error handler returns `{ success:false, errorCode, message, details, traceId, timestamp }`; however, Legacy route wrappers convert typed failures to `DATABASE_ERROR` before that handler.
- Empty successful reads are not automatically errors; each contract should define the empty state explicitly.

