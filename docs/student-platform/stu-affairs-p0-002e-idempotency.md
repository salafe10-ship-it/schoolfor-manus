# STU-AFFAIRS-P0-002E — Idempotency Architecture

## Operation identity

The command must carry a client-generated operation key, while the server derives the operation namespace, trusted actor, tenant, request ID, and correlation ID. The effective identity is:

`tenant + operation namespace + operation key`

The server computes a canonical payload hash after removing untrusted identity/scope fields and normalizing item order.

## Required state

Durable storage must retain at least:

- operation identity;
- canonical payload hash;
- `pending`, `succeeded`, or `failed` state;
- transaction/result reference;
- timestamps and retry metadata;
- trusted tenant and actor context needed for audit.

The storage owner, table/schema, retention, and cleanup policy are dependencies for a separate approved architecture or schema mission.

## Semantics

| Situation | Required result |
|---|---|
| First key/hash | Execute once |
| Same key and same hash after success | Return stored result; no duplicate writes |
| Same key and different hash | `409 Conflict` |
| Concurrent same key | One owner executes; others wait or receive deterministic retryable response |
| Previous failed transaction | No business partial state; retry policy must be explicit |
| Unknown commit outcome | Reconcile from durable state before retry |

## Current gap

`IdempotencyGuard` is process-local and cannot provide durable cross-instance guarantees. Registration and Documents have module-specific outbox-backed patterns, but no transfer-specific reusable result store has been proven. Therefore no implementation may rely on the current guard as the final transfer solution.
