# STU-AFFAIRS-P0-002K — Retention and Reconciliation

## Retention policy

Retention must cover the maximum supported client retry window plus the operational reconciliation window. The exact duration is a product/operations decision and must be configured before implementation.

Records must remain queryable throughout that window. Purge must be controlled, tenant-scoped, auditable, and prohibited while the operation is processing or under reconciliation.

## Unknown commit handling

If the network fails after commit may have occurred:

1. mark the client result as unknown, not failed;
2. look up the durable operation record;
3. reconcile Enrollment, transfer, history, audit, and outbox references;
4. return the committed result if proven;
5. return retryable failure only if rollback/no result is proven.

## Outbox separation

Outbox delivery retries must not re-run the business transfer command. The operation record controls command replay; outbox status controls downstream delivery.

## Observability

Every claim, conflict, replay, failure, reconciliation, and purge decision requires request ID, correlation ID, tenant, actor, timestamp, and reason in the central audit contract.
