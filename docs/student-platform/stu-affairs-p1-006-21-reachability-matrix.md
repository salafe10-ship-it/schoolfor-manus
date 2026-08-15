# STU-AFFAIRS-P1-006-21 — Legacy Writer Reachability Matrix

| Writer | Production caller | UI caller | API caller | Direct DB/fallback write | Tenant scope | Audit | Canonical history | Outbox | Classification |
|---|---|---|---|---|---|---|---|---|---|
| `StudentPromotionService.promoteStudent` | `StudentService.promoteStudent` | No active portal caller found; repository wrapper is unreferenced | `POST /api/students/:id/promote`; bulk `promote` | Yes, through `StudentRepository.update`; invoice enlistment also present | Route resolves student tenant; bulk uses authenticated `user.schoolId` without visible resolver middleware | Legacy `AuditRepository.log` | Not proven | Not proven | ACTIVE / REACHABLE / DOMAIN-GATED |
| `StudentEnrollmentService.reEnrollStudent` | `StudentService.reEnrollStudent` | No active portal caller found; wrapper is unreferenced | `POST /api/students/:id/re-enroll` | Yes, through `StudentRepository.update` | Route resolves student tenant; bulk path inherits service argument | Legacy `AuditRepository.log` | Not proven | Not proven | ACTIVE / REACHABLE / DOMAIN-GATED |
| `StudentEnrollmentService.dismissStudent` | `StudentService.dismissStudent` | No active portal caller found; wrapper is unreferenced | `POST /api/students/:id/dismiss` | Yes, through `StudentRepository.update` | Route resolves student tenant; bulk path inherits service argument | Legacy `AuditRepository.log` | Not proven | Not proven | ACTIVE / REACHABLE / DOMAIN-GATED |
| `StudentEnrollmentService.archiveStudent` | `StudentService.archiveStudent` | No active portal caller found; wrapper is unreferenced | `POST /api/students/:id/archive`; bulk `archive` | Yes, through `StudentRepository.update` | Route resolves student tenant; bulk path inherits service argument | Legacy `AuditRepository.log` | Not proven | Not proven | ACTIVE / REACHABLE / DOMAIN-GATED |
| `StudentWithdrawalService.deleteStudent` | `StudentService.deleteStudent` | Active portal soft-delete calls DELETE canonical route, not this service directly | Bulk `delete` | Yes, legacy repository/fallback paths are present | Bulk uses authenticated `user.schoolId`; no visible resolver middleware | Legacy `AuditRepository.log` | Not proven for legacy branch | Not proven | ACTIVE / REACHABLE THROUGH BULK |
| `CanonicalStudentWriteRepository.changeLifecycle` | Direct server DELETE route | Active portal soft-delete/restore repository calls DELETE route | `DELETE /api/students/:id?action=soft|restore` | PostgreSQL transaction session only | Resolved `TenantContext` and SQL tenant/school/branch predicates | Canonical audit event writer | Canonical status history/transition behavior is present for approved canonical paths | Depends on canonical writer; not assumed for Legacy paths | ACTIVE / CANONICAL |
| `StudentLifecycleService.transition` | No production import found | No UI caller found | None found | Direct `StudentRepository.updateStatus` and audit create | Receives string `tenantId`; no production route proof | Legacy audit create | Not proven | Not proven | TEST-ONLY / UNPROVEN |
| `StudentAdmissionDomainService` lifecycle methods | No production import found | No UI caller found | None found | SQL enlistment commands / StudentService delegation | Receives school ID; no production route proof | Partial / method-dependent | Not proven | Not proven | TEST-ONLY / UNPROVEN |
| `StudentRepository.bulkPromote` / `bulkTransfer` | No production import found | No active UI caller found | None found | Direct legacy `update` loop | Caller-dependent | Per-row legacy audit | Not proven | Not proven | DEAD OR UNPROVEN / DEFER CLEANUP |

## Reachability caveat

“No caller found” means no caller was found in the static repository search performed for this audit. It is not proof that a symbol can never be imported dynamically or by an external package.

## Direct security checks observed

- Legacy `StudentRepository.update` applies `id`, `school_id`, and optimistic `version` predicates to the Supabase update path.
- Legacy fallback storage filters by `id` and `schoolId`.
- These checks do not make the Legacy writer canonical because the service can still use a direct client/fallback write and does not prove the active PostgreSQL transaction session, canonical status history, or outbox contract.
- The bulk route’s lack of visible tenant-context middleware is a containment review item; no bulk operation was executed.

