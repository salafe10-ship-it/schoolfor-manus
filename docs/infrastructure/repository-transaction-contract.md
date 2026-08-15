# INF-001 - Repository Transaction Contract

## Required Contract

Transaction-aware repositories receive `TransactionSession` from the application UnitOfWork. They may execute parameterized statements through that session and return typed results.

## Forbidden Repository Responsibilities

- Opening a pool connection.
- Reading database secrets.
- Calling `BEGIN`, `COMMIT`, or `ROLLBACK`.
- Calling Supabase HTTP for a transactional write.
- Applying business validation or workflow transitions.
- Falling back to a second persistence store after a transaction failure.

## Migration Path

The contract is additive infrastructure. Existing legacy repositories remain available for read compatibility and non-transactional legacy paths, but a production workflow must use transaction-aware adapters for every write in its aggregate. No EWP-001 through EWP-005 package is modified by INF-001.
