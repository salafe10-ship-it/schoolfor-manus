# STU-AFFAIRS-P1-006-12 — Student Lifecycle Domain Contract

## Status and boundary

Architecture and domain design only. This document does not change lifecycle services, routes, database schema, migrations, RLS, UnitOfWork, authorization, tenant behavior, production, or staging.

## 1. Domain concepts

The following concepts are separate and must not be represented by one overloaded `students.status` field:

| Concept | Meaning | Source of truth |
|---|---|---|
| Student Identity | Stable person/student record and identity attributes | Student aggregate |
| Academic Status | Lifecycle state of the student’s academic relationship | Academic Status aggregate/history |
| Enrollment | A student’s participation in a school/branch/academic year/term | Enrollment aggregate |
| Academic Year | The institution’s defined academic period | Core academic-year domain |
| Term | A subdivision of an academic year | Core term domain |
| Placement | Grade/class/section assignment within an enrollment | Enrollment/placement policy |
| Lifecycle Event | Immutable record of an approved status transition | Lifecycle history |
| Transfer | Movement between enrollment contexts/schools/branches | Transfer operation; not a status |

## 2. Approved baseline states

The approved academic lifecycle is:

```text
Applicant → Admitted → Active → Suspended → Withdrawn → Graduated → Archived
```

`Transfer` is not a status. It closes or changes enrollment context according to an approved Transfer/Enrollment contract.

The existing code’s `accepted`, `enrolled`, `re_enrolled`, `dismissed`, `inactive`, `frozen`, and `on_leave` values are legacy vocabulary. Their mapping to the approved model is not assumed here.

## 3. Baseline transition table

The first six transitions below represent the approved ordered lifecycle. Any deviation requires an owner decision before implementation.

| From | To | Meaning | Approval | Reason | History |
|---|---|---|---|---|---|
| Applicant | Admitted | Admission decision accepted | Required by admission policy | Required | Required |
| Admitted | Active | Enrollment activated after required admission/enrollment checks | Required | Required | Required |
| Active | Suspended | Temporary academic/administrative suspension | Required | Required | Required |
| Suspended | Withdrawn | Withdrawal after suspension or approved withdrawal decision | Required | Required | Required |
| Withdrawn | Graduated | Graduation correction/eligibility path | UNDECIDED — OWNER DECISION REQUIRED | Required | Required |
| Graduated | Archived | Historical closure after retention policy permits archival | Required | Required | Required |

The `Withdrawn → Graduated` edge is retained as the literal approved sequence supplied to the project, but its business meaning is unusual and must be confirmed by the Academic/Registrar owner before implementation.

## 4. Transitions currently requiring decision

The following are not silently approved by this contract:

- Applicant → Active
- Admitted → Suspended
- Active → Withdrawn
- Active → Graduated
- Suspended → Active
- Suspended → Admitted
- Withdrawn → Active
- Graduated → Active
- Archived → any state
- Any transition to or from legacy `dismissed`, `inactive`, `frozen`, `on_leave`, `accepted`, `enrolled`, or `re_enrolled`.
- Any correction of an erroneous transition.

Each remains `UNDECIDED / OWNER DECISION REQUIRED` until Academic Affairs, Registrar, and Security/Compliance define the policy and approval authority.

## 5. Operation separation

| Operation | Changes Student Identity? | Changes Academic Status? | Changes Enrollment? | Changes Placement? | Is Transfer? |
|---|---:|---:|---:|---:|---:|
| Registration | Creates identity | May remain Applicant | No active enrollment until admission/enrollment policy | No | No |
| Admission | No | Applicant → Admitted | May create an admitted enrollment intent | No | No |
| Activation | No | Admitted → Active | Opens/activates enrollment | May assign initial placement | No |
| Placement edit | No | No | Does not inherently open/close enrollment | Yes | No |
| Promote | No | Usually no; policy-dependent | Changes academic-year/term enrollment context | Yes | No |
| Re-enroll | No | Policy-dependent | Reopens/creates enrollment only after approval | Yes | No |
| Suspend | No | Active → Suspended | Enrollment effect requires policy | No | No |
| Withdraw | No | Suspended → Withdrawn per baseline; other source states UNDECIDED | Closes enrollment per policy | No | No |
| Graduate | No | → Graduated after eligibility | Closes enrollment per policy | No | No |
| Archive | No | Graduated → Archived after retention policy | No new enrollment | No | No |
| Restore | No | Any reverse/correction path is UNDECIDED | Enrollment effect is UNDECIDED | No | No |
| Transfer | No | No; Transfer is not status | Closes/creates/changes enrollment contexts | May change placement | Yes |

## 6. Command contract requirements

Every lifecycle command must carry or resolve, server-side:

- authenticated actor and trusted tenant context;
- student ID and current version;
- source academic status;
- target academic status, if any;
- source enrollment and destination enrollment, if applicable;
- source academic year and term;
- destination academic year and term;
- effective date;
- reason code and human explanation;
- approval reference and approval actor when policy requires it;
- request ID and correlation ID;
- idempotency key for retriable mutations.

Client-provided school, branch, tenant, actor, approval identity, timestamps, or status history are not authoritative.

## 7. Concurrency and atomicity

A lifecycle command must validate the current version and lock the relevant aggregate state within one request-scoped transaction. A successful command must commit the current state, immutable history, audit event, and outbox event together within the approved database boundary. A conflict must return a version conflict without a partial state change.

The external Transfer operation and external storage/finance effects require their own approved compensation/outbox contract; they must not be disguised as a simple student status update.

## 8. Correction workflow

No direct overwrite of history is allowed. A correction must be an approved compensating event that references the erroneous event, records reason and authority, preserves the original event, and produces a new version. The exact correction authority and allowed terminal-state corrections are `UNDECIDED`.

