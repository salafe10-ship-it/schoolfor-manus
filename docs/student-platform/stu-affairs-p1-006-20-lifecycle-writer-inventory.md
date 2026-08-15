# STU-AFFAIRS-P1-006-20 — Lifecycle Writer Inventory

## Scope and method

Discovery only. No source code was modified. The inventory covers Promote, Re-enroll, Suspend, Dismiss, Archive, Restore, Graduate, generic status update, bulk operations, and legacy lifecycle writers.

## Active route inventory

| Operation | Active route | Service/writer | Status mutation | Current assessment |
|---|---|---|---|---|
| Student registration | `POST /api/students` | `StudentRegistrationService` → canonical registration repositories | creates `applicant` and status history/transition records | canonical path |
| Generic Student update | `POST /api/students` with `id` | `CanonicalStudentWriteRepository.update`; special `suspended` branch uses `.suspend` | ordinary patch does not bind client status; suspend is canonical | canonical for current route |
| Suspend | `POST /api/students` with `status=suspended` | `CanonicalStudentWriteRepository.suspend` | `active → suspended` | canonical route branch |
| Promote | `POST /api/students/:id/promote` | `StudentService` → `StudentPromotionService` → legacy `StudentRepository.update` | class/stage/academic year; no lifecycle status | active legacy writer |
| Re-enroll | `POST /api/students/:id/re-enroll` | `StudentService` → `StudentEnrollmentService.reEnrollStudent` → legacy `StudentRepository.update` | validates then writes `active` | active legacy lifecycle writer |
| Graduate | `POST /api/students/:id/graduate` | route is fail-closed with `GRADUATION_NOT_READY` | none | P0 containment; no mutation |
| Dismiss/suspend | `POST /api/students/:id/dismiss` | `StudentService` → `StudentEnrollmentService.dismissStudent` → legacy `StudentRepository.update` | writes `dismissed` or `suspended` | active legacy lifecycle writer |
| Archive/restore | `POST /api/students/:id/archive` | `StudentService` → `StudentEnrollmentService.archiveStudent` → legacy `StudentRepository.update` | writes `archived` or `active` | active legacy writer |
| Soft delete/restore | `DELETE /api/students/:id?action=soft|restore` | `CanonicalStudentWriteRepository.changeLifecycle` | canonical soft delete/restore and controlled status | canonical route |
| Bulk update/archive/promote | `POST /api/students/bulk` | `StudentService.executeBulkOperation` → legacy services | varies by operation | active route exposes legacy writers |
| Generic lifecycle service | no production route found | `StudentLifecycleService` → `StudentRepository.updateStatus` | legacy status write | source exists; production reachability not proven |

## Key evidence

- The current application contains more than one lifecycle vocabulary and more than one writer family.
- `P0-DATA-001` graduation containment is preserved: the live graduation route does not call the legacy graduation writer.
- This document does not decide which writer should become canonical.

`P1-006-20 = LIFECYCLE WRITER INVENTORY COMPLETE — DOMAIN DECISION REQUIRED`
