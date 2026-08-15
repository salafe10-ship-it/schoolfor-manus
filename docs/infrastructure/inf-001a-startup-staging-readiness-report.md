# INF-001A — Startup/Staging Readiness Remediation

## Decision

`INF-001A = CODE-LEVEL CLOSED — STARTUP LISTENER AND READINESS ISOLATED`.

The server now registers its liveness/readiness routes and starts listening without awaiting the database initialization promise. Database readiness is reported separately and remains false until the trusted Supabase connection is confirmed.

## Root cause

`server.ts` previously awaited `DatabaseService.initialize()` before route registration and `app.listen()`. A slow or unavailable Supabase readiness query could therefore prevent both health responses and the listener from becoming available.

## Implementation

- Added a request-safe startup readiness state machine.
- Started database initialization asynchronously after the Express app is created.
- Added `GET /api/ready` with HTTP 200 only for a confirmed database connection; pending, unavailable, or failed database initialization returns HTTP 503.
- Kept `GET /api/health` as a liveness endpoint and included the non-secret startup snapshot for diagnosis.
- Preserved the existing finite Supabase request timeout and retry behavior.
- Startup migration and seed flags are ignored in Production; schema/data mutation remains an explicit non-production operation.
- No Production database, migration, RLS policy, business module, or business data was modified.

## Operational behavior

| Condition | Liveness | Readiness | Meaning |
|---|---:|---:|---|
| Database initialization pending | 200 | 503 | Process is alive; database-backed traffic is not ready |
| Trusted Supabase connected | 200 | 200 | Service is ready |
| Supabase unavailable or timed out | 200 | 503 | Process remains observable; deployment must not receive ready traffic |
| Initialization failure | 200 | 503 | Failure is bounded and exposed without secrets |

## Boundaries preserved

No changes were made to Authentication, Authorization, Tenant Isolation, RLS, migrations, Storage, Student Affairs business behavior, Production, or the database.

## Live Staging evidence

Render deployed commit `19df6d8b8900623ede9da63389a2bbec8dc720e2` successfully. The live service returned HTTP 200 from `/api/health` with `startup.state=READY`, `database=CONNECTED`, and `ready=true`; `/api/ready` also returned HTTP 200 with `state=READY` and `ready=true`. A Render service restart produced a new startup timestamp, after which health and readiness passed again. Production was not deployed or modified.
