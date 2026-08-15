# STU-AFFAIRS-P0-006-04 — Graduation Academic Source Matrix

Status: `OWNER DECISION REQUIRED`

## Source-of-truth matrix

| Value or decision | Candidate source | Required rule | Current status |
|---|---|---|---|
| Student | `students` | Trusted student identity and tenant/school/branch scope | `PROVEN for lookup` |
| Active placement | `enrollments` | Applicable enrollment must be active or otherwise approved for graduation closure | `SCHEMA AVAILABLE / NOT CONSUMED` |
| Academic year | `academic_years` | Must be the approved context of the enrollment and graduation decision | `SCHEMA AVAILABLE / NOT CONSUMED` |
| Term | `terms` | Must belong to the selected academic year and trusted school scope | `SCHEMA AVAILABLE / NOT CONSUMED` |
| Subjects and marks | Results domain | Must be canonical, versioned, locked where required, and tenant-scoped | `NOT PROVEN` |
| GPA | Results calculation | Must be derived from authoritative marks and approved calculation policy | `MOCK in current graduation path` |
| Eligibility | Academic Affairs policy | Must evaluate required subjects, pass rules, attendance/exception rules, and approvals | `NOT PROVEN` |
| Financial clearance | Finance/approved policy | Must be explicitly classified as hard gate, advisory gate, or separate approval | `PARTIAL legacy fee check` |
| Graduation date | Approved command context/server time | Must not be client-controlled or inferred silently | `NOT PROVEN` |
| Certificate status | Graduation/certificate artifact domain | Must reflect a committed artifact lifecycle | `MOCK in current graduation path` |

## Owner decisions required

1. **Academic owner:** Which domain owns final graduation eligibility and approval?
2. **Results owner:** Is `exams_database` transitional only, or can it be promoted after a separate canonical results contract?
3. **Calculation owner:** Which GPA/average formula, scale, rounding, retake, absence, and exception rules apply?
4. **Context owner:** Which academic year and term govern graduation, and can a graduation span terms?
5. **Enrollment owner:** Which enrollment is closed and what closure state is used?
6. **Finance owner:** Is the current fee check mandatory, advisory, or outside Academic Status?
7. **Certificate owner:** Is certificate issuance part of graduation or a separate artifact workflow?
8. **Correction owner:** Who may correct, revoke, or reissue an approved graduation?
9. **Retention owner:** What retention and legal-hold policy applies to graduation evidence?

## Required canonical contract

The minimum approved input contract is:

`student_id + enrollment_id + academic_year_id + term_id + results_snapshot_id + eligibility_policy_version + approved decision`

The service must reject the operation when any required reference is missing, cross-scoped, stale, or not approved. A GPA value supplied directly by a client is never an authoritative input.

## Decision status

| Decision | Status |
|---|---|
| Existing current code is safe to use as a graduation source | `NO` |
| Existing schema provides academic context references | `YES, but not wired to graduation` |
| Existing results path is a canonical graduation source | `NO — NOT PROVEN` |
| Implementation may begin | `NO` |

Final: `DOMAIN/ACADEMIC/RESULTS SOURCE DECISION REQUIRED`.
