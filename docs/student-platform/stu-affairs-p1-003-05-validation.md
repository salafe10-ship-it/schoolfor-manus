# STU-AFFAIRS-P1-003-05 — Discovery Validation

## Status

`DISCOVERY PASS — IMPLEMENTATION NOT STARTED`

## Verified

- All Student Affairs bulk symbols and route references were searched.
- The client/server envelope mismatch was confirmed.
- The import modal was confirmed unavailable and no file is accepted.
- Batch Transfer was confirmed disabled with no network call.
- Generic bulk runtime dispatch and its missing runtime operation validation were reviewed.
- Legacy repository bulk helpers were confirmed to use per-item loops.
- Existing RCA evidence for nested UnitOfWork and blocked TransferOperation was reviewed.
- No database, schema, migration, RLS, production, or batch-transfer behavior was changed.

## Required next-phase tests after contract approval

### Contract

- reject raw-array payloads with a safe 400 response;
- validate operation enum and per-operation item schema;
- reject empty batches and enforce a maximum batch size;
- return deterministic per-item errors without implying success;
- verify idempotency replay and payload mismatch behavior.

### Security and isolation

- require Authentication → Authorization → full TenantContext before dispatch;
- reject school/tenant/branch spoofing;
- verify every item remains inside trusted scope;
- verify audit actor, tenant, request, and correlation metadata are server-generated.

### Transactions

- prove one request-scoped transaction for the approved operation;
- prove rollback on each item failure;
- prove no nested UnitOfWork;
- prove concurrent batches do not share transaction state.

## Stop gate

Do not implement Bulk or Batch Transfer until the CTO approves the contract decisions. Batch Transfer remains blocked by P0-002P and is excluded from this discovery.

## Mission decision

`STU-AFFAIRS-P1-003-05 = READY FOR CTO REVIEW`.

