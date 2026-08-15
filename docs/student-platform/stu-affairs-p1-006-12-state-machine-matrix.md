# STU-AFFAIRS-P1-006-12 — State Machine and Lifecycle Matrix

## Formal state set

```text
Applicant | Admitted | Active | Suspended | Withdrawn | Graduated | Archived
```

`Transfer` is a command/aggregate operation, not a member of this set.

## Allowed baseline transitions

| Transition | Required actor/policy | Required context | Required output |
|---|---|---|---|
| Applicant → Admitted | Admission authority | Admission decision | Admission/lifecycle history + audit + outbox |
| Admitted → Active | Enrollment authority | Valid enrollment, academic year, term | Activation history + audit + outbox |
| Active → Suspended | Authorized academic/administrative authority | Reason and effective date | Suspension history + audit + outbox |
| Suspended → Withdrawn | Authorized withdrawal authority | Withdrawal reason and effective date | Withdrawal history + audit + outbox |
| Withdrawn → Graduated | Registrar/Academic authority | Eligibility and approval; currently UNDECIDED | Graduation history + durable graduation record + audit + outbox |
| Graduated → Archived | Retention/archive authority | Retention/archive decision | Archive history + audit + outbox |

## Forbidden by default

The following are forbidden until separately approved:

- Any transition that skips a baseline state.
- Any client-provided status overwrite.
- Any transition without current-version validation.
- Any transition without an immutable history event.
- Any terminal-state change from Graduated or Archived without correction authority.
- Any use of Transfer as a status value.
- Any placement edit that silently changes Enrollment or Academic Status.
- Any academic-year or term change that silently changes Student status.

## UNDECIDED transition decisions

| Decision | Current status | Owner |
|---|---|---|
| Whether Active may go directly to Withdrawn | UNDECIDED | Academic/Registrar |
| Whether Active may go directly to Graduated | UNDECIDED | Registrar |
| Whether Suspended may return to Active | UNDECIDED | Academic/Registrar |
| Whether Withdrawn can be reactivated | UNDECIDED | Registrar/Compliance |
| Whether Graduated can be corrected or restored | UNDECIDED | Registrar/Compliance |
| Whether Archived can be restored | UNDECIDED | Records/Compliance |
| Meaning/mapping of legacy statuses | UNDECIDED | Domain owner |
| Approval thresholds per transition | UNDECIDED | Domain owner/Security |
| Retention period before archive | UNDECIDED | Compliance/Operations |

## Lifecycle history logical contract

The future immutable history record must contain at least:

```text
event_id
student_id
tenant_id
school_id
branch_id
previous_status
new_status
effective_at
recorded_at
reason_code
reason_text
approval_reference
approval_actor_id
academic_year_id
term_id
enrollment_id
source_operation
actor_id
request_id
correlation_id
version
```

Fields that are not applicable must be explicitly null by policy, not silently inferred. History must never be updated or physically deleted through ordinary lifecycle operations.

## Event contract

Proposed event names for owner review:

- `StudentAdmitted`
- `StudentActivated`
- `StudentSuspended`
- `StudentWithdrawn`
- `StudentGraduated`
- `StudentArchived`
- `StudentLifecycleCorrected`

These are design names only. Outbox existence for the current routes is `NOT PROVEN` and no event was published by this mission.

