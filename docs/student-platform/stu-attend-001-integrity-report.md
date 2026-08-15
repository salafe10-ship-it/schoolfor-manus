# STU-ATTEND-001 — Integrity Report

## P0 findings

### ATT-P0-001 — Missing canonical student attendance schema

The repository writes to `attendance`, but the migration inventory contains no `CREATE TABLE attendance`. `DatabaseSchemaAuditor.tsx` contains a static description and index list for an attendance table; that is a UI claim, not executable schema evidence. The module cannot be certified or safely implemented against an unproven table.

### ATT-P0-002 — Tenant/school scope is not enforced by student writers

`AttendanceRepository.getById` and `getAll` filter through the related student school in reads, but `hasActiveAttendance` filters only by `student_id`, and update/delete/bulk insert paths do not enforce trusted tenant, school, or branch predicates. Fallback paths also search by id without scope. This is a cross-tenant risk if these legacy paths are reachable.

### ATT-P0-003 — No canonical protected student attendance endpoint

No attendance route/service was found in `server.ts` or the student presentation path. Permission entries exist, but there is no verifiable endpoint pipeline of authentication → session → authorization → tenant validation → business operation.

### ATT-P0-004 — Admission silently creates attendance

`StudentAdmissionService.createStudent` enlists an attendance record with `status='present'` for the admission date. No approved business rule says that admission proves classroom attendance. This can create false attendance and contaminate reports.

## P1 findings

### ATT-P1-001 — Divergent employee attendance is mistaken for student capability

`AttendanceTab.tsx` and `HumanResourcesPortal.tsx` implement employee attendance through local React state and `localStorage`, including synthetic biometric/randomized values. This is not a student attendance writer and must not be reused as a production student baseline.

### ATT-P1-002 — No duplicate/session invariant

There is no proven unique key or application invariant for one student per date/session/term/enrollment. Duplicate attendance rows cannot be ruled out.

### ATT-P1-003 — No correction, approval, lock, or audit workflow

The repository permits direct mutation/deletion without an attendance state machine, version conflict handling, approval metadata, immutable history, or correction reason.

### ATT-P1-004 — Legacy identity fields are denormalized

`student_name` and `classroom` are copied into attendance records. Rename propagation is incomplete and performed outside a clearly certified canonical attendance transaction.

## Technical debt

- Legacy text/id model and enterprise UUID/tenant model coexist.
- Fallback storage is present in a business-critical repository.
- Static schema-auditor definitions can look like live database evidence.
- Attendance permissions are defined ahead of a certified endpoint.
- Employee attendance synthetic data is stored in browser storage.
