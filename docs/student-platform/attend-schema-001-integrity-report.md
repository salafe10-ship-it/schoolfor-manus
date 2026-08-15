# ATTEND-SCHEMA-001 — Integrity Report

## Prepared constraints

### Attendance Session

- UUID primary key.
- Tenant, school, branch, academic year, and term foreign keys.
- Actor and audit foreign keys using existing tenant-scoped keys.
- Unique tenant identity and unique occurrence key.
- `open`/`locked` lifecycle check.
- Non-empty class, section, and period references.
- Positive version.

### Attendance Record

- UUID primary key.
- Tenant, school, branch, session, student, enrollment, actor, and audit foreign keys.
- Unique `(tenant_id, attendance_session_id, student_id)`.
- `present`/`absent`/`late`/`excused` state check.
- Positive version.
- Correction metadata must be all absent or complete with a non-empty reason.

## Referential integrity

The prepared migration rejects missing session, cross-tenant session, missing student, missing tenant-scoped enrollment, and invalid Core context references through foreign keys. Enrollment school/branch compatibility is additionally required by the application eligibility port because the existing Enrollment key set does not provide a matching composite parent key.

## Lock integrity

The schema represents `open` and `locked`, while the application transaction rejects ordinary writes to locked sessions. A database trigger/function was intentionally not introduced. Final database-level lock enforcement is a documented dependency for a future approved database/RLS mission.

## Audit and Outbox

The migration carries audit/request/correlation references but does not create or alter `audit_events` or `outbox_events`. The application service must enqueue the corresponding audit/outbox records in the same transaction.

## Live verification

All live claims remain `UNVERIFIED` because `PLATFORM-EVIDENCE-002` is still blocked. This report certifies static intent and dependency shape only.
