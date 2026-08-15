# STU-AFFAIRS-P0-002O — Retention and Purge Decision

## Current status

**Retention durations and purge authority: UNPROVEN**

No duration is invented by engineering. No purge process is implemented.

## Final decision matrix

| Decision | Required status | Owner |
|---|---|---|
| Maximum retry window | Approved duration required | Operations/Product |
| Processing lease and recovery window | Approved duration and recovery owner required | Operations |
| Reconciliation window | Approved duration and approver required | Operations/Security |
| `COMMITTED` retention | Approved duration required | Product/Compliance |
| `FAILED` retention | Approved duration required | Operations/Compliance |
| Legal hold | Approved precedence and release process required | Compliance/Security |
| Purge authority | Named role/process and approval evidence required | Operations/Security |
| Tenant scope | Tenant-scoped purge rule required | Security/Tenant owner |
| Audit requirement | Append-only decision and execution evidence required | Security/Compliance |
| Idempotency after purge | Reuse-prevention rule required | Architecture/Operations |

## Non-negotiable state rules

- `PENDING`, `PROCESSING`, and `RECONCILE_REQUIRED` are not purgeable.
- A legal hold blocks purge regardless of age.
- Purge is not exposed to the ordinary application role or client API.
- Purge cannot silently erase domain history, audit evidence, or outbox evidence needed to explain a transfer.
- A purge decision and execution must be tenant-scoped, authorized, idempotent, and auditable.
- Until the retention and idempotency-after-purge decisions are approved, physical deletion is unsafe.

## Closure condition

The retention gate is closed only when Operations/Product/Security provide the decisions above. Until then, the future schema must not include an assumed purge schedule, and no cleanup job may be created.
