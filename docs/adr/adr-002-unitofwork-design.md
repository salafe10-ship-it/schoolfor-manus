# ADR 002: UnitOfWork Design

## Context
Complex business operations (e.g., student enrollment involving ledger postings and inventory updates) require atomicity across multiple repository operations to maintain data integrity.

## Decision
We will implement the UnitOfWork pattern to coordinate repository operations within a single database transaction. Drizzle's `db.transaction()` will serve as the underlying mechanism.

## Alternatives
- Manual transaction management in each service method (Rejected: high risk of transaction leakage and inconsistency).

## Consequences
- Requires careful injection of transaction context into repository methods.
- Simplifies complex business process management by providing a single point of failure and rollback.

## Future Impact
Ensures system-wide data consistency even as the complexity of multi-module workflows grows.
