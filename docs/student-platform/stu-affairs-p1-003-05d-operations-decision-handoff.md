# STU-AFFAIRS-P1-003-05D — Operations Decision Handoff

## Purpose

This handoff requests the operational, product, compliance, and security decisions required before the durable `StudentImportOperation` command store can move to schema/RLS design.

No default values are approved by this document. `UNDECIDED` remains `UNPROVEN / DECISION REQUIRED` and must not be converted into an application fallback.

## Decision Scope

| Decision | Required decision | Owner | Rationale | Environment | Effective scope | Status |
|---|---|---|---|---|---|---|
| Processing Lease | Define lease ownership, renewal, and expiry policy | Operations / Platform | Prevents two claimants while allowing crash recovery | Staging and Production | `student_import` commands | UNDECIDED |
| Retry Window | Define how long the same key may request replay/retry | Operations / Product | Aligns client behavior and support expectations | Staging and Production | Same key + same hash | UNDECIDED |
| Reconciliation Window | Define evidence-gathering period for uncertain outcomes | Operations / Security | Prevents unsafe blind re-execution after crash | Staging and Production | `RECONCILE_REQUIRED` | UNDECIDED |
| COMMITTED Retention | Define how long the committed result remains replayable | Product / Compliance | Supports duplicate-safe client retries and audit needs | Staging and Production | Successful imports | UNDECIDED |
| FAILED Retention | Define how long definitive failure results remain queryable | Product / Compliance | Supports support, audit, and incident investigation | Staging and Production | Failed imports | UNDECIDED |
| Purge Authority | Name the role/process allowed to purge command records | Security / Operations | Prevents unauthorized loss of evidence | Staging and Production | Command records only | UNDECIDED |
| Legal Hold | Define placement, release, audit, and precedence rules | Compliance / Legal | Prevents purge during legal/regulatory hold | Staging and Production | Held command records | UNDECIDED |
| Payload Redaction | Define fields retained, masked, encrypted, or excluded | Security / Compliance | Import payload may contain confidential student/guardian data | Staging and Production | Payload and result data | UNDECIDED |
| Result Storage | Choose `Full`, `Reference`, or `Hybrid` result persistence | Architecture / Operations | Replay must return the original result without re-execution | Staging and Production | Per-row import outcome | UNDECIDED |

## Required Decision Format

Each owner must return, for every row:

- `Decision`: approved policy/value, or `UNDECIDED`;
- `Owner`: accountable role and approving person/process;
- `Rationale`: operational, product, security, or compliance reason;
- `Environment`: staging, production, or both;
- `Effective scope`: exact operation, tenant class, or deployment scope;
- `Effective date`;
- `Review date`;
- `Exceptions` and approval authority;
- `Evidence/reference`.

## Guardrails While Pending

- No schema or migration for `StudentImportOperation`.
- No RLS policy for the command store.
- No Student Import implementation or `/api/students/bulk` replacement.
- No use of `outbox_events` as a command store.
- No process-local lock presented as durable idempotency.
- No lease, retry, retention, purge, legal-hold, or redaction value inferred from code or guessed by engineering.

## Acceptance Gate

The handoff is complete only when all required rows have an approved decision or an explicit written exception from the accountable owner. Any remaining `UNDECIDED` row keeps the next schema/RLS mission blocked.

## Current Decision

**STU-AFFAIRS-P1-003-05D = WAITING FOR OPERATIONS / PRODUCT / COMPLIANCE DECISIONS.**

The next safe engineering step is to review the returned decision matrix, not to implement a workaround.

