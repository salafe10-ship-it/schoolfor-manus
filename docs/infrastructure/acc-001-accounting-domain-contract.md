# ACC-001 — Accounting Domain Contract

**Mission:** `PROGRAM-RELEASE-P0-002 / ACC-001`  
**Mode:** Architecture and owner-decision package only  
**Date:** 2026-08-13  
**Decision:** `BLOCKED — ACCOUNTING OWNER DECISION REQUIRED`

## 1. Purpose and boundary

This document defines the decisions that must exist before the ERP can create a canonical Accounting schema or writer. It does not authorize SQL, migrations, schema changes, UI changes, data migration, or production activity.

The first governed flow is:

`Student Fee Collection → Receipt → Journal Entry → Journal Lines → General Ledger → Balance Projection → Audit/Outbox`

Student Affairs may initiate a collection request, but Finance/Accounting owns the receipt, journal, ledger, balances, posting, reversal, and financial statement meaning.

## 2. Evidence extracted from the current repository

- `src/App.tsx` has a legacy payment path that writes receipt-like, journal-like, and account-balance data to browser localStorage.
- DB-002 now fails that path closed when canonical persistence is configured; it must not be treated as a production writer.
- `src/database/services/AccountingPostingService.ts` calculates an in-memory journal, but approval and posting methods are not implemented.
- `src/modules/accounting/application/AccountingPostingEngine.ts` contains a student-fee mapping using fixed `CASH_ACCOUNT` and `REVENUE_ACCOUNT` identifiers. This is evidence of an attempted mapping, not an approved Accounting policy.
- `src/database/services/PostingEngine.ts` contains posting and balance calculations, but its canonical production persistence and schema are not proven for the receipt path.
- `src/database/repositories/JournalRepository.ts`, `VoucherRepository.ts`, `AccountRepository.ts`, and `GeneralLedgerRepository.ts` contain repository/enlistment code, but no approved Finance/Accounting migration exists in `supabase/migrations`.
- `getDefaultChartOfAccounts` currently returns only a small representative root set and `getSystemMappings` returns no mappings. It cannot be used as the enterprise chart-of-accounts contract.

## 3. Domain ownership

| Capability | Owning domain | Permitted callers | Source of truth | Current status |
|---|---|---|---|---|
| Fee collection request | Student Affairs / Finance boundary | Approved Student/Finance application service | Approved Finance contract | Not finalized |
| Receipt | Finance | Finance UI/services | PostgreSQL/Supabase | Not present as canonical flow |
| Journal entry and lines | Accounting | Finance posting service | PostgreSQL/Supabase | Partial code, no approved schema |
| General ledger | Accounting | Posting service and reporting | PostgreSQL/Supabase | Partial enlistment code |
| Account balance | Accounting | Ledger projection/reporting | Owner decision required | Semantics unresolved |
| Audit event | Governance/Audit | Canonical posting service | Append-only audit store | Cross-domain contract required |
| Outbox event | Governance/Integration | Canonical posting service | PostgreSQL outbox | Event contract required |

## 4. Required domain contract

The Accounting owner must approve the following before implementation:

1. The chart-of-accounts identity, code, hierarchy, account nature, leaf/postable rules, active state, and ownership scope.
2. The authoritative account mapping for student fee collection, including cash/bank, receivable, deferred revenue, and tuition revenue treatment where applicable.
3. Receipt lifecycle and the exact event that makes a receipt financially effective.
4. Journal entry and journal-line fields, balancing precision, currency, exchange rate, fiscal period, branch, and cost-center rules.
5. Whether balances are stored, derived from ledger lines, or maintained as a projection with a rebuild/reconciliation rule.
6. Posting order and the relationship cardinality between receipt, journal entry, and ledger lines.
7. Reversal and correction policy after posting or period close.
8. Idempotency key, uniqueness scope, duplicate response, and unknown-outcome recovery.
9. Optimistic version and/or database locking policy for concurrent posting.
10. Required audit and outbox events and whether they are inside the same transaction.

## 5. Invariants that are safe to require

These are engineering invariants, not a substitute for Accounting policy:

- A canonical financial success response requires confirmed PostgreSQL/Supabase persistence.
- A posted journal has at least one debit and one credit line and total debit equals total credit within the approved precision.
- A posted receipt cannot leave a journal or ledger state partially committed.
- A posted journal is immutable by update/delete; correction is represented by an approved reversal or adjustment flow.
- A duplicate idempotency key cannot create a second financial effect.
- A timeout or network failure after a write begins is `OUTCOME_UNKNOWN`, not success and not an automatic mutation retry.
- All financial records are scoped to the trusted tenant/school/branch context supplied by the server; client scope values are not authoritative.
- Audit and required outbox records are generated from the trusted actor/request context.

## 6. Approval status

The engineering invariants above are ready to carry into implementation. The financial meanings and mappings are not resolved by the current code. Therefore:

**ACC-001 = BLOCKED — ACCOUNTING OWNER DECISION REQUIRED**

No Accounting schema, migration, canonical writer, or DB-003 reopening is authorized until the owner approves the decision matrix and lifecycle/transaction contracts in this package.
