# ACC-001 — Accounting Posting Lifecycle

**Status:** Candidate lifecycle for owner approval; not executable  
**Decision:** `BLOCKED — ACCOUNTING OWNER DECISION REQUIRED`

## 1. Receipt lifecycle

The following states describe the minimum workflow to approve, not an implementation decision:

`DRAFT → SUBMITTED → APPROVED → POSTED`

Terminal or corrective paths:

- `DRAFT → CANCELLED` before approval.
- `SUBMITTED → REJECTED` if the owner requires rejection as a distinct state.
- `POSTED → REVERSED` only through a new compensating journal/ledger effect.
- A posted receipt must never be updated or deleted in place.

Owner decisions still required: exact states, approval authority, whether `SUBMITTED` and `REJECTED` exist, and whether a receipt can be posted directly.

## 2. Journal lifecycle

Candidate states:

`DRAFT → APPROVED → POSTED`

Corrective path:

`POSTED → REVERSED` through a separate reversal entry linked to the original; the original remains immutable.

The journal cannot enter `POSTED` unless:

- the source receipt is valid and eligible;
- the period is open;
- every line references an active postable account;
- debit and credit totals balance at approved precision;
- tenant/school/branch scope is trusted and consistent;
- idempotency and concurrency checks pass.

The exact journal approval and posting authority remain owner decisions.

## 3. Ledger and balance lifecycle

The candidate process is:

1. Lock or version-check the affected account rows according to the approved concurrency policy.
2. Persist the journal and lines.
3. Persist ledger lines linked to the journal and source receipt.
4. Update or project balances according to the approved balance model.
5. Append the audit event.
6. Persist any required outbox event.
7. Commit once, then return success.

No step may report a completed financial effect before the commit is confirmed.

## 4. Failure states

| Failure point | Required response |
|---|---|
| Receipt validation | Reject; no journal or ledger effect |
| Journal validation | Reject; no financial effect |
| Receipt persistence | Roll back; no success |
| Journal persistence | Roll back receipt and all pending effects |
| Ledger persistence | Roll back receipt, journal, and pending balance effect |
| Balance update/projection | Roll back all prior steps |
| Audit/outbox required write | Roll back if the contract makes it mandatory for the same transaction |
| Timeout/network after write begins | `OUTCOME_UNKNOWN`; no automatic mutation retry |
| Duplicate idempotency key | Return the existing governed result or a deterministic duplicate response |
| Closed period | Reject before any write |

## 5. Immutability and correction

The original posted receipt, journal, and ledger history must remain queryable. A correction must be a new governed event that references the original. Whether a correction is a reversal, adjustment, or both requires Accounting owner approval.

## 6. Explicit non-decision

This document does not select account mappings, balance semantics, state names, approval roles, reversal rules, or idempotency format. Those decisions belong to the Accounting owner and must be recorded in the decision matrix before implementation.
