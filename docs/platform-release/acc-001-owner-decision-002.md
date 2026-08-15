# ACC-001-OWNER-DECISION-002 — Accounting Canonical Contract & Governance Decision Package

## Status

`BLOCKED — ACCOUNTING OWNER DECISION REQUIRED`

This is a governance package only. It does not authorize Accounting code, SQL, database schema, migrations, RLS, seed data, staging, or production changes.

## Decision authority

The approving authority is the formally assigned **Accounting Owner** or an organizationally authorized delegate. Engineering may prepare the package and verify the result, but may not silently select financial policy.

## 1. Chart of Accounts

The Accounting Owner must approve:

- account identity and code policy;
- account classes and normal Debit/Credit nature;
- parent/child hierarchy and maximum depth;
- postable-leaf rule;
- system/default accounts;
- account activation, deactivation, and historical visibility;
- global, tenant, school, and branch ownership scope;
- code mutability and uniqueness scope.

Current repository values are examples only and are not approved mappings.

## 2. Accounting source of truth

Required owner decision:

> PostgreSQL is the sole canonical source of truth for Accounting records and balances.

The owner must approve the future canonical entity set and relationships for accounts, fiscal periods, receipts, journal entries, journal lines, ledger lines, balances/projections, reversals, idempotency, audit, and outbox. This package deliberately does not create or name a final schema beyond those capability categories.

`localStorage`, `FallbackStorage`, React state, JSON files, and UI-generated values must not be financial authority.

## 3. Journal lifecycle

Candidate lifecycle for explicit approval only:

`Draft → Submitted → Approved → Posted → Reversed`

The owner must confirm or replace the states, transitions, approval roles, terminal behavior, and correction path. Posted history must remain immutable; correction must be a new governed effect.

## 4. Posting rules

The owner must approve:

- debit and credit sign rules;
- balancing precision and currency handling;
- minimum line count;
- account postability and active-period checks;
- exact event that creates financial effect;
- approval versus posting authority;
- duplicate-posting behavior;
- closed-period rejection behavior;
- source-document relationship.

No fixed `CASH_ACCOUNT`, `REVENUE_ACCOUNT`, or other mapping is accepted as policy without owner approval.

## 5. Fiscal periods

The owner must approve:

- period creation and boundaries;
- opening authority;
- closing authority;
- reopening authority and reason requirements;
- treatment of pending drafts at close;
- correction window after close;
- period timezone and calendar;
- school/branch period scope.

Browser flags such as `erp_is_year_2026_closed` are not an authoritative period contract.

## 6. Reversal and correction

The owner must approve:

- who may reverse;
- when reversal is allowed;
- whether reversal always creates a new compensating journal;
- how original and reversal entries are linked;
- treatment across closed periods;
- approval and audit requirements;
- whether adjustment journals are distinct from reversals.

## 7. Idempotency and concurrency

The owner must approve a formal policy preventing duplicate receipts, duplicate journals, duplicate posting, and race conditions, including:

- idempotency key source and format;
- uniqueness scope;
- replay response for the same payload;
- rejection for the same key with a different payload;
- unknown-outcome recovery;
- version or lock strategy;
- retry policy and non-retryable failures.

## 8. Transaction boundary

The owner must approve that the critical financial command is atomic across the required sequence:

`Receipt → Journal Entry → Journal Lines → Ledger Lines → Balance Projection → Audit → Outbox`

The final implementation must use a request-scoped transaction, commit only after all mandatory steps succeed, and roll back on failure. This document does not implement that boundary.

## 9. Audit

The owner must approve required audit events and fields for:

- creation;
- submission;
- approval;
- posting;
- reversal;
- correction;
- period open/close/reopen;
- rejected or unknown outcomes.

Actor, trusted tenant/school/branch, request ID, correlation ID, timestamps, reason, and result must come from trusted server context.

## 10. Balance source

Required owner decision:

> UI state and localStorage are never balance authority.

The owner must choose one canonical model:

- balances derived from immutable ledger lines;
- balances stored as a governed projection with rebuild/reconciliation; or
- another explicitly approved model.

The owner must also approve reconciliation frequency, repair authority, and report consistency rules.

## 11. Tenant isolation

The owner must approve accounting ownership and isolation at tenant, school, and branch scope. Every canonical record and query must use trusted server-side context, and cross-school reads/writes must be rejected by database and service controls. Client-provided scope fields are not authoritative.

## Approval record

The following must be completed by the authorized owner before implementation:

| Field | Required value |
| --- | --- |
| Accounting Owner role / authority | **PENDING** |
| Decision ID | **PENDING** |
| Decision date | **PENDING** |
| Approved contract version | **PENDING** |
| Chart of Accounts decision | **PENDING** |
| PostgreSQL source-of-truth decision | **PENDING** |
| Journal lifecycle decision | **PENDING** |
| Posting rules decision | **PENDING** |
| Fiscal-period decision | **PENDING** |
| Reversal/correction decision | **PENDING** |
| Idempotency/concurrency decision | **PENDING** |
| Transaction boundary decision | **PENDING** |
| Audit/outbox decision | **PENDING** |
| Balance-source decision | **PENDING** |
| Tenant-isolation decision | **PENDING** |
| Owner approval signature/reference | **PENDING** |

## Final status

`ACC-001-OWNER-DECISION-002 = BLOCKED — ACCOUNTING OWNER DECISION REQUIRED`

Once the table above is completed by the authorized owner, a separate implementation mission may be considered. Until then, no Accounting code or schema work is authorized.

