# STU-AFFAIRS-P0-002C — Final Idempotency Boundary

## 1. Contract

The batch command requires one client-provided `Idempotency-Key`, interpreted only within trusted tenant and operation context. The key is not identity and cannot select school, branch or actor.

Recommended key namespace:

```text
trusted-tenant / student-affairs / placement-or-transfer / contract-v1 / key
```

The persisted namespace and storage mechanism are implementation dependencies, not created here.

## 2. Payload Hash

The server computes the hash over normalized:

- explicit command type;
- sorted unique student IDs;
- normalized destination placement or Enrollment context;
- effective date and reason where applicable;
- contract version.

Trusted actor and scope are taken from the request context and bound to the operation; they are not accepted from the browser as authority.

## 3. Replay Rules

| Case | Required behavior |
|---|---|
| New key + valid payload | Execute one operation |
| Same key + same hash + completed | Return stored result; no new effects |
| Same key + different hash | `409 Conflict`; no effects |
| Same key + processing | One effective operation; no duplicate mutation |
| Failed/rolled back operation | Retry policy must be explicit; never return false success |
| Different key + already transferred student | Domain conflict according to Enrollment rules |

## 4. Event Binding

Audit/history/outbox effects must carry the batch operation ID, key, payload hash, request ID and correlation ID so replay cannot create duplicates.

## 5. Retention and Storage

The project has idempotency patterns in other domains, but the transfer storage contract and retention policy are not yet approved for this operation.

**ARCHITECTURE MISSION REQUIRED** if a new persistent idempotency store or migration is needed. No storage is created here.

## Decision

**CONTRACT DEFINED AT DESIGN LEVEL — STORAGE/RETRY POLICY REQUIRES ARCHITECTURE APPROVAL.**
