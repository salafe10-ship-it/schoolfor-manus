# STU-AFFAIRS-P1-003-05C — Retention and Operations Decisions

## Purpose

Durable command state must remain available long enough to support replay, support investigation, crash recovery, audit, and legal obligations. This document records the decisions that must be made before schema implementation. It intentionally does not invent time values.

## Required Decisions

| Decision | Required owner | Question to approve |
|---|---|---|
| Retry window | Operations/Product | How long may a client safely retry the same key and receive the original result? |
| Processing lease | Operations/Platform | How long may a claimant own a command before recovery evaluation? |
| Reconciliation window | Operations/Security | How long must `RECONCILE_REQUIRED` remain available for evidence gathering? |
| COMMITTED retention | Product/Compliance | How long must successful results remain replayable? |
| FAILED retention | Product/Compliance | How long must definitive failures remain queryable? |
| Purge authority | Security/Operations | Which role may purge, under which approval and audit conditions? |
| Legal hold | Compliance/Legal | How is purge suspended and how is a hold released? |
| Result storage | Architecture/Operations | Store full per-row result, immutable reference, or both? |
| Payload retention | Security/Compliance | May the original normalized payload be retained, and what fields require redaction? |

## Mandatory Retention Invariants

- A command cannot be purged while it is `PROCESSING` or `RECONCILE_REQUIRED`.
- A command cannot be purged while a legal hold applies.
- Purge must be server-authorized, tenant-scoped, audited, and non-cascading into business records.
- Purging command state must never purge Student, Guardian, audit, or outbox business evidence.
- Sensitive payload fields must follow the enterprise data-classification and redaction policy.
- Retention changes require a reviewed governance decision and must not be silently changed by application configuration.

## Recommended Decision Shape

Operations/Product should approve policy classes rather than hard-coded values in application code:

- `retry_policy.student_import`;
- `lease_policy.student_import`;
- `reconciliation_policy.student_import`;
- `retention_policy.student_import.committed`;
- `retention_policy.student_import.failed`;
- `legal_hold_policy.student_import`.

The actual values and change authority remain external decisions.

## Gate

Until the owners approve these policies, the command contract cannot proceed to schema/RLS implementation. The safe status is **BUSINESS/OPERATIONS DECISION REQUIRED**.

