# STU-AFFAIRS-P1-003-05A — Import Idempotency Contract

## Key namespace

The durable idempotency namespace is `student-import`. The canonical key is the `Idempotency-Key` request header. The key is scoped by operation name and trusted tenant/school context; client tenant fields cannot alter the scope.

## Payload hash

The server normalizes allowed fields, item order, date formats, enum values, and guardian data, then hashes the canonical representation with SHA-256. Forbidden client context fields are rejected before hashing and cannot be used to create alternate identities.

## Decision matrix

| Situation | Required result |
|---|---|
| New key | Execute one import transaction and persist result atomically with the idempotency record. |
| Same key + same canonical hash after success | Return the original result; no writes; mark replay. |
| Same key + different hash | Reject with 409 payload-mismatch; no writes. |
| Same key while first request is processing | One request owns execution; concurrent request waits for bounded resolution or returns a safe in-progress response; it must not execute a second batch. |
| First request fails validation before transaction | No business writes; key may be retried after correction only if no durable execution record was committed. |
| First request fails after transaction begins | Roll back all business writes; record failure outcome according to the durable idempotency policy; never replay as success. |
| Network timeout after commit | Retry with same key returns the committed result. |
| Client retry with a new key for same students | Duplicate detection rejects it; a new key is not a bypass. |

## Required stored outcome

The future durable record must bind operation namespace, trusted tenant/school/branch, idempotency key, canonical payload hash, request/correlation IDs, processing status, result reference, error reference, timestamps, and version. Schema creation is not part of this mission.

## Security rules

- Never use a client-supplied tenant, school, branch, actor, or timestamp in key scope.
- Never return another tenant's idempotency result.
- Do not expose the payload hash as a substitute for authorization.
- Do not reuse a successful key for a different import operation.

