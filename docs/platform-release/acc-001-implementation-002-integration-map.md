# ACC-001-IMPLEMENTATION-002 — Accounting Integration Map

## Canonical direction

Accounting must receive immutable, idempotent business events or transactional commands and produce balanced journal entries in one canonical persistence boundary. UI state, browser storage, JSON files and mock data are not accounting sources of truth.

| Producer | Accounting input | Required identity | Required control |
|---|---|---|---|
| Student Affairs / Fees | Invoice issued, fee assessed, payment received, refund | tenant, school, branch, actor, request, correlation | idempotency key and reversal linkage |
| Inventory | Purchase, issue, return, stock adjustment | tenant, school, branch, warehouse, actor | approved valuation policy and balanced posting |
| HR / Payroll | Payroll accrual, payment, deduction | tenant, school, branch, payroll period | period lock and approval evidence |
| Fixed Assets | Acquisition, transfer, depreciation, disposal | tenant, school, branch, asset | depreciation and disposal policy |
| Banking / Cash | Deposit, withdrawal, transfer, reconciliation | tenant, school, branch, bank account | external reference and reconciliation state |
| Governance | approval, audit, outbox delivery | tenant, actor, request, correlation | append-only audit and retry-safe outbox |

## Required accounting outputs

- Journal entry with balanced debit/credit lines.
- Source document type and id.
- Posting status and fiscal period.
- Idempotency key and correlation id.
- Append-only audit event.
- Reversal reference when a correction is required.

## Current verification

The current repository does not prove any of the above as a complete production path. The financial API writes JSON files, UI flows use local/fallback state, and posting lifecycle methods are incomplete. Therefore no external integration is certified.

## Failure contract

Producer failure, validation failure, duplicate delivery, concurrent delivery and closed-period delivery must be observable and must not create a partial or false-success accounting result. This requires a database transaction and a durable outbox/idempotency design; it is not implemented by this mission.
