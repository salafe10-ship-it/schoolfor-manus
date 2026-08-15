# ACC-001-IMPLEMENTATION-004A — Canonical Persistence Discovery

## Scope

Technical discovery and safe containment only. No accounting mapping, tax rule, revenue rule, schema, migration, RLS, RPC, or production change was introduced.

## Confirmed gaps

1. `AccountingPostingService.createJournal` previously calculated an in-memory entry and returned it without calling a repository. That was a false-success path.
2. `AccountingPostingEngine` contained illustrative `CASH_ACCOUNT` and `REVENUE_ACCOUNT` mappings and marked generated entries as posted without an approved account-mapping contract.
3. `JournalRepository` already provides the canonical adapter path through `PostingEngine.createJournalEntryDraft`; the service was not using it.

## Safe remediation

- `AccountingPostingService.createJournal` now requires a trusted `schoolId` and delegates creation to `PostingEngine.createJournalEntryDraft`.
- `AccountingPostingEngine.post` now fails closed with `ACCOUNTING DECISION REQUIRED` until approved mapping and canonical persistence are available.
- The illustrative account identifiers were removed from the executable path.

## Boundary

The implementation intentionally stops short of approval/posting policy and account mapping. Those remain in the Decision Register and require an approved financial decision or a separate schema mission if database objects are needed.
