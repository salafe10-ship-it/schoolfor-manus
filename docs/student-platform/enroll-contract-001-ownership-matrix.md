# ENROLL-CONTRACT-001 — Ownership Matrix

Date: 2026-08-11  
Mode: architecture and business-contract discovery only

## Evidence-based ownership matrix

| Concept | Current system of record evidenced in repository | Projection? | History owner evidenced | Contract decision |
|---|---|---|---|---|
| Student identity | Canonical `students` table and SOP-001 student writer | No projection proven | `students` audit metadata plus central `audit_events`; legacy `audit_logs` also exists | Canonical student identity is `students`; legacy student shape must not become an Enrollment source of truth |
| Enrollment | `enrollments` table; initial creation only is proven through SOP-001 | No complete projection proven | `enrollment_history` is structurally intended, but no production writer is proven | Ownership exists at schema level but is incomplete at application level |
| Academic Status | `student_academic_status` current row, with `student_status_history` and `student_status_transitions` | No projection proven | `student_status_history` | Separate aggregate; synchronization with Enrollment is not defined by existing source |
| Student lifecycle | Legacy `students.status` and legacy lifecycle services exist; canonical Academic Status has a separate vocabulary | No projection contract proven | Legacy `audit_logs` plus canonical status history for SOP-001 only | Ownership conflict; cannot declare legacy `students.status` canonical without a decision |
| Transfer | `enrollment_transfers` schema exists; live route currently mutates `students` and logs legacy audit only | No projection proven | No canonical transfer history writer found | Must be a first-class Enrollment operation or explicitly remain outside Enrollment; current code does not decide |
| Re-enrollment | Legacy `StudentEnrollmentService.reEnrollStudent` mutates `students` to `active` | No canonical projection proven | Legacy `audit_logs` only | Must be defined as new Enrollment, reactivation, or a distinct operation before implementation |

## Recommended contract boundary

The safest enterprise boundary supported by the schema is:

- `students` owns identity and demographic identity.
- `enrollments` owns a student's placement/registration period within an academic year and term.
- `enrollment_history` owns immutable enrollment lifecycle events.
- `enrollment_transfers` owns the transfer process and its source/destination enrollment relationship.
- `student_academic_status` owns the student's academic lifecycle status.
- `student_status_transitions` and `student_status_history` own academic-status approvals and history.
- `audit_events` owns cross-domain audit evidence; domain history remains the source for domain timeline semantics.

This is a recommended boundary, not a claim that the current application already implements it.

## Required business approvals

1. Whether every active Enrollment requires Academic Status `active`.
2. Whether an applicant/admitted student may have an Enrollment before activation.
3. Whether `students.status` is deprecated, projected, or retained for legacy compatibility.
4. Whether Transfer is always a close-old/create-new Enrollment operation.
5. Whether Re-enrollment creates a new academic-year Enrollment or reopens an existing one.
