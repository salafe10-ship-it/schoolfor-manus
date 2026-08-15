# STU-AFFAIRS-P0-002A — Audit and Outbox Design

## Status

Design only. No audit/outbox implementation is authorized.

## 1. Separation of Concerns

- **Domain history:** records the Enrollment or placement lifecycle effect.
- **Central audit:** records who requested and who authorized the operation, trusted tenant scope, request/correlation IDs, result and reason.
- **Outbox:** records integration events that must be delivered after the transaction commits.

These records are not interchangeable and must not be emitted from the browser.

## 2. Recommended Event Model

### Batch envelope

One correlation-level operation event containing:

- batch operation ID;
- command type and contract version;
- trusted tenant/school/branch;
- count of selected students;
- request and correlation IDs;
- idempotency key;
- result status.

### Student-level events

For each committed student effect, a domain event should identify:

- student ID;
- source and destination placement or Enrollment references;
- effective date;
- actor and trusted scope references;
- batch operation ID;
- request/correlation IDs;
- event version.

Whether both an envelope and per-student events are required is **INTEGRATION DECISION REQUIRED**. The implementation must not publish duplicate semantic events.

## 3. Atomic Write Ordering

Within the one approved Unit of Work:

1. validate and lock/resolve all inputs;
2. apply source/destination state changes;
3. write domain history;
4. write central audit records;
5. enqueue outbox records with deterministic idempotency keys;
6. commit once;
7. publish asynchronously only after commit.

If any step before commit fails, all database changes and pending outbox rows roll back.

## 4. Audit Denial and Failure Behavior

Authorization, scope, validation and conflict denials must be recorded using trusted server context where the existing audit contract requires denial logging. A denial must never be logged as a successful transfer.

Failure records must not contain sensitive student data beyond the approved entity references and safe reason code.

## 5. Outbox Delivery

- Outbox publication is after commit.
- Delivery is retryable and idempotent.
- A consumer must not treat a repeated event as a second transfer.
- The outbox row is not marked completed before the consumer outcome is known.
- Dead-letter behavior belongs to the existing governance/outbox contract and must not be reinvented here.

## 6. Required Decisions

| Decision | Status |
|---|---|
| Envelope event, student events, or both | INTEGRATION DECISION REQUIRED |
| Event names and versions | INTEGRATION DECISION REQUIRED |
| Domain history for same-Enrollment placement edits | BUSINESS DECISION REQUIRED |
| Audit retention/classification | Existing enterprise standard must be confirmed |
| Outbox key namespace | Must align with approved idempotency contract |
| Downstream consumers | Must be listed before implementation |

## Decision

**DESIGN READY FOR REVIEW — NO EVENT OR AUDIT CODE CHANGED.**
