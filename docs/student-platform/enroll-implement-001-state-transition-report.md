# ENROLL-IMPLEMENT-001 — State Transition Stop Report

Date: 2026-08-11

## Approved Enrollment contract

The contract requires these canonical Enrollment transitions where applicable:

- `draft → pending`
- `pending → active`
- `active → completed`
- `active → withdrawn`
- `active → transferred`
- closed states → `archived`

Activation and withdrawal are coupled to Academic Status according to the approved contract.

## Current Academic Status migration evidence

The constraint `ck_student_status_transitions_allowed` allows ordinary transitions only for:

- `applicant → admitted`
- `admitted → active`
- `active → suspended`
- `suspended → withdrawn`
- `withdrawn → graduated`
- `graduated → archived`

Correction transitions require a correction reference and an approved/completed approval status; they are not a normal withdrawal path.

## Conflict

The approved operation `active Enrollment → withdrawn + Academic Status withdrawn` cannot be represented as one normal Academic Status transition under the current constraint. Using a correction transition would misclassify a normal business event; using a synthetic suspension would produce false domain history.

## Decision

**STOP + RCA**

No state-machine implementation is safe until the contract/schema mismatch is resolved by CTO approval.
