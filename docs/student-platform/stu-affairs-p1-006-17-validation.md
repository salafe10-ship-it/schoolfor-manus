# STU-AFFAIRS-P1-006-17 — Integrity Audit Validation

## 1. Validation scope

Static repository evidence only. No source code, API, permission, authorization, tenant, database, SQL, RLS, migration, staging, production, or data mutation was performed.

## 2. Checks

| Check | Result | Evidence |
|---|---|---|
| Create Student UI → API mapping | PASS | Payload and `toCanonicalRegistrationCommand` were compared. Drift recorded as P1-DRIFT-003. |
| Canonical StudentRegistrationService | PASS / source verified | Trusted context, idempotency, duplicate checks, audit/outbox, and UnitOfWork observed. |
| Guardian create/link boundary | PASS / fail-closed | Legacy guardian create method rejects direct mutation; canonical registration path resolves guardian. |
| Edit Student UI → API mapping | FAIL | Classroom, section, and most status values are not mapped by `toCanonicalStudentPatch`; P1-DRIFT-002. |
| Guardian update concurrency | PASS in isolated service / FAIL composite UX boundary | Service has row locks and versions; UI invokes it separately from Student update. |
| Student Documents metadata lifecycle | PASS static | Register, version, verify/reject/expire, archive/restore, access history use canonical service patterns. |
| Lifecycle route inventory | PASS | Transfer, promote, re-enroll, graduate, dismiss, archive, restore, and delete routes identified. |
| Canonical lifecycle source | FAIL | Several active lifecycle services use legacy StudentRepository and do not prove Enrollment/Academic Status aggregate writes. |
| Graduation source-of-truth | FAIL / P0 | Hardcoded year/GPA/Issued registry returned from `StudentGraduationService.ts:42-48`. |
| UI button truthfulness | FAIL | Premature saved-data text and graduation false-success risk recorded. |
| Contract drift matrix | PASS | UI/API/service/repository/database mismatches documented. |
| False-success register | PASS | Six findings classified; one P0 release blocker. |
| TypeScript/build/unit/integration tests | NOT RUN | Discovery-only mission; no source changed. |
| Database/RLS/live tests | NOT RUN | Explicitly outside scope; no mutation occurred. |

## 3. P0 stop condition

The audit found `P0-DATA-001 / FS-001`. Therefore the requested final result is:

`STOP — P0 DATA INTEGRITY FINDING REQUIRES IMMEDIATE ISOLATED FIX`

## 4. Required next decision

Issue a separate, narrowly scoped P0 mission for the graduation false-success finding. It must decide the authoritative graduation/results/certificate source and remove fabricated output before any further Graduation, Academic Transcript, Certificate, or Reporting implementation.

