# ATTEND-CONTRACT-001 — Integrity Invariants

## Status

`BUSINESS DECISION REQUIRED`

These are required invariants to approve, not implemented constraints.

## Required invariant catalogue

| Invariant | Required question | Decision |
|---|---|---|
| Enrollment eligibility | Can an attendance record exist without an active enrollment? | `TBD` |
| Academic ownership | Is every record owned by tenant, school, branch, academic year, and term? | `TBD` except trusted tenant scope is mandatory |
| Session identity | What identifies one attendance session? | `TBD` |
| Duplicate prevention | What logical key prevents duplicate attendance? | `TBD` |
| Student scope | Must student, enrollment, school, and branch agree? | `TBD — must be explicit before implementation` |
| Valid date/time | Which timezone and calendar govern the record? | `TBD` |
| State validity | Which states and transitions are legal? | `TBD` |
| Correction integrity | Must old value, new value, reason, actor, and approval be retained? | `TBD` |
| Lock integrity | When is a record immutable, and who may override? | `TBD` |
| Audit completeness | Which writes require immutable audit events? | `TBD` |
| Event idempotency | Which operations publish outbox events and what is the idempotency key? | `TBD` |
| Version conflict | Is optimistic concurrency required for correction/approval? | `TBD` |
| Soft delete | Is cancellation represented as a state, soft delete, or both? | `TBD` |

## Mandatory security invariant

Tenant, school, branch, actor, role, and authorization context must come from trusted server context. Any client-supplied value that conflicts with trusted context must fail closed.

## Prohibited shortcuts

- No automatic `present` record from admission until approved.
- No default guardian/student/class/session values.
- No uniqueness assumption based only on the legacy `id`.
- No direct update/delete path without the approved scope and correction rules.
