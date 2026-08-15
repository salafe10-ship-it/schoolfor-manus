# INF-002 — Server Startup and Data-Layer Dependency Isolation Verification

**Mission:** INF-002  
**Priority:** Critical  
**Scope:** Diagnostic analysis only  
**Environment inspected:** Staging only  
**Production or database changes:** None

## 1. Executive Summary

The Staging deployment builds successfully and starts the Node process, but the application does not reach route registration or `app.listen()`.

The startup path configures the PostgreSQL transaction driver first, then awaits `DatabaseService.initialize()` before registering the first HTTP route. `DatabaseService.initialize()` first initializes the local JSON fallback and then awaits the legacy Supabase connection manager. The connection manager performs a live Supabase query against `schools` without an explicit request timeout.

This creates a startup coupling defect: the PostgreSQL transaction driver is structurally initialized independently, but the web server remains unavailable until the legacy Supabase initialization promise settles. Staging runtime logs stop immediately after `Initializing Data Access Layer...`, before any connection attempt, fallback completion, route registration, or listening message.

**Root-cause classification:** **C — Startup coupling defect**, with an unbounded legacy Supabase readiness wait as the most likely blocking mechanism. The evidence is sufficient to block `INF-001A` and `SOP-001` until a separately approved repair mission isolates or bounds this dependency.

## 2. Exact Startup Sequence

The sequence in `server.ts` is:

1. `startServer()` creates the Express application and configures middleware (`server.ts:51-83`).
2. `createPostgresTransactionDriverFromEnvironment()` is called (`server.ts:85`).
3. If `DIRECT_URL` or `DATABASE_URL` is present, the driver is configured in `UnitOfWork` (`server.ts:86-88`). Otherwise, the server logs that transactional writes are unavailable (`server.ts:89-91`).
4. `await DatabaseService.initialize()` is executed (`server.ts:93-94`). This is a hard startup barrier.
5. Only after that promise resolves does the first API route, `/api/auth/login`, get registered (`server.ts:96-98`).
6. Static serving and the SPA catch-all are registered near the end of startup (`server.ts:1170-1175`).
7. `app.listen()` is called only after all prior initialization completes (`server.ts:1177-1180`).
8. `startServer()` is invoked at module end (`server.ts:1183`).

**Operational consequence:** while `DatabaseService.initialize()` is pending, no API route and no health route can answer because Express has not reached route registration and the process has not called `listen()`.

## 3. DatabaseService Analysis

`DatabaseService.initialize()` performs the following (`src/database/services/DatabaseService.ts:14-57`):

1. Returns immediately only when its static `isInitialized` flag is already true.
2. Logs `Initializing Data Access Layer...`.
3. Awaits `FallbackStorage.initialize()` (`:26-27`).
4. Obtains the singleton `DatabaseConnectionManager` (`:29-30`).
5. Awaits `manager.connectWithRetry(3, 300, 2000)` (`:31`).
6. Runs migrations or seeds only when explicitly enabled by `AUTO_MIGRATE=true` or `AUTO_SEED=true` (`:37-47`).
7. Logs local fallback mode only after the connection manager returns `null` (`:48-50`).
8. Marks the data layer initialized (`:52`).

`FallbackStorage.initialize()` is finite local filesystem work and sets its `initialized` flag after loading its JSON stores (`src/database/repositories/FallbackStorage.ts:419`). It is not itself configured with a retry loop. The observed Staging log does not contain the later fallback or Supabase success messages, so the runtime evidence locates the unresolved barrier inside the awaited data-layer sequence, but does not justify a claim that filesystem work failed.

## 4. DatabaseConnectionManager Analysis

The singleton connection manager is implemented in `src/database/client.ts`.

