# STU-AFFAIRS-P0-006-05 — Results and GPA Source Matrix

Status: `OWNER / RESULTS / SCHEMA DECISION REQUIRED`

## Required authoritative chain

`Student + Academic Year + Term + Completed Enrollment + Subject Results + Final Grades = Authoritative GPA`

Every item must be trusted, persisted, versioned, and linked to the same tenant/school/branch scope before graduation can consume it.

## Matrix

| Required item | Current source | Required future contract | Status |
|---|---|---|---|
| Student | `students` repository/UI student list | Canonical student ID and trusted scope | `PARTIAL` |
| Enrollment | `enrollments` schema exists | Required `enrollment_id`, active/completed eligibility, closure link | `NOT PROVEN` |
| Academic year | Core `academic_years` table exists | Required FK and approved context | `NOT WIRED` |
| Term | Core `terms` table exists | Required FK under the academic year | `NOT WIRED` |
| Subject | Component seed/state | Canonical subject catalog and version | `SEED / NOT PROVEN` |
| Assessment/mark | `gradesMatrix` JSON object | Durable result row with provenance and approval state | `MOCK / NOT PROVEN` |
| Final grade | React calculation | Locked calculation result with policy/version | `LEGACY / NOT PROVEN` |
| GPA | No canonical source | Versioned calculation output from authoritative results | `NOT PROVEN` |
| Eligibility | Graduation service only checks fees and legacy status | Academic policy evaluation with evidence | `NOT PROVEN` |
| Result correction | Local UI controls and snapshots | Approved correction workflow with immutable history | `NOT PROVEN` |
| Result lock | UI state such as snapshots/closures | Server-enforced result lifecycle | `NOT PROVEN` |
| Audit | General audit calls | Domain event containing result snapshot and calculation version | `PARTIAL` |

## Required owner decisions

1. Who owns the canonical Results domain?
2. What is the result grain: assessment, subject, term, academic year, or final transcript?
3. Which academic context is mandatory for every result?
4. What calculation policy produces GPA, percentage, grade symbol, and pass/fail?
5. What happens for missing, absent, excused, retaken, or corrected marks?
6. When are results locked and who can approve a correction?
7. How is a completed Enrollment linked to final results?
8. What evidence is required before Graduation eligibility becomes true?

## Prohibited graduation inputs

- `gradesMatrix` from browser state;
- `INITIAL_GRADES_MOCK` or other seed constants;
- display text such as `2025/2026` or `الفصل الدراسي الثاني` without canonical IDs;
- a GPA supplied in a request body;
- a GPA calculated from incomplete or unlocked results;
- the current `exams_database` JSON document as a canonical record without a separate approved contract.

## Decision

`STOP — RESULTS DOMAIN / GPA CALCULATION SOURCE NOT PROVEN`.
