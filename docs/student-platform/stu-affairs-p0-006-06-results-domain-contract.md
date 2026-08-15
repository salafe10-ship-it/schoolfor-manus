# STU-AFFAIRS-P0-006-06 — Academic Results Domain Contract

Status: `DESIGN ONLY — OWNER APPROVAL REQUIRED`

## Proposed conceptual entities

These names are conceptual and are not a schema authorization.

| Concept | Purpose | Owner | Required relationships |
|---|---|---|---|
| Academic Context | Identifies approved academic year and term | Core/Academic Affairs | Tenant, school, branch, year, term |
| Enrollment | Identifies the student's placement period | Enrollment | Student and academic context |
| Subject/Course | Identifies the assessable learning unit | Academic Affairs | Curriculum/grade/stage context |
| Assessment/Exam | Defines an assessment instance and policy | Examinations/Results | Subject, academic context, version |
| Exam Attempt | Identifies a student's participation | Results | Student, enrollment, assessment |
| Raw Mark | Stores an entered mark with provenance | Results | Attempt, actor, correction lineage |
| Calculated Result | Stores a reproducible intermediate calculation | Results | Raw marks, policy version |
| Final Result | Stores approved/locked subject or term outcome | Results/Academic Affairs | Student, enrollment, context, calculation |
| Result Snapshot | Immutable publication input for reporting/graduation | Results | Final results and policy versions |
| GPA/Percentage | Published aggregate derived from snapshot | Results/Academic Affairs | Snapshot, scale, calculation policy |
| Graduation Eligibility | Decision evidence based on approved results | Academic Affairs/Registrar | Student, enrollment, snapshot |

## Lifecycle proposal for review

`DRAFT → CALCULATED → REVIEWED → APPROVED → LOCKED`

The lifecycle remains undecided until Academic Affairs approves it. A locked result cannot be overwritten; corrections create a new version and preserve the prior evidence.

## Required controls

- no result without student, enrollment, academic year, and term context;
- no cross-tenant or cross-school references;
- no client-supplied tenant or academic ownership;
- no final result without approved calculation policy;
- no GPA without a reproducible result snapshot;
- no graduation eligibility without approved/locked academic results;
- idempotency and optimistic concurrency for mark entry, approval, locking, and correction;
- audit event plus outbox event for state-changing canonical operations.

## GPA contract questions

The system must not invent the formula. Academic Affairs must decide scale, weighting, rounding, retakes, missing marks, absences, exemptions, and whether GPA is term-specific, year-specific, cumulative, or all of these.

## Graduation dependency

`Graduation requires Approved/Locked Academic Results → Authoritative GPA/Eligibility`.

Graduation must not consume React state, JSON seed data, mock values, fixed GPA, or simulated previous-year GPA.
