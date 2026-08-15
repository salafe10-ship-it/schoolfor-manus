# STU-AFFAIRS-P1-006-18 — Placement State Matrix

## Scope

This matrix separates Enrollment state from Student identity and Academic Status. It does not authorize implementation.

| State or event | Enrollment meaning | Placement allowed? | Student profile mutation? | Academic Status effect | Decision |
|---|---|---|---|---|---|
| Draft | Enrollment preparation | Not yet official | No | None | Canonical schema supports the state; owner confirmation required |
| Pending | Admission/registration waiting state | Not official until approved | No | None or Applicant, decision required | Owner/Academic decision required |
| Active | Current participation | Yes | No placement fields on Student | May require Active status, decision required | Owner/Academic decision required |
| Completed | Enrollment period completed | No further placement for that record | No | Relationship to Graduated is unresolved | Owner/Academic decision required |
| Withdrawn | Enrollment closed with reason and end date | No | No | Relationship to Withdrawn is unresolved | Owner/Academic decision required |
| Transferred | Source enrollment closed or transfer event recorded | Depends on transfer semantics | No | Transfer is not a Student status | Owner/Academic decision required |
| Cancelled | Enrollment not activated | No | No | None | Canonical schema supports the state; owner confirmation required |
| Archived | Historical enrollment retained | No ordinary edit | No | Historical visibility policy required | Owner/Academic decision required |
| Placement change | Current enrollment class/section changes | Only through Enrollment contract | No | Usually none, but audit/history required | Effective date/reason/idempotency decision required |
| Academic status change | Student lifecycle transition | Not itself a placement change | No placement mutation | Owned by Academic Status | Explicitly out of scope |

## Forbidden Conflations

- `classroom` and `section` must not become duplicate columns on `students`.
- A Student profile edit must not silently create or alter an Enrollment.
- Placement must not be inferred from a hardcoded academic year or term.
- Transfer must not be represented as a Student status.
- Graduation must not be inferred from Enrollment `completed` without an approved Academic Status/Graduation contract.

## Required Placement Change Record

The owner must decide whether every placement change requires all of the following: effective date, reason code, actor, previous placement, new placement, immutable history entry, audit event, version check, and idempotency key. Until approved, no placement write is authorized.

## Gate

`ENROLLMENT/PLACEMENT CONTRACT READY — OWNER/ACADEMIC APPROVAL REQUIRED` is not yet reached because the state meanings and cross-domain effects remain unresolved.
