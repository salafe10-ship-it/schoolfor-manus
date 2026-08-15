# ACC-001-IMPLEMENTATION-002 — Gap Register

| ID | Priority | Area | Evidence | Required closure |
|---|---|---|---|---|
| ACC-GAP-001 | P0 | Canonical persistence | No accounting migration; fallback/local/JSON paths exist | Approve and implement PostgreSQL accounting schema and repository contract |
| ACC-GAP-002 | P0 | Journal lifecycle | `approveJournal` and `postJournal` throw `Not implemented` | Implement transactional journal lifecycle with balanced-line validation |
| ACC-GAP-003 | P0 | General ledger | GL is not proven as a canonical projection/source | Define GL source of truth and posting projection contract |
| ACC-GAP-004 | P0 | Tenant isolation | Fixed `school_1` metadata and non-dynamic accounting paths | Trusted tenant context on every read/write; isolation tests |
| ACC-GAP-005 | P0 | Closing | Browser localStorage controls year close/open state | Database-backed fiscal periods and atomic close/reopen policy |
| ACC-GAP-006 | P0 | Reports | Reports derive from UI/fallback state | Reports must read certified ledger data |
| ACC-GAP-007 | P0 | Receipts/payments | Local-storage/fallback writes remain | Canonical receipt/payment transaction and idempotency contract |
| ACC-GAP-008 | P1 | Integration | Student fees, inventory, payroll/assets are not proven end-to-end | Event/transaction integration map and reconciliation tests |
| ACC-GAP-009 | P1 | Permissions | Accounting delete path supplies always-authorized callback | Server-side permission enforcement and denial tests |
| ACC-GAP-010 | P1 | False success | No-op handlers and unchecked success notifications | Fail closed; return and surface operation results |
| ACC-GAP-011 | P1 | Tests | No dedicated accounting tests found | Unit, integration, isolation, failure, concurrency, idempotency matrix |
| ACC-GAP-012 | P1 | Secrets | Repository contains a hardcoded posting-engine token-like constant | Replace with server-managed secret configuration and rotate exposed value |
| ACC-GAP-013 | P2 | UX | Report navigation no-ops | Fixed in `FinancialReportsTab.tsx`; add automated regression coverage |
| ACC-GAP-014 | P2 | Observability | Several accounting actions only log or do nothing | Structured audit events and actionable error responses |

## Owner decisions required

1. Canonical accounting schema and migration owner.
2. Chart-of-accounts ownership and account mapping rules.
3. Posting approval and reversal policy.
4. Fiscal-period close/reopen authority and correction workflow.
5. Revenue recognition, tax, depreciation, and opening-balance rules.
6. Integration ownership for Student Fees, Inventory, Payroll/HR, and Assets.

## Status

`HARDENING REQUIRED` — no production or database changes were made by this audit.
