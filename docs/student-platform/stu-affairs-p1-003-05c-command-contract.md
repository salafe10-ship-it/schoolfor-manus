# STU-AFFAIRS-P1-003-05C — Durable Student Import Command Contract

## Purpose

`StudentImportOperation` is the durable command-state contract for the canonical `student_import` operation. It is separate from `outbox_events`, which remains responsible for asynchronous event delivery.

This document defines logical behavior only. It does not create a table, migration, SQL, RLS policy, API route, or implementation.

## Command Identity

The command identity is the tuple:

`tenant context + operation namespace + client operation key`

Required logical attributes:

| Attribute | Rule |
|---|---|
| operation ID | Server-generated immutable identifier for this command attempt |
| batch ID | Server-generated stable identifier returned to the caller and used for replay |
| tenant ID | Derived from trusted authenticated tenant context; never accepted from the client |
| school ID | Derived from trusted tenant context; never accepted from the client |
| branch ID | Derived from trusted tenant context; never accepted from the client |
| operation namespace | Constant `student-import`; not client-selectable |
| client operation key | Required `Idempotency-Key`, normalized and bounded by the approved request contract |
| canonical payload hash | Server-calculated SHA-256 over the normalized accepted command payload |
| request ID | Server-generated/request-context correlation value |
| correlation ID | Server-generated/request-context correlation value |
| actor user ID | Derived from trusted authenticated identity and internal actor mapping |
| role/permission evidence | Resolved server-side; the client cannot provide it |
| created/updated timestamps | Server time only |
| processing owner | Server-generated worker/request ownership token; never client supplied |

The durable uniqueness rule must prevent two command records for the same trusted tenant, namespace, and client operation key.

## Payload Boundary

The hash covers the normalized import envelope and ordered items, including the approved operation name and all accepted business fields. It must exclude transport-only values that may legitimately change on retry, such as request ID, correlation ID, processing owner, and server timestamps.

The following are rejected as client scope or identity inputs rather than hashed as authority:

- `tenantId`, `schoolId`, `branchId`;
- actor, role, permission, audit actor, created-by, updated-by, or timestamps;
- RLS/session settings;
- command status, result, lease, retry counters, or ownership fields.

## Lifecycle States

The minimum state set is:

- `PENDING`: command record durably accepted but not yet claimed for business execution.
- `PROCESSING`: one server-side claimant owns the execution lease.
- `COMMITTED`: the complete import transaction and its durable success result committed.
- `FAILED`: execution completed with a definitive failure and no successful import commit.
- `RECONCILE_REQUIRED`: execution outcome cannot be proven after interruption; automatic replay is forbidden until reconciled.

`COMMITTED`, `FAILED`, and `RECONCILE_REQUIRED` are terminal from the normal execution path. Any correction or reconciliation transition must be explicitly authorized and audited.

## State Transition Summary

| From | To | Condition |
|---|---|---|
| PENDING | PROCESSING | One atomic claim succeeds under trusted tenant scope |
| PENDING | FAILED | Command is rejected before execution for a definitive validation/security failure, if the contract chooses to persist it |
| PROCESSING | COMMITTED | All rows, audit, and outbox writes commit in one transaction |
| PROCESSING | FAILED | A definitive pre-commit failure is recorded and no business commit occurred |
| PROCESSING | RECONCILE_REQUIRED | Lease expires or process failure leaves commit outcome uncertain |
| RECONCILE_REQUIRED | COMMITTED | Authorized reconciliation proves the original transaction committed |
| RECONCILE_REQUIRED | FAILED | Authorized reconciliation proves no business commit occurred and closes the command |

The final two transitions require an explicit reconciliation authority and evidence; they must not be automatic blind retries.

## Forbidden Transitions

- `COMMITTED -> PROCESSING`
- `COMMITTED -> FAILED`
- `FAILED -> PROCESSING` without an explicitly approved new command key
- `RECONCILE_REQUIRED -> PROCESSING` by ordinary retry
- any transition that changes tenant, school, branch, actor, or payload hash
- any client-supplied status or result transition

## Separation from Outbox

`StudentImportOperation` records command execution, claim, result replay, and crash recovery. `outbox_events` records domain-event delivery and delivery retries after the business transaction commits. An import success must not be inferred only from an outbox delivery status.

## Decision Status

The logical command contract is complete for review. Lease durations, retention durations, purge authority, and legal-hold behavior remain explicit Operations/Product decisions in the companion retention document.

