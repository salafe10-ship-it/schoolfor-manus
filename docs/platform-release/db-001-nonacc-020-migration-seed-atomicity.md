# DB-001-NONACC-020 — Migration and Seed Atomicity

## Decision

`CLOSED — IMPLEMENTED IN CODE`

The migration and seed engines now use one request-scoped PostgreSQL transaction per invocation. They fail closed when the PostgreSQL transaction driver is unavailable.

## Implemented Contract

- The explicit migration and seed CLIs create a `PostgresTransactionDriver` from `DIRECT_URL` or `DATABASE_URL`.
- `UnitOfWork.runInTransaction` owns the full operation boundary.
- Every database read/write in these engines is executed through the active `TransactionSession`.
- A successful invocation commits only after all phases complete.
- Any phase error propagates out of the work callback and causes rollback.
- The transaction driver is closed after the invocation; it is not shared across requests.
- Production CLI guards remain fail-closed and cannot be overridden by environment flags.
- No retry or partial-success recovery path is introduced.

## Scope

Only the migration engine, Student Affairs migration adapter, seed engine, explicit CLIs, and their validation tests were changed. No migration was executed and no database was modified.

## Operational Preconditions

The operator must provide a valid `DIRECT_URL` or `DATABASE_URL` to the explicit non-production CLI. The application must have a configured PostgreSQL transaction driver before any automatic non-production invocation is permitted.
