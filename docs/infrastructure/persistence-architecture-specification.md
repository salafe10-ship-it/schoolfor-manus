# INF-001 - Persistence Architecture Specification

## Decision

Production writes use a server-side PostgreSQL transaction boundary. The browser and Supabase HTTP client are not transaction coordinators.

```text
Application Service
        ↓
Request-scoped UnitOfWork
        ↓
Transaction-aware Repository
        ↓
Server-side PostgreSQL PoolClient
        ↓
BEGIN → parameterized writes → COMMIT
                    ↘ failure → ROLLBACK
```

## Ownership

- The application service owns the operation lifetime.
- `UnitOfWork` owns exactly one transaction session for the request.
- Repositories receive a transaction session and issue parameterized statements only.
- The PostgreSQL driver owns connection acquisition, `BEGIN`, `COMMIT`, `ROLLBACK`, and release.
- No repository opens a pool connection or finalizes a transaction.

## Isolation Boundary

- `DATABASE_URL`/`DIRECT_URL` is read only by server-side infrastructure.
- The pool is never imported into React or exposed to the browser.
- `SUPABASE_ANON_KEY` remains the client-side database credential for read-only compatibility.
- Transactional writes do not use Supabase REST calls.

## Failure Semantics

Any query, repository, connection, or timeout failure rolls back the same PostgreSQL transaction and releases the connection. The UnitOfWork does not apply fallback writes after a server transaction begins.

## Compatibility

The existing local fallback buffer remains available for legacy tests and offline demonstrations when no server transaction driver is configured. Production workflows must refuse transactional writes when the driver is unavailable; they must not silently claim database atomicity.

## Non-Goals

No business workflow, schema, RLS, RPC, controller, UI, or domain rule is introduced by INF-001.