- It prevents parallel initialization with `isInitializing` (`:58-64`). A second caller waits in a loop at 100 ms intervals until the first caller clears the flag.
- It reads `SUPABASE_URL` and `SUPABASE_ANON_KEY` (`:69-70`).
- Missing, invalid, or placeholder configuration returns `null` promptly and clears `isInitializing` (`:82-87`).
- With configured values, it creates a Supabase client and executes `from('schools').select('id').limit(1)` (`:97-107`).
- It retries up to the caller-provided maximum (`:93-137`), logging each attempt and using exponential backoff capped by `maxDelayMs`.
- On exhaustion it sets `DISCONNECTED`, clears `isInitializing`, and returns `null` (`:140-142`).

The important isolation finding is that the Supabase request itself is not wrapped in an explicit application-level timeout. The retry loop can react to a rejected query, but it cannot advance to the next attempt while the query promise remains pending. Therefore, a network or service condition that leaves the Supabase query unresolved can hold the entire server bootstrap indefinitely.

## 5. Supabase Initialization Analysis

Supabase initialization is a mandatory dependency of the current bootstrap path whenever `SUPABASE_URL` and `SUPABASE_ANON_KEY` pass validation:

- `DatabaseService.initialize()` always awaits the connection manager.
- The manager validates readiness by querying the `schools` table, rather than merely constructing a client.
- The local fallback path is reached only after the manager returns `null`.
- No route or health endpoint is available before that decision is complete.

When Supabase configuration is absent or invalid, the code is designed to fall back quickly. When configuration is present but the readiness query does not settle, the fallback is not reached. This is the precise distinction between a configuration failure and the observed startup coupling defect.

No service-role key or secret value was emitted in the report or runtime evidence. Staging runtime logs reported `injected env (0)`; this was treated only as a presence/status signal, not as a secret disclosure.

## 6. PostgreSQL Transaction Driver Analysis

`createPostgresTransactionDriverFromEnvironment()` (`server/infrastructure/PostgresTransactionDriver.ts:86-100`) reads `DIRECT_URL || DATABASE_URL` and creates a `pg.Pool` with:

- Pool maximum: `PG_POOL_MAX` or 20.
- Idle timeout: `PG_IDLE_TIMEOUT_MS` or 30 seconds.
- Connection timeout: `PG_CONNECTION_TIMEOUT_MS` or 5 seconds.
- SSL enabled by default unless `PGSSLMODE=disable`.

The transaction driver is therefore instantiated before the legacy Supabase data-layer wait. Its transaction boundary is request-scoped when used: `begin()` obtains a pool client, executes `BEGIN`, applies `READ COMMITTED`, optionally applies a transaction-local statement timeout, and releases the client on begin failure (`PostgresTransactionDriver.ts:65-79`).

**Independence result:** driver construction is independent of Supabase initialization. **Availability result:** it is operationally coupled to Supabase because the application does not listen until the later `DatabaseService.initialize()` await completes. No redesign of the transaction driver is required to establish this finding.

## 7. Route Registration Ordering

Route registration is after the blocking await:

- Authentication route begins at `server.ts:98`.
- Health route is registered at `server.ts:253`.
- Static and catch-all routes are registered at `server.ts:1170-1175`.
- Listening occurs at `server.ts:1178`.

Consequently, a load balancer or browser cannot receive a normal application response while initialization is pending. The absence of the health route during this interval prevents the health endpoint from being used to distinguish “process alive but not ready” from “process not listening.”

## 8. Retry/Timeout Analysis

### Supabase connection manager

- `DatabaseService` requests 3 attempts with a 300 ms base delay and 2,000 ms cap (`DatabaseService.ts:31`).
- Effective delays after failed attempts are 600 ms and 1,200 ms before the final attempt.
- A rejected query is retried; a query that never resolves is not bounded by this loop.
- After three rejected attempts, the manager returns `null` and fallback can proceed.
- There is no explicit connection-request timeout around `tempClient.from(...).select(...).limit(1)`.

### PostgreSQL pool

- Pool acquisition has a 5,000 ms default connection timeout (`PostgresTransactionDriver.ts:90-96`).
- This timeout applies to PostgreSQL pool acquisition, not to the Supabase readiness query.

### Indefinite-wait risk

The `isInitializing` wait loop (`client.ts:58-63`) can also wait indefinitely if the original connection attempt remains pending and never reaches the cleanup paths that clear `isInitializing`.

