# CONN-SEC-003A — Diagnostic Invocation Contract

## Scope

This temporary Staging-only control exists solely to invoke the already-approved `/api/internal/staging/connection-identity` endpoint during `CONN-SEC-003`. It is not a replacement endpoint and it is not enabled for Production.

## Visibility gate

The control is rendered only when the browser hostname is the exact canonical Staging hostname `edupro-school-erp-staging.onrender.com`. The server endpoint remains independently gated by the Staging environment flag, the diagnostic enable flag, authentication, and the database-monitor permission.

## Allowed result fields

The control may display only `current_user`, `session_user`, `rolsuper`, and `rolbypassrls`. It must never display a password, token, connection string, database URL, or key.

## Cleanup requirement

After `CONN-SEC-003` obtains its evidence, this temporary control and its supporting invocation documentation must be removed in the cleanup commit. No Production deployment is permitted.
