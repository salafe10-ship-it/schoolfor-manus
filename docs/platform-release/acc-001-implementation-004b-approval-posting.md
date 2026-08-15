# ACC-001-IMPLEMENTATION-004B — Approval and Posting Boundary

## Implemented

- Approval now requires `schoolId`, approver identity, an existing draft/submitted journal, and a persisted `approved` result.
- Posting now requires `schoolId`, poster identity, an existing approved journal, and a post-operation read proving `posted` state.
- Both paths delegate to the existing PostingEngine/JournalRepository canonical adapter.
- Reversal remains fail-closed with `ACCOUNTING DECISION REQUIRED`; no reversal policy was invented.

## Boundary

This change does not select account mappings, revenue/tax rules, fiscal close policy, or reversal policy. It only closes false-success and missing-identity paths around the existing canonical posting engine.
