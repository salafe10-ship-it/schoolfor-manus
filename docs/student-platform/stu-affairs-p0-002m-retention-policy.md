# STU-AFFAIRS-P0-002M — TransferOperation Retention Policy

## Lifecycle retention rules

- `PENDING` and `PROCESSING`: not purgeable while active.
- `RECONCILE_REQUIRED`: not purgeable until an authorized reconciliation decision is recorded.
- `COMMITTED`: retained for the full replay and operational reconciliation window; the result reference must remain usable during that window.
- `FAILED`: retained for conflict/retry evidence according to the approved retry window.
- Purge must never delete domain Enrollment history, central audit evidence, or required outbox evidence.

## Ownership

Operations/Product owns the duration and purge schedule. Security owns the minimum evidence-retention requirement. The application must not invent a duration in a migration.

## Required decisions

- Maximum client retry window.
- Maximum unknown-commit reconciliation window.
- Retention for `COMMITTED` versus `FAILED`.
- Retention and escalation for `RECONCILE_REQUIRED`.
- Purge authority and approval.
- Whether legal/audit holds can suspend purge.
- Tenant-scoped purge audit and recovery requirements.

## Safe default until decision

No purge job and no destructive cleanup are authorized. A nullable/configurable policy boundary may be designed later, but it must not silently remove replay or compliance evidence.
