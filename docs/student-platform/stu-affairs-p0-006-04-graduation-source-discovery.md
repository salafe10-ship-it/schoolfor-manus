# STU-AFFAIRS-P0-006-04 — Graduation Source Discovery

Status: `DISCOVERY COMPLETE — DECISION REQUIRED`

## Scope and method

This is a read-only code and migration discovery. No implementation, schema, SQL, UI, RLS, or database changes were made.

## End-to-end trace

| Layer | Current implementation | Classification |
|---|---|---|
| Graduation UI | No canonical graduation workflow was found in the Student Affairs portal; the application exposes general student status editing and a graduation route | `LEGACY / NOT PROVEN` |
| Route | `POST /api/students/:id/graduate` | `PROVEN` |
| Authentication | `authenticateRequest` | `PROVEN` |
| Permission | `requirePermission(PERMISSIONS.STUDENT_WRITE)` | `PROVEN — TOO BROAD FOR FINAL APPROVAL` |
| Tenant context | `resolveStudentTenantMiddleware`; service call is centered on `user.schoolId` | `PARTIAL / NOT PROVEN` |
| Graduation service | `StudentGraduationService.graduateStudent` updates `students.status` | `LEGACY` |
| Student source | `StudentRepository.getById` | `PROVEN — IDENTITY ONLY` |
| Enrollment source | `enrollments` migration exists, but reviewed graduation service does not read or close an enrollment | `AVAILABLE / NOT CONSUMED` |
| Academic year | `academic_years` and `terms` exist in Core migration, but graduation service does not read them | `AVAILABLE / NOT CONSUMED` |
| Results/GPA | Exams UI uses local seeded/mock structures and the `/api/exams/database` JSON document path; no canonical results entity/calculation was proven | `MOCK / NOT PROVEN` |
| Graduation record | No canonical graduation table/record was found in the reviewed path | `NOT PROVEN` |
| History | Student audit logging exists; graduation-domain history is not proven | `PARTIAL` |
| Audit | `AuditRepository.log` is called for the student update | `PROVEN — INSUFFICIENT ALONE` |
| Outbox | No graduation outbox write is proven | `NOT PROVEN` |
| Certificate | No persistent certificate artifact or registry source is proven | `NOT PROVEN` |

## Current data sources

### Core academic context

The Core migration defines `academic_years`, `terms`, and `academic_calendar` with tenant/school/branch scope and foreign-key relationships. These are schema capabilities, not evidence that the current graduation flow uses them.

### Enrollment context

The Enrollment migration defines `enrollments`, `enrollment_history`, and `enrollment_transfers`. The approved contract states that graduation must close the applicable active Enrollment and set Academic Status in one orchestration. The current graduation service does neither.

### Exams and results

`server.ts` exposes `/api/exams/database`, backed by `ExamsRepository`. The repository reads or upserts an `exams_database` JSON document by `school_id`. `ExamsResultsModule.tsx` initializes settings, subjects, students, and grades from in-memory mock/seed constants and can synchronize that JSON document. This is not a proven canonical, academic-context-aware results source for graduation.

### Current fabricated output

`StudentGraduationService.ts` creates an in-memory `graduateRegistry` with:

- `graduationYear: "2026/2027"`;
- `gpa: "3.92 / 4.00"`;
- `certificationStatus: "Issued"`.

Those values are not sourced from Core academic context, Enrollment, or a canonical Results domain.

## Discovery decision

`STOP — NO AUTHORITATIVE GRADUATION ACADEMIC SOURCE IS PROVEN`

The next step requires owner decisions and a source contract before any implementation authorization.
