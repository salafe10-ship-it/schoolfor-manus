# INF-001 - Transaction Infrastructure Design

## Transaction Lifecycle

1. `UnitOfWork.runInTransaction` validates that no UnitOfWork is already active in the async request context.
2. The configured server driver acquires one pooled connection and issues `BEGIN`.
3. Repositories enqueue or execute parameterized commands against that session.
4. The UnitOfWork commits once after the application callback succeeds.
5. Any failure invokes rollback and releases the connection.

## Context Propagation

Node requests use `AsyncLocalStorage` through the existing context adapter. The context carries transaction ID, tenant ID, school ID, metadata, pending commands, and the active database session. Browser fallback storage is not treated as a production database transaction.

## Pooling

`PostgresTransactionDriver` uses one shared server-side `pg.Pool`. Pool size and timeouts are environment-configurable. A checked-out `PoolClient` belongs to exactly one UnitOfWork and is released after commit or rollback.

## Query Safety

Commands carry SQL text and positional parameters. The driver never interpolates values. A repository write without a parameterized command is rejected while a database transaction is active.

## State Rules

- A committed or rolled-back session cannot accept another query.
- A released session cannot be reused.
- A second commit or rollback on the same UnitOfWork is rejected.
- Nested UnitOfWork execution is rejected.
- No connection is created by a repository.
