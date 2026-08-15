# ATTEND-CONTRACT-001 — Student Attendance Business Contract

## Status

`APPROVED — DOCUMENTATION / BUSINESS CONTRACT ONLY`

This document does not authorize schema, migration, source, endpoint, RLS, or production changes.

## Purpose

Define the business decisions required before a canonical Student Attendance platform is designed or implemented. No current legacy behavior is promoted to a business rule by inference.

## Scope separation

Student Attendance is distinct from employee attendance. `HRAttendance`, `localStorage.erp_hr_attendance`, biometric seeds, and randomized HR values are not Student Attendance evidence or a canonical implementation.

## Contract decision matrix

| Area | Required decision | Current decision |
|---|---|---|
| Enrollment eligibility | Active enrollment required? Are pending, withdrawn, suspended, graduated, or archived students eligible? | `TBD — Business decision required` |
| Academic context | Required tenant, school, branch, student, enrollment, academic year, term, class, and section semantics | `TBD — Business decision required` |
| Session model | Daily, period-based, multiple sessions per day, session owner, and session identifier | `TBD — Business decision required` |
| Official states | Exact canonical attendance states | `TBD — Business decision required` |
| State transitions | Allowed, forbidden, correction, and terminal transitions | `TBD — Business decision required` |
| Uniqueness | Logical key, such as student + date + session, and exception policy | `TBD — Business decision required` |
| Correction | Actor, reason, old/new values, approval, and correction window | `TBD — Business decision required` |
| Approval | Recorder, approver, daily/monthly lock, and override authority | `TBD — Business decision required` |
| Audit | Operations that require audit events and immutable before/after data | `TBD — Business decision required` |
| Outbox | Operations that publish domain events and delivery semantics | `TBD — Business decision required` |
| Tenant scope | Tenant, school, branch, and actor come from trusted server context; client values are never authoritative | `APPROVED` |
| Legacy writer disposition | Retire, isolate, migrate, or replace `AttendanceRepository` paths | `TBD — Architecture decision required` |
| Admission auto-present | Whether admission creates attendance | `TBD — Business decision required`; no inference is permitted |
| Employee separation | Employee attendance is not student attendance | `APPROVED` |

## Explicit non-decisions

- `present`, `absent`, and `excused` in the legacy TypeScript type are not approved canonical states.
- `late` in the HR type is not automatically a student state.
- Admission is not attendance unless Business explicitly approves that rule.
- A class text field is not a substitute for a trusted class/section/session relation.
- A client-supplied tenant, school, branch, actor, or student scope is never trusted.

## Approval gate

The contract is incomplete until every `TBD` row has an owner, decision, effective date, and review record. Implementation must remain frozen until then.
