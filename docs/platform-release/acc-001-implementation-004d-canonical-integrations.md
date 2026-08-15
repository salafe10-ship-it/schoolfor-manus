# ACC-001-IMPLEMENTATION-004D — Canonical Integration Containment

## Implemented

- Invoice issuance now creates and posts its journal only through `PostingEngine`.
- Direct `FallbackStorage` journal insertion was removed from the invoice integration.
- Missing deferred/earned revenue mappings now produce `ACCOUNTING DECISION REQUIRED`; no default account IDs are invented.
- In canonical mode, revenue-recognition or accounts-receivable integration failures abort the invoice transaction instead of becoming a successful invoice with incomplete accounting.
- Local compatibility mode may still report unavailable optional integrations without pretending to be canonical production persistence.

## Boundary

No account mapping was selected, no migration was created, and no SQL/Supabase/production object was changed.
