# ENROLL-CONTRACT-002 — Approved Business Decisions

Date: 2026-08-11  
Decision basis: existing migrations, live writers, SOP-001, and enterprise safety defaults

## Decision status

**CONTRACT APPROVED**

These decisions freeze the contract for the next implementation mission. They do not themselves authorize source or database changes.

## 1. Enrollment versus Academic Status

**Decision: A — Linked aggregates with an atomic application contract.**

- An active Enrollment requires Academic Status `active`.
- An Enrollment may exist in `draft` or `pending` while Academic Status is `applicant` or `admitted`.
- The application service that activates an Enrollment must change the Academic Status in the same request-scoped Unit of Work.
- The database remains free of cross-aggregate triggers; the application contract and later RLS enforce the boundary.
- A status mismatch is a validation error, not a tolerated projection lag for an active Enrollment.

## 2. SOP-001 `pending`

**Decision: B — Enrollment holding state.**

SOP-001 creates the Enrollment record as a real holding record, not as an admission inquiry. `pending/pending` means the registration package exists but has not passed the activation/admission gate. It must not be reported as an active enrollment.

## 3. `completed` versus `graduated`

**Decision: C — Different business meanings.**

- `Enrollment.completed` closes a specific academic placement period after its expected period or completion requirement.
- Academic Status `graduated` means the student completed the institution's graduation requirements.
- A completed Enrollment does not automatically imply graduation.
- A graduation workflow must close the applicable active Enrollment as `completed` or another approved closure state and set Academic Status `graduated` in one approved orchestration, with domain history, audit and outbox records.

## 4. Withdrawal

**Decision: A with orchestration control.**

`Enrollment → withdrawn` closes the Enrollment with an end date and reason, and the same approved withdrawal operation changes Academic Status to `withdrawn`. The application service must commit both or neither. No direct client update to one side is canonical.

## 5. Transfer

**Decision: Transfer is a first-class Enrollment operation when placement ownership changes.**

Transfer includes:

- branch changes;
- school changes within the tenant;
- academic-year or term changes that create a new placement period.

Class/section changes inside the same Enrollment are placement edits, not automatically a transfer. If the business later requires section movement history, it must be represented by an explicit placement-history contract.

For a first-class transfer:

1. approve a transfer request;
2. close the source Enrollment as `transferred` with `ends_on`;
3. create the destination Enrollment with the approved academic context;
4. write `enrollment_transfers` with source and destination references;
5. write `enrollment_history` for both lifecycle effects;
6. write audit and outbox records in the same Unit of Work.

## 6. Re-enrollment

**Decision: A — New Enrollment.**

Re-enrollment creates a new Enrollment period and never reopens or mutates a historical Enrollment. The old record remains closed/historical. A new academic year and term are required; the operation must pass the admission/activation gate and preserve the prior Enrollment history. Re-enrollment is not a Transfer and does not create `enrollment_transfers`.

## 7. `students.status`

**Decision: B — Projection.**

`students.status` must not be a competing source of truth. It may remain for compatibility as a derived projection of the canonical Academic Status. Future canonical lifecycle commands must write Academic Status first and update any compatibility projection in the same Unit of Work. Direct legacy writes are not canonical and must be migrated or blocked in a later implementation mission.

## 8. History and integration chain

**Decision: mandatory domain history plus central audit and outbox.**

Every canonical Enrollment transition must produce:

`Enrollment transition → enrollment_history → audit_events → outbox_events`

All records are written in one request-scoped Unit of Work with tenant context, actor, request ID, correlation ID and idempotency. `enrollment_history` remains domain history; `audit_events` remains cross-domain compliance evidence; `outbox_events` remains integration delivery state.

## Contract guardrails

- No active Enrollment without Academic Status `active`.
- No historical Enrollment reopening.
- No transfer without source closure, destination creation and transfer record.
- No canonical Re-enrollment through legacy `students.status` mutation.
- No client-selected tenant, school, branch, academic year or term.
- No implementation may silently alter these decisions; a new decision record is required.
