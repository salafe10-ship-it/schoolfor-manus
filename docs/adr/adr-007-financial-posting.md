# ADR 007: Financial Posting

## Context
Financial data integrity requires immutable ledgers and traceable entries.

## Decision
We will enforce double-entry bookkeeping using a `PostingEngine`. Once a transaction is "Posted", it becomes immutable in the ledger; any adjustments must be made through explicit reversing entries.

## Alternatives
- Allow direct editing of posted entries (Rejected: audit nightmare).

## Consequences
- Strict financial control.
- Requires complex workflow for correcting errors (reversal/re-entry).

## Future Impact
Ensures auditability and consistency of financial statements.
