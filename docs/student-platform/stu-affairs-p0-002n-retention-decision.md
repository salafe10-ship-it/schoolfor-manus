# STU-AFFAIRS-P0-002N — TransferOperation Retention Decision

## Status

Decision matrix only. No retention job, purge query, schema, or policy is implemented.

## State matrix

| State | Purge allowed now? | Required treatment | Owner decision still required |
|---|---:|---|---|
| `PENDING` | No | Preserve the request and idempotency evidence while it may be claimed or retried | Maximum retry window and abandoned-request handling |
| `PROCESSING` | No | Preserve until the worker completes, fails, or is explicitly reconciled; never delete a live operation | Lease/timeout and recovery ownership |
| `RECONCILE_REQUIRED` | No | Preserve indefinitely until an approved reconciliation decision closes the evidence chain | Reconciliation window, approver, and legal-hold interaction |
| `COMMITTED` | Not yet defined | Preserve enough history to prove replay prevention, domain outcome, audit, and reconciliation | Operations/Product retention duration and legal obligations |
| `FAILED` | Not yet defined | Preserve failure reason, retry evidence, and correlation data | Retry/evidence retention duration and dead-letter policy |

## Decisions that Operations/Product must provide

No time period is invented in this engineering package. Before schema and purge design, Operations/Product must approve:

- maximum retry window;
- processing lease and recovery window;
- reconciliation window;
- `COMMITTED` retention duration;
- `FAILED` retention duration;
- dead-letter handling;
- purge authority and two-person approval, if required;
- legal-hold precedence and release process;
- tenant-scoped purge schedule;
- whether domain history and audit/outbox evidence must outlive the operation row;
- audit event required for every purge decision and execution.

## Purge invariants

- Purge is never a normal transfer API capability.
- Purge is never allowed for `PENDING`, `PROCESSING`, or `RECONCILE_REQUIRED`.
- A legal hold blocks purge regardless of age or state.
- Purge must be tenant-scoped, idempotent, authorized, and auditable.
- Purging an operation record must not silently remove canonical enrollment history, audit events, or outbox evidence needed to explain the business result.
- A failed purge is itself an operational event and must not create a partially hidden record set.
- Any final purge design must define how idempotency-key reuse is prevented after physical removal; until that is decided, deletion is unsafe.

## Ownership matrix

| Concern | Owning authority | Engineer action now |
|---|---|---|
| Retry and reconciliation windows | Operations/Product | Record decision; do not guess |
| Legal hold | Compliance/Operations | Treat as blocking |
| Purge authorization | Operations/Security | Keep outside ordinary app role |
| Tenant scope | Security/Tenant boundary | Require fail-closed context |
| Evidence and audit | Security/Compliance | Require append-only evidence |
| Physical deletion mechanism | Database/Security after approval | No implementation in P0-002N |
