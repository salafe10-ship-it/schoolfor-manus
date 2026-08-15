# ACC-001-IMPLEMENTATION-002 — Full Accounting Audit

## Scope and authority

This audit covers the accounting surfaces requested by the consultant under owner authorization `ACC-001-IMPLEMENTATION-002`. The review is limited to the repository state on the audit date and does not execute SQL, alter Supabase, alter production, or change accounting policy.

## Executive result

Accounting is not release-ready as a canonical enterprise module. The visible portal contains substantial accounting UI and local simulation paths, but the repository does not contain an approved accounting schema migration and the canonical write path is not consistently PostgreSQL-backed. Several functions are explicit stubs or false-success paths. The safe UI defects identified in the report-card navigation were fixed; policy-dependent accounting behavior remains blocked for owner decision.

## Surface audit

| Layer | Finding | Release impact |
|---|---|---|
| Persistence | No approved accounting migrations were found. Repositories fall back to local/in-memory storage when Supabase is unavailable. | P0 blocker |
| Accounting domain | Chart of accounts, journals, receipts, payments, reports, closing, assets and budgets are represented mainly in UI/context state. | P0 blocker |
| Posting | `AccountingPostingService.approveJournal` and `postJournal` are explicit `Not implemented` paths. | P0 blocker |
| Posting engine | Posting uses fixed account mappings and a system actor; this is not an approved enterprise account-mapping contract. | Owner decision required |
| API | `/api/financial/database` persists tenant-named JSON under `src/db`, not a canonical accounting database. | P0 blocker |
| UI | Several report cards and account drill-down actions were no-op callbacks. Fixed in this mission. | Fixed |
| Receipts/payments | Local-storage and fallback paths exist; payment path fails closed only when canonical persistence is explicitly required. | P0/P1 blocker |
| Closing | Year-close state uses browser localStorage keys and is not a database transaction. | P0 blocker |
| Reports | Reports are derived from current UI/fallback state; no certified GL source exists. | P0 blocker |
| Security | Hardcoded school/user metadata and an always-authorized delete callback were found in accounting UI execution paths. | P0/P1 blocker |
| Tests | No dedicated accounting test suite was found under `src/__tests__`. | P1 blocker |

## Functional coverage

The repository contains entry points for General Ledger, Chart of Accounts, Journal Entries, Receipts, Payments, Customer Ledger, Supplier Ledger, Financial Reports, Closing, Bank Transfers, Estimated Budget and Fixed Assets. Presence of a screen is not treated as proof of canonical persistence or financial correctness.

## False-success audit

The following patterns were confirmed and must remain release blockers until replaced or formally accepted:

- `localStorage` writes in receipt/payment and closing flows.
- `FallbackStorage` as a persistence path for accounting state.
- React state-only invoice creation.
- JSON-file persistence in `server.ts` financial API.
- `console.log` and empty handlers for accounting actions.
- explicit `Not implemented` posting methods.
- success notifications after state-only or unchecked operations.
- fixed tenant/user metadata such as `school_1` and `mgr_sulaiman`.

## Safe remediation completed

Only technically unambiguous UI wiring was changed:

1. Six financial report-card buttons now invoke the existing `handleSelectReport` handler.
2. The account-statement button inside report lines now invokes the existing permission-aware `handleDrillDownToAccount` handler.

No account mappings, posting rules, fiscal-period behavior, closing policy, reversal policy, tax policy, depreciation rules, or persistence contracts were changed.

## Closure statement

`ACCOUNTING RELEASE CLOSED` cannot be certified. The required next gate is an approved canonical accounting persistence contract and owner decisions for account mapping, posting, period closing, reversal, and integration ownership.
