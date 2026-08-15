# LEGACY-STATUS-001 — Student Status Writer Inventory

## Scope and evidence

This inventory is based on static inspection of the application source and route graph. It covers production route handlers, services, repositories, domain services, and test-only lifecycle code that can write or select `students.status`.

The canonical vocabulary is the one enforced by `202608061000_academic_status_engine.sql`:

`applicant`, `admitted`, `active`, `suspended`, `withdrawn`, `graduated`, `archived`.

## Writer inventory

| Writer | Endpoint / call path | Values or operation | Database writes | UnitOfWork boundary | Canonical compatible |
|---|---|---|---|---|---|
| Student Registration | `POST /api/student-registration` → `StudentRegistrationService` | Initial `applicant` | `students`, `student_academic_status`, `student_status_transitions`, `student_status_history`, `audit_events`, `outbox_events` | Yes; one request-scoped UoW | **Yes** |
| Legacy create | `POST /api/students` → `StudentService.createStudent` → `StudentAdmissionService` → `StudentRepository.enlistCreateStudent` | Creates legacy student as `active` | Legacy-shaped `students` insert plus secondary legacy records | UoW is opened, but the canonical status records are not created | **No** |
| Legacy update | `POST /api/students` with an existing id → `StudentService.updateStudent` → `StudentRepository.update` | Accepts arbitrary `updates.status` | Direct Supabase update or fallback storage; audit is separate | UoW is opened, but repository write is not attached to the PostgreSQL transaction | **No** |
| Soft delete / restore | `DELETE /api/students/:id` → `StudentWithdrawalService.deleteStudent` | `withdrawn` for soft delete; `active` for restore | Direct student update plus soft-delete fields | UoW is opened, but status and audit are not canonical status writes | **No** |
| Re-enrollment | `POST /api/students/:id/re-enroll` → `StudentEnrollmentService.reEnrollStudent` | Legacy `re_enrolled` validation, then projection `active` | Direct student update plus classroom/section | UoW is opened, but the repository update bypasses the transaction session | **No** |
| Dismiss / suspend | `POST /api/students/:id/dismiss` → `StudentEnrollmentService.dismissStudent` | `suspended` or legacy `dismissed` | Direct student update plus behavior notes | UoW is opened, but no academic status/history/transition/outbox record is written | **No** |
| Graduate | `POST /api/students/:id/graduate` → `StudentGraduationService.graduateStudent` | `graduated` | Direct student update plus audit | UoW is opened, but no canonical status chain is written | **No** |
| Archive / restore archive | `POST /api/students/:id/archive` → `StudentEnrollmentService.archiveStudent` | `archived` or legacy `active` | Direct student update plus audit | UoW is opened, but canonical terminal-state rules are not applied | **No** |
| Bulk operations | `POST /api/students/bulk` → `StudentService.executeBulkOperation` | Delegates to update/delete/transfer/promote/archive paths | Depends on delegated operation | Outer UoW calls methods that open UoWs; nested-UoW risk exists | **No** |
| Domain RegisterStudent | `StudentAdmissionDomainService.RegisterStudent` | Legacy `enrolled` | Parameterized direct `students` update | UoW, but no canonical status records | **No** |
| Domain TransferStudent | `StudentAdmissionDomainService.TransferStudent` | Writes `school_id` and legacy `suspended` | Parameterized direct `students` update | UoW, but it changes ownership and status in a legacy contract | **No**; transfer belongs to Enrollment |
| Domain GraduateStudent | `StudentAdmissionDomainService.GraduateStudent` | `graduated` | Parameterized direct `students` update | UoW, but no canonical chain | **No** |
| Lifecycle adapter | `StudentLifecycleService.transition` | `enrolled`, `transferred`, `withdrawn`, `graduated`, `archived` | `StudentRepository.updateStatus` plus legacy audit | UoW is opened, but `updateStatus` writes outside the transaction | **No** |
| Generic status repository API | `StudentRepository.updateStatus` | Any legacy `StudentStatus` value accepted by its type | Direct Supabase update or fallback storage | No canonical transition contract | **No** |

## Non-writers and false positives

- `StudentLifecycleManager` validates the legacy transition map but does not write a database record. It is a policy source, not a writer.
- `src/modules/student-admission/domain/StudentLifecycle.ts` defines a second vocabulary and transition map but does not itself write data.
- React state in `src/App.tsx` and seed/mock data are not server database writers; they remain relevant because the UI can still submit legacy-shaped status values to the legacy endpoint.
- `StudentRepository.create` was found as a legacy direct-create method but no production call site was found in the inspected route graph. It is a dead-code candidate and must not be deleted in this mission.

## Inventory conclusion

There is one canonical writer (`StudentRegistrationService`) and multiple active legacy writers. The legacy writers cannot be converted by changing only the status string: they use a different student shape, skip the three canonical status tables, and in several paths perform writes outside the active PostgreSQL transaction. Conversion therefore requires an explicit application adapter contract and operation-by-operation data/permission decisions.