## 9. Runtime Evidence

Staging deployment evidence was collected from Render logs for the clean `main` deployment:

- Build completed successfully: `✓ built in 11.98s`.
- Server bundle was produced: `dist/server.cjs`.
- Render launched `npm run start` and `node dist/server.cjs`.
- Dotenv reported `injected env (0)`; no secret values were logged.
- At `2026-08-08 12:42:45 PM GMT+2`, the application logged `Initializing Data Access Layer...`.
- No later line appeared for a Supabase connection attempt, a successful link, local fallback mode, route readiness, or `EduPro Enterprise ERP Server listening`.
- The deployment was on the Staging service and the `main` commit `3cb8cd1abefffc8b5fa8dc7764f48179ddbc5d64`.

This evidence is consistent with the source call graph: the process entered `DatabaseService.initialize()` and did not reach the post-initialization route/listen stages during the observed window.

## 10. Root Cause Classification

**Classification: C — Startup coupling defect.**

### Proven root cause

`server.ts` awaits a legacy data-layer initialization path before registering routes or starting the listener. That path includes a live Supabase readiness query with no explicit application-level request timeout. The PostgreSQL transaction driver is created first, but cannot make the service available independently.

### Not classified as

- **A — purely operational outage:** the runtime symptom is not explained only by a transient outage because the source has a structural hard startup dependency and an unbounded query wait.
- **B — configuration blocker:** configuration can produce a quick fallback; the observed behavior is the absence of both fallback completion and connection completion.
- **D — unknown:** the exact source-level coupling and the runtime stop point are proven. The precise external network condition causing the query not to settle is not required to establish the architectural blocker.

## 11. Security Impact

- No cross-tenant or authorization behavior was changed or tested in this mission.
- No database, schema, RLS, migration, or production configuration was modified.
- The main security impact is availability: protected routes do not become reachable because the server does not start listening.
- Existing fallback and Supabase paths remain outside this diagnostic change; no new secret logging was introduced.

## 12. Production Impact

- Production was not accessed or modified.
- If the same startup path is deployed with reachable-looking but non-responsive Supabase configuration, the service can fail readiness indefinitely and never expose its health endpoint.
- If Supabase configuration is missing or invalid, the current code may fall back to local JSON storage after validation; that behavior must not be treated as production persistence without a separate approval.
- `INF-001A` live transaction certification and `SOP-001` must remain blocked until startup dependency isolation is repaired and verified in Staging.

## 13. Files Modified

By INF-002:

- `docs/infrastructure/inf-002-startup-data-layer-analysis.md` (this report only).

No application source file, migration, schema file, SQL script, environment file, or deployment setting was modified by this mission.

## 14. Database Changes

None. No SQL was executed. No tables, indexes, constraints, RLS policies, RPCs, functions, triggers, or data were changed.

## 15. Recommended Next Action

Create a separate CTO-approved repair mission limited to Staging startup dependency isolation. The repair should:

1. Preserve the approved PostgreSQL transaction architecture.
2. Bound the Supabase readiness request and guarantee cleanup of the initialization state.
3. Prevent a legacy availability check from blocking route registration indefinitely.
4. Preserve explicit opt-in behavior for migrations and seeds.
5. Add a Staging-only readiness verification proving the server can expose health and diagnostic responses under unavailable or slow Supabase conditions.
6. Remove any temporary diagnostics before completion and leave Production untouched.

No repair was implemented under INF-002.

## 16. OPS-003B Readiness

**BLOCKED.** The temporary diagnostic endpoint cannot be used as a reliable gate while the server startup path can block before route registration.

## 17. INF-001A Readiness

**BLOCKED.** Live transaction certification must wait until Staging startup is independently observable and the data-layer dependency behavior is corrected and verified under the approved test matrix.

## 18. Mission Status

**READY FOR CTO REVIEW**

The diagnostic mission is complete. The next action requires a separate CTO-approved implementation order; no automatic repair or progression to `INF-001A` is authorized by this report.
