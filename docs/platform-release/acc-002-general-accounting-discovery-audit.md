# ACC-002 — General Accounting Discovery & Readiness Audit

## Mission boundary

Discovery only. No Accounting policy, schema, SQL, migration, RLS, seed, UI, or production change was made. The existing `ACC-001-OWNER` gate remains independent and is not inferred or bypassed.

## Executive decision

`ACC-002 = BLOCKED — ACCOUNTING SOURCE OF TRUTH, CANONICAL WRITE, AND OWNER CONTRACT ARE NOT RELEASE-READY`

The repository contains a broad accounting UI and several partial services/repositories, but the evidence does not support certifying General Accounting for real financial operations.

## Surface inventory

The General Ledger portal exposes these accounting surfaces:

- Dashboard and financial indicators
- Chart of Accounts
- Cost Centers
- Journal Entries
- Receipt Vouchers
- Payment Vouchers
- Bank Transfers
- Student Receivables
- Supplier Ledger
- Fixed Assets
- Financial Reports
- Estimated Budget
- Closing / Year End
- Permissions and financial policy screens
- Calculation tools

Supporting files include `GeneralLedgerPortal`, the accounting presentation tabs, `AccountRepository`, `JournalRepository`, `GeneralLedgerRepository`, `AccountingPostingService`, `PostingEngine`, and `AccountingPostingEngine`.

## Findings

### ACC-002-P0-001 — No certified canonical Accounting database

The approved `supabase/migrations` set contains no Finance/Accounting migration defining accounts, receipts, journal entries, journal lines, general-ledger lines, balances, fiscal periods, or accounting idempotency state. The canonical PostgreSQL source of truth is therefore not evidenced.

Impact: financial certification and production posting must remain blocked.

### ACC-002-P0-002 — UI payment path is explicitly non-canonical

`src/App.tsx` blocks the legacy payment flow when canonical persistence is required, which is correct fail-closed behavior. When the guard is not active, the path writes receipt, journal, and balance-like state to browser `localStorage`, updates React state, and emits success notifications. It is not a production accounting writer.

Impact: no real financial success may be claimed from this path.

### ACC-002-P0-003 — Invoice creation is in-memory only

`handleInvoiceCreateSubmit` creates an invoice with a client timestamp identifier and stores it only in React state. No canonical repository/database write, server-generated identity, tenant contract, or durable audit transaction is proven.

Impact: invoice data can disappear and cannot be certified as financial truth.

### ACC-002-P1-004 — Server financial API writes a tenant-named JSON file

`server.ts` exposes `/api/financial/database`. The route has authentication and permission middleware, but it reads/writes `src/db/financial_portal_database_<school>.json` rather than PostgreSQL. The write accepts the request body as a whole and returns success after filesystem write; no accounting transaction, schema constraints, idempotency, concurrency, or reconciliation contract is proven.

Impact: a permissioned API response is not evidence of durable accounting correctness.

### ACC-002-P1-005 — Posting services are incomplete or use unresolved policy

`AccountingPostingService.approveJournal`, `postJournal`, and reversal behavior contain unimplemented paths. `AccountingPostingEngine` uses fixed `CASH_ACCOUNT` / `REVENUE_ACCOUNT` mappings and system actor metadata; these are not approved owner decisions. `PostingEngine` contains partial posting calculations but relies on fallback-backed state and is not proven as the canonical receipt-to-ledger writer.

Impact: account mapping, posting authority, reversal, and financial effect timing remain unsafe to certify.

### ACC-002-P1-006 — Accounting UI still uses fallback/local state

`GeneralLedgerPortal`, `JournalEntriesTab`, `ReceiptVoucherTab`, `PaymentVoucherTab`, and closing flows read/write `localStorage` and/or `FallbackStorage`. The portal contains a chart-of-accounts mock seed and synchronizes UI state into fallback storage before running posting actions. This is not an enterprise source of truth.

Impact: cross-device durability, multi-user consistency, auditability, and reconciliation are unproven.

### ACC-002-P1-007 — Hard-coded tenant and authorization decisions in UI execution paths

Accounting execution helpers use hard-coded `school_1` and system/user metadata in multiple paths. The chart-of-accounts delete flow supplies `authorizationBlock: () => ({ authorized: true })`. This does not prove trusted server authorization or tenant context for a financial mutation.

Impact: cross-school isolation and least-privilege enforcement cannot be certified for accounting actions.

### ACC-002-P1-008 — Several visible actions are notification-only or no-op

The portal contains handlers that only log to the console for print, bank transfer, drill-down, calculation, and asset operations. Supplier actions also display informational notifications for missing accounting setup. These surfaces must not be counted as complete business operations without durable evidence.

Impact: customer-facing confidence and functional completeness are lower than the visual surface suggests.

### ACC-002-P1-009 — Closing flow is local/demo state

The closing flow writes year-close/open flags to browser `localStorage`, including `erp_is_year_2026_closed` and `erp_is_year_2027_opened`. This is not an authoritative accounting-period close, does not prove database locking, and cannot certify period integrity.

### ACC-002-P2-010 — Financial reports are projection/UI-derived

Reports, trial balance, income statement, balance sheet, and drill-down views are assembled from in-memory/fallback collections and hard-coded mappings in the UI. No canonical ledger query, report snapshot policy, or reconciliation proof was found in the approved migrations.

### ACC-002-P2-011 — Accounting regression coverage is not evidenced

No dedicated accounting test files were found under `src/__tests__`. Existing repository and integration tests do not establish live accounting commit, rollback, duplicate posting, concurrent posting, closed-period, reversal, or cross-school isolation behavior.

## Security and isolation review

Positive evidence:

- Server financial routes are behind authentication and financial permission middleware.
- Repository queries commonly include `school_id` predicates.
- The payment UI fails closed when canonical persistence is required.

Blocking gaps:

- The canonical Accounting database/RLS contract is not present in migrations.
- UI execution paths use hard-coded school and actor metadata.
- A client-side authorization block returns `authorized: true` in a financial account deletion path.
- File-backed persistence is not equivalent to database-enforced tenant isolation.

## Commercial and UX assessment

The screens look feature-rich, but a paying customer would notice risk if invoices, receipts, reports, or closing actions do not persist durably or if actions only show notifications. The visual breadth currently exceeds the proven business capability.

## Owner-gated decisions required before implementation

The existing ACC-001 decision package must resolve:

1. Chart-of-accounts identity, hierarchy, postability, and ownership scope.
2. Receipt and journal lifecycle and approval authority.
3. Student-fee account mapping.
4. Balance source: stored, derived, or projection.
5. Period closing/reopening and correction rules.
6. Reversal and immutable posted history.
7. Idempotency and unknown-outcome recovery.
8. Concurrency strategy.
9. Audit/outbox coupling.
10. Canonical PostgreSQL schema and server transaction boundary.

## Recommended sequence

`Accounting Owner Contract → canonical schema/writer mission → focused accounting tests → staging transaction evidence → final release validation`.

No Accounting implementation should start from the current UI or fallback repositories without that sequence.

