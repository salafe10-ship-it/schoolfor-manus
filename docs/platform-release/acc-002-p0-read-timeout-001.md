# ACC-002-P0-READ-TIMEOUT-001

## Mission

Investigate the production financial-read timeout before enabling any accounting write or posting operation.

## Scope

Read-only tracing of `GET /api/financial/database` and its paired operational-context request from the financial portal through authentication, tenant resolution, UnitOfWork, Hyperdrive/PostgreSQL, serialization, and HTTP response.

## Required evidence

- exact endpoint and request duration;
- connection-acquisition and transaction-begin duration;
- each SQL statement, tenant/school predicates, row count, and database execution duration;
- Hyperdrive and PostgreSQL latency where available;
- whether the delay occurs before DB execution, during RLS/policy evaluation, during query execution, or during response serialization;
- proof that no fallback, empty fabricated result, cached stale balance, or false success hides the failure.

## Guardrails

Do not run migrations, modify production schema/RLS/indexes, generate balances/journals, enable financial writes, add retry loops, or increase the timeout without a measured cause.

## Current status

`INSUFFICIENT EVIDENCE`: the browser proves the financial read reaches its client deadline and the UI fails closed, but it does not yet prove the exact server/database stage responsible. The next implementation must produce stage-level evidence before changing financial semantics.
