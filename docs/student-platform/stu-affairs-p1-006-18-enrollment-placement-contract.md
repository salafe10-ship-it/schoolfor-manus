# STU-AFFAIRS-P1-006-18 — Enrollment Placement Contract

## Decision

`STOP — ENROLLMENT DOMAIN SOURCE NOT PROVEN`

This is a discovery and domain-contract document only. It does not change Student Edit, APIs, schema, SQL, migrations, RLS, or runtime behavior.

## Canonical Ownership

| Concept | Owning aggregate | Responsibility | Not owned by |
|---|---|---|---|
| Student identity | `students` | Identity, demographic profile, student number, trusted school scope | Enrollment placement, academic lifecycle |
| Enrollment | `enrollments` | A student’s academic participation for a school, branch, academic year, and term | Student identity, GPA, graduation record |
| Enrollment history | `enrollment_history` | Immutable enrollment state and placement history | Current Student profile |
| Transfer | `enrollment_transfers` | Transfer process and its source/target enrollment relationship, subject to business approval | Student identity mutation |
| Academic context | Core `academic_years` and `terms` | Time context referenced by Enrollment | Client-selected year or term |
| Placement | Enrollment-owned fields `class_reference` and `section_reference` | Class/section placement for the enrollment period | `students.classroom` or `students.section` |
| Academic status | Academic Status aggregate | Applicant/admitted/active/suspended/withdrawn/graduated/archived lifecycle | Enrollment placement |

## Canonical Enrollment Contract

An Enrollment identifies:

`tenant → school → branch → student → academic year → term → enrollment status → placement`

The current Enrollment schema already contains `student_id`, `academic_year_id`, `term_id`, `class_reference`, `section_reference`, `admission_status`, `enrollment_status`, start/end dates, version, audit metadata, request ID, and correlation ID. These are structural capabilities only; business ownership and transition semantics still require approval.

## Student Edit Boundary

Student Profile may edit identity and demographic fields that exist in the canonical Student write contract. It must not directly write Enrollment placement. The UI must not be connected directly to `enrollments` as part of this mission.

The Student Edit screen may display current placement only through a future read contract that resolves the current Enrollment in trusted academic context. Displaying placement does not make Student its owner.

## Academic Context Resolution

Academic Year, Term, and Current Enrollment must be resolved from trusted authenticated tenant context and approved server-side context. They must not be selected as tenant identity by query/body/header values, and the application must not use a hardcoded academic year.

The exact rule for selecting the current Enrollment is not yet proven. Required decisions include whether `enrollment_status = active` is sufficient, whether Academic Status `active` is also required, and how overlapping or concurrent terms are handled.

## History and Placement Changes

Changing `class_reference` or `section_reference` is not a Student profile update. It is an Enrollment placement change. Before implementation, the owner must decide whether it is:

1. A versioned update to the current Enrollment; or
2. A new Enrollment history event with effective date, reason, actor, previous value, new value, audit, version, and idempotency.

No assumption is made here.

## Required Decisions Before Implementation

| Decision | Current state |
|---|---|
| Active Enrollment eligibility | Owner/Academic decision required |
| Pending Enrollment meaning | Owner/Academic decision required |
| Completed versus Graduated | Owner/Academic decision required |
| Withdrawal and status interaction | Owner/Academic decision required |
| Transfer close/create semantics | Owner/Academic decision required |
| Re-enrollment semantics | Owner/Academic decision required |
| Legacy `students.status` disposition | Owner/Academic decision required |
| Mandatory history event for placement change | Owner/Academic decision required |

## Final Assessment

The source-of-truth boundary is proven structurally: Student owns identity, Enrollment owns placement, and Academic Status owns lifecycle. The operational contract is not implementation-ready until the decisions above are approved.
