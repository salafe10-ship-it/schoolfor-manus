# DB-001-NONACC — Non-Accounting Transaction and Atomicity Audit

**Mode:** Static/read-only audit; no transaction was opened against Staging or Production  
**Decision:** `P1/P2 HARDENING REQUIRED`

## Transaction infrastructure

- `UnitOfWork` provides request-chain transaction context, commit/rollback, nested-transaction rejection, and an optional PostgreSQL transaction driver.
- `PostgresTransactionDriver` uses a request-scoped pool client and explicit `BEGIN`, `COMMIT`, `ROLLBACK`, and release behavior.
- Repositories can enlist parameterized SQL commands in an active transaction.
- `StudentAdmissionService` demonstrates a composite Unit of Work for Student-related records.

These are positive foundations, but a static contract does not prove every route uses them.

## Non-accounting atomicity matrix

| Operation | Transaction path | Partial-write risk | Assessment |
|---|---|---|---|
| Student admission composite | Unit of Work enlists student, related records, invoice/audit | Depends on configured PostgreSQL driver and complete command coverage | P1: live route proof required |
| Student documents metadata | Repository write path, not a demonstrated composite transaction with audit/version | Metadata/audit coupling not proven | P1 |
| Exams config save | Single upsert path; local fallback in compatibility mode | No multi-table atomicity requirement proven | P2 source-of-truth gate required |
| Attendance bulk | Direct Supabase insert, fallback array write after failure | No single transaction contract and can return success after failure | P1 |
| Employee/Teacher save | Direct upsert, fallback array write after failure | No transaction/audit/version boundary shown | P1 |
| Inventory save/delete | Direct upsert/delete, fallback array write after failure | No transaction/audit/version boundary shown | P1 |
| Notifications create | `performWrite`, canonical and fallback paths | Audit/delivery coupling not proven | P2/P1 depending on delivery guarantee |
| Migration runner | Sequential student/exam/auxiliary writes | Fail-fast now, but prior steps may already have committed | P1 if enabled outside a transaction-aware runner |
| Seed runner | Sequential table inserts with fail-fast errors | Prior seeded tables may remain after later failure | P1; explicit admin operation only |

## Unknown outcome and retry

The canonical Student mutation surface intentionally avoids automatic mutation retry. Several legacy non-accounting writers still use direct upsert/insert plus fallback and do not expose a standardized `OUTCOME_UNKNOWN` result. A network timeout after server acceptance can therefore be indistinguishable from a failed write to callers. Classification: **🟠 P1**.

## Concurrency

Some repositories (for example invoices, receivables, and canonical students) contain version checks. Attendance, Employee/Teacher, Inventory, and document metadata paths reviewed here do not demonstrate a consistent version predicate on every mutation. Classification: **🟠 P1** for mutable authoritative records.

## Decision

Transaction infrastructure is present and tested in isolation, but non-accounting route coverage is incomplete. No direct P0 corruption was proven because this audit was read-only. Release certification requires route-level transaction/failure tests before closure.
