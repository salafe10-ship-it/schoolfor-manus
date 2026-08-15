# ATTEND-DESIGN-001 — Constraints and Index Design

## Logical constraints

1. `attendance_session_id` is required for every record.
2. Student and enrollment must belong to the same trusted tenant/school/branch context as the session.
3. Enrollment must cover the session academic year and term.
4. `attendance_status` is limited to `present`, `absent`, `late`, and `excused`.
5. Session status is limited to `open` and `locked`.
6. `version` is positive.
7. Soft-delete metadata is paired and cannot be used as ordinary deletion.
8. One logical record exists per `student_id + attendance_session_id`.
9. A locked session rejects ordinary record mutation.
10. Cross-tenant, cross-school, and cross-branch references fail closed.

## Index design

| Purpose | Logical columns | Query pattern |
|---|---|---|
| Session lookup | `tenant_id, school_id, branch_id, academic_year_id, term_id, attendance_date, status` | Daily/session navigation and reporting |
| Session class roll | `tenant_id, school_id, branch_id, class_id, section_id, attendance_date` | Class/section daily roll |
| Student history | `tenant_id, school_id, branch_id, student_id, attendance_date` | Student timeline |
| Student session lookup | `tenant_id, student_id, attendance_session_id` | Idempotency and direct record lookup |
| Enrollment history | `tenant_id, enrollment_id, attendance_date` | Enrollment-linked history |
| Status reporting | `tenant_id, school_id, branch_id, attendance_status, attendance_date` | Absence/late/excused reporting |
| Correction review | `tenant_id, school_id, branch_id, corrected_at, corrected_by` | Authorized correction audit views |

These are logical candidates only. The later schema mission must remove duplicates, verify selectivity, and compare them with the real database before creating physical indexes.
