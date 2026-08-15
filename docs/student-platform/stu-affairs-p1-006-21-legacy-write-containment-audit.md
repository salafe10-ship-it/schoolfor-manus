# STU-AFFAIRS-P1-006-21 — Legacy Lifecycle Write Containment Audit

## Scope

Discovery and static reachability audit only. No source code, database, migration, RLS, authorization, lifecycle behavior, or bulk operation was changed or executed.

## Executive finding

Legacy lifecycle writers are not merely dead code. Several are reachable from active server API routes and can write the legacy `students` projection through `StudentRepository.update`. The canonical DELETE soft-delete/restore path is separate. The result is:

`P1-006-21 = LEGACY WRITERS REACHABILITY PROVEN — DOMAIN CONTAINMENT REQUIRED`

This is not classified as a P0 from this audit because no executed cross-tenant mutation, unauthorized mutation, fabricated success after a failed write, or production data corruption was proven by static evidence alone.

## Route reachability

| Operation | API route | Middleware observed | Service chain | Persistence writer | Production reachability |
|---|---|---|---|---|---|
| Promote | `POST /api/students/:id/promote` | Authentication, `Student.Write`, student tenant middleware | `StudentService.promoteStudent` → `StudentPromotionService.promoteStudent` | `StudentRepository.update` | ACTIVE / REACHABLE |
| Re-enroll | `POST /api/students/:id/re-enroll` | Authentication, `Student.Write`, student tenant middleware | `StudentService.reEnrollStudent` → `StudentEnrollmentService.reEnrollStudent` | `StudentRepository.update` | ACTIVE / REACHABLE |
| Dismiss / suspend | `POST /api/students/:id/dismiss` | Authentication, `Student.Write`, student tenant middleware | `StudentService.dismissStudent` → `StudentEnrollmentService.dismissStudent` | `StudentRepository.update` | ACTIVE / REACHABLE |
| Archive | `POST /api/students/:id/archive` | Authentication, `Student.Write`, student tenant middleware | `StudentService.archiveStudent` → `StudentEnrollmentService.archiveStudent` | `StudentRepository.update` | ACTIVE / REACHABLE |
| Restore through DELETE | `DELETE /api/students/:id?action=restore` | Authentication, `Student.Delete`, resolved tenant context | `CanonicalStudentWriteRepository.changeLifecycle` | PostgreSQL transaction session | ACTIVE / CANONICAL |
| Soft delete through DELETE | `DELETE /api/students/:id?action=soft` | Authentication, `Student.Delete`, resolved tenant context | `CanonicalStudentWriteRepository.changeLifecycle` | PostgreSQL transaction session | ACTIVE / CANONICAL |
| Graduation | `POST /api/students/:id/graduate` | Authentication, `Student.Write`, student tenant middleware | Fail-closed route | None | ACTIVE / BLOCKED BY DESIGN |

## Bulk reachability

`POST /api/students/bulk` is an active authenticated endpoint with `Student.Write`. It reads `operation` and `items` from the request body and delegates to `StudentService.executeBulkOperation`.

The accepted service union is `insert | update | delete | transfer | promote | archive`. Each accepted operation delegates to a service that may open another Unit of Work and may reach a Legacy writer. The route obtains `schoolId` from the trusted authenticated user, but does not visibly invoke `resolveStudentTenantMiddleware` before the service call. No bulk operation was executed during this audit.

The runtime path therefore proves reachability for the following operation classes:

| Bulk operation | Static classification | Writer / behavior |
|---|---|---|
| `insert` | ACTIVE / REACHABLE | `StudentService.createStudent` → admission service; requires separate canonicality review |
| `update` | ACTIVE / REACHABLE | `StudentService.updateStudent` → `StudentRepository.update` |
| `delete` | ACTIVE / REACHABLE | `StudentService.deleteStudent` → withdrawal service; legacy and fallback behavior present |
| `transfer` | ACTIVE / REACHABLE | `StudentService.transferStudent` → `StudentEnrollmentService.transferStudent` → `StudentRepository.update`; nested Unit of Work risk already documented |
| `promote` | ACTIVE / REACHABLE | `StudentService.promoteStudent` → `StudentPromotionService` → `StudentRepository.update` |
| `archive` | ACTIVE / REACHABLE | `StudentService.archiveStudent` → `StudentEnrollmentService.archiveStudent` → `StudentRepository.update` |
| `restore` | NOT IN SERVICE CONTRACT / UNVALIDATED INPUT | No service branch; the endpoint does not visibly reject unknown operation before returning its generic success envelope |

## Findings

### LWC-001 — Production API reaches Legacy promotion writer

`server.ts` routes Promote to `StudentService.promoteStudent`, which calls `StudentPromotionService`. The service updates the legacy `students` projection using `StudentRepository.update`, not the Academic Status/Enrollment canonical writer. It also contains a hardcoded academic year (`2027/2028`).

### LWC-002 — Production API reaches Legacy re-enrollment writer

Re-enrollment validates the legacy `StudentLifecycleManager` vocabulary, then updates `students.status` through `StudentRepository.update`. It does not prove a canonical Enrollment record, status history, or status transition record.

### LWC-003 — Production API reaches Legacy dismiss/suspension writer

Dismissal chooses `dismissed` or `suspended` in the legacy status vocabulary and writes the legacy student row. It records a legacy audit log, but no canonical Academic Status history/transition record is proven.

### LWC-004 — Two archive/restore families coexist

POST Archive uses the Legacy `StudentEnrollmentService.archiveStudent` writer and accepts `archive=false` as a restore-like operation. DELETE Restore uses the canonical lifecycle repository. These operations have different state rules and persistence/audit behavior.

### LWC-005 — Bulk endpoint reaches multiple Legacy writers

The active bulk endpoint can dispatch to Promote, Transfer, Archive, Update, Delete, and other service branches. It is not a proven canonical bulk contract and can reach nested Unit of Work paths. The UI batch transfer action is currently disabled, but the API remains reachable.

### LWC-006 — Non-production legacy writers remain in the source tree

`StudentLifecycleService` and `StudentAdmissionDomainService` contain additional direct or enlistment-based lifecycle writers, but no production import/caller was found in the static search used for this audit. They are classified TEST-ONLY / NON-PRODUCTION OR UNPROVEN, not removed.

### LWC-007 — Legacy repository persistence is not the canonical transaction session

`StudentRepository.update` can use Supabase directly and falls back to local storage after a failed Supabase attempt. The Legacy lifecycle services call it from Unit of Work callbacks without proving that the active transaction session owns the actual write. This is a containment and atomicity risk, not a verified production corruption event.

## P0 trigger review

No static evidence in this audit proves:

- cross-tenant mutation;
- mutation after failed authorization;
- a fabricated success after a known failed mutation;
- destructive write without a school scope;
- a route that reopens graduation after `GRADUATION_NOT_READY`.

Therefore the mandated P0 stop condition was not triggered.

## Required containment decision

Before any lifecycle writer is promoted, repaired, or removed, the project needs an approved Domain Contract that defines the canonical writer, status vocabulary, Enrollment closure, history, audit, outbox, idempotency, version, permissions, and tenant context for each operation. This audit does not implement that contract.

