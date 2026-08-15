# STU-AFFAIRS-P0-002E — Canonical Transfer API Contract

## Command shape

The future endpoint must accept a batch command containing:

- operation/idempotency key;
- an ordered list of transfer items;
- source Enrollment ID per item;
- destination school/branch/academic-year/term identifiers only as requested targets, subject to server validation;
- effective date;
- transfer reason and business justification;
- expected version per source Enrollment.

The exact route and DTO names require implementation approval; this document does not create an endpoint.

## Server-owned values

The server derives authenticated user, role, tenant, accessible school/branch, request ID, correlation ID, timestamps, audit actor, and final scope. Client values never override those values.

## Classification

- Same Enrollment with class/section change: Placement Edit; it must not create an Enrollment Transfer.
- Branch/school/academic-year/term movement: First-class Enrollment Transfer, subject to business policy.
- Ambiguous or incomplete classification: reject before mutation with a contract error.

## Response contract

The response must distinguish: committed result, deterministic idempotent replay, validation rejection, authorization/scope rejection, conflict (`409`), and retryable infrastructure failure. It must never report success for a partial batch.

## Compatibility boundary

The current `POST /api/students/:id/transfer` and `/api/students/bulk` are legacy paths and must not be silently upgraded by this mission. Migration to the canonical contract requires a separate implementation order after the architecture and dependency gates are approved.
