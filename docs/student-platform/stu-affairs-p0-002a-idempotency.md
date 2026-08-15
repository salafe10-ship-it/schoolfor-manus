# STU-AFFAIRS-P0-002A — Idempotency Contract

## Status

Design only. No idempotency implementation is authorized.

## 1. Recommendation

Use one client-supplied `Idempotency-Key` per **batch command**, combined server-side with the trusted tenant, operation name and contract version. The key is a request handle, not a substitute for authorization or tenant context.

Recommended namespace:

```text
tenant:{trustedTenantId}:student-affairs:batch-transfer:v1:{idempotencyKey}
```

The exact namespace and storage contract require approval.

## 2. Payload Binding

The server must compute a canonical payload hash over:

- command type;
- normalized sorted student IDs;
- destination placement/academic context;
- contract version;
- trusted scope relevant to the operation.

The actor and trusted context must not be accepted from the payload hash as client authority; they are server context used for validation and audit.

## 3. Replay Matrix

| Situation | Required result |
|---|---|
| First key, valid payload | Execute once and store result |
| Same key, same normalized payload, completed | Return stored result; no duplicate effects |
| Same key, same payload, still processing | Reject or return approved in-progress response; never run a second mutation |
| Same key, different payload | Conflict; do not mutate |
| Different key, same business transfer | Business duplicate/conflict according to approved transfer rules |
| Failed transaction | No completed result; retry behavior must be explicitly approved |
| Unauthorized or cross-scope request | Reject before creating a successful idempotency record |

## 4. Required Stored Evidence

If the existing platform contract supports it, the idempotency record/result must bind:

- tenant ID;
- operation name and version;
- key;
- payload hash;
- request ID;
- correlation ID;
- actor ID;
- status;
- response/result reference;
- created and completed timestamps;
- failure category where applicable.

The storage location and retention are **ARCHITECTURE DECISION REQUIRED**. No new table or migration is proposed in this mission.

## 5. No Invented Scheme Rule

Existing registration/document idempotency implementations are evidence of patterns, not automatic transfer contracts. The implementation mission may reuse an approved shared mechanism only after confirming its tenant scope, payload binding, transaction semantics and replay behavior for Batch Transfer.

## 6. Required Tests for Future Implementation

- duplicate submit while first request is processing;
- same key and identical payload;
- same key and changed student list;
- same key and changed destination;
- different key for an already completed transfer;
- rollback followed by approved retry;
- unauthorized request;
- cross-tenant request;
- concurrent requests with the same key;
- audit/outbox non-duplication.

## Decision

**BATCH KEY RECOMMENDED; exact storage, retry-after-failure and business duplicate policy require owner/CTO approval.**
