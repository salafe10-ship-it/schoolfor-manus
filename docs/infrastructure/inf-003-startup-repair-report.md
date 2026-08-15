# INF-003 — Enterprise Startup Dependency Isolation & Readiness Repair

**Parent:** INF-002  
**Priority:** Critical  
**Environment changed:** Staging only  
**Production changed:** No  
**Repair commit:** `60b971ba0e0698642d6addc6c2a770e21f6e4600`

## Root Cause

INF-002 proved that `server.ts` awaited `DatabaseService.initialize()` before registering routes or calling `app.listen()`. The awaited path performed a Supabase readiness query through `DatabaseConnectionManager.connectWithRetry()`, but the underlying fetch operation had no application-level finite timeout.

If that request remained pending, the retry loop could not advance and the server could not reach route registration, health availability, or listener startup. The approved PostgreSQL transaction driver was created first, but service availability was operationally coupled to the legacy Supabase readiness path.

## Repair Design

The repair is limited to the startup/data-layer boundary in `src/database/client.ts`:

1. Add a finite default Supabase readiness timeout of 3,000 ms.
2. Permit an explicit positive override through `SUPABASE_REQUEST_TIMEOUT_MS`.
3. Provide Supabase with a scoped `fetch` implementation that uses `AbortController`.
4. Abort the actual underlying request when the timeout expires.
5. Propagate a caller-provided abort signal into the scoped controller.
6. Clear the timeout and remove the abort listener in `finally`, whether the request succeeds, fails, or is cancelled.
7. Preserve the existing retry count, exponential backoff, fallback behavior, migration opt-in, and transaction architecture.

This is an abort-based timeout, not an unsafe `Promise.race`; the underlying fetch is cancelled and its resources are released when the request settles.

## Files Modified

### `src/database/client.ts`

Modified because it owns the Supabase connection manager and is the narrowest safe boundary for bounding the readiness request. No transaction semantics, repository behavior, or business module was changed.

### `src/__tests__/supabaseStartupIsolation.test.ts`

Added because the timeout and cancellation behavior must be automatically verified without requiring a live database or real credentials.

### `docs/infrastructure/inf-003-startup-repair-report.md`

Added as the required mission report.

The INF-003 commit contains only the two implementation/test files above. No user working-tree files were staged by this mission.

## Timeout Design

The default is **3,000 ms per Supabase readiness request**. This is long enough for the lightweight `schools` probe under normal Staging conditions while providing a deterministic upper bound for a request that does not respond.

`DatabaseService` currently requests three connection attempts with 600 ms and 1,200 ms backoff delays. Therefore, the worst-case bounded wait when all three probes time out is:

`3,000 + 600 + 3,000 + 1,200 + 3,000 = 10,800 ms`

After the final bounded failure, the existing manager returns `null`, clears its initialization state, and `DatabaseService` proceeds through its existing local fallback branch. A configured `SUPABASE_REQUEST_TIMEOUT_MS` may be used by Staging operations when a different justified budget is required.

## Initialization Cleanup Design

The existing `connectWithRetry()` cleanup paths remain authoritative:

- validation failure clears `isInitializing`;
- successful connection clears `isInitializing`;
- each aborted or rejected request is handled by the existing retry catch path;
- exhausted retries set `DISCONNECTED`, clear `isInitializing`, and return `null`.

The new fetch wrapper ensures an unresolved readiness request becomes an AbortError and reaches those deterministic cleanup paths. The wrapper also clears its timer and caller-signal listener in `finally`.

## Fallback Behavior

Existing fallback behavior was preserved. When Supabase configuration is absent, invalid, unavailable, or times out across the bounded retry window, the data layer returns to its existing local JSON fallback path. This repair does not claim PostgreSQL or production persistence when those services are not verified, and it does not convert local JSON storage into a production database.

Migrations and seeds remain explicit opt-in operations controlled by the existing `AUTO_MIGRATE=true` and `AUTO_SEED=true` settings.

## Transaction Driver Independence

The repair does not modify `PostgresTransactionDriver`, `UnitOfWork`, `ARCH-004`, pool configuration, transaction isolation, commit behavior, rollback behavior, or statement timeout behavior.

Staging runtime logs confirmed that the server-side PostgreSQL transaction driver was configured before data-layer initialization, then the server completed startup after the bounded legacy path proceeded to fallback. This proves the transaction driver remained independently constructed and that the repair did not require a transaction architecture change.

## Test Results

### TypeScript

**PASS** — `tsc --noEmit` completed without errors.

### Targeted INF-003 tests

**PASS — 5/5 tests** in `src/__tests__/supabaseStartupIsolation.test.ts`:

- finite default and valid override;
- successful request completion and timer cleanup;
- slow request abort;
- caller cancellation propagation;
- deterministic readiness failure propagation.

### Full automated suite

**PASS — 16 test files, 104 tests.**

### Production build

**PASS** — Vite SPA build and server bundle completed successfully.

Existing non-blocking build warnings remain for large chunks and `import.meta` in CommonJS output. They are outside INF-003 scope and were not introduced by this repair.

## Staging Runtime Results

The Staging service `edupro-school-erp-staging` was switched temporarily to `codex/ops-003b-diagnostic` and deployed commit `60b971b`.

Render evidence:

- Build successful.
- `npm run start` launched.
- `node dist/server.cjs` launched.
- PostgreSQL transaction driver configured.
- `Initializing Data Access Layer...` logged.
- Existing local fallback completed.
- `EduPro Enterprise ERP Server listening on port 10000` logged.
- Render marked the deployment **Live**.

The previous failure stopped after `Initializing Data Access Layer...`. The repaired deployment reached both fallback completion and listener startup.

An external Staging-only health request returned:

- HTTP status: **200**
- health status field: **healthy**

No secret values were requested, printed, or placed in the report.

## Production Isolation Evidence

- No Production service was opened or modified.
- No Production environment variable was changed.
- No Production deployment was triggered.
- No SQL was executed.
- No database, schema, migration, RLS, RPC, trigger, view, or business data was changed.
- The only Render service changed was `edupro-school-erp-staging`.

## Security Review

- The timeout wrapper does not log URLs, keys, passwords, tokens, or connection strings.
- Abort failures are handled by the existing safe status/error path.
- No authentication, authorization, tenant isolation, RLS, or business workflow code was modified.
- The PostgreSQL connection string is still read only by the existing server-side transaction driver and was not exposed.

## Regression Review

- The approved PostgreSQL transaction architecture is unchanged.
- Retry and backoff parameters are unchanged.
- Migration and seed opt-in behavior is unchanged.
- Fallback behavior is unchanged except that a non-responsive Supabase request now terminates deterministically.
- Full automated regression suite passed.
- Staging reached a live listener and returned a healthy response.

## Rollback Plan

If CTO review identifies a startup regression, revert only INF-003 commit `60b971b` on the Staging repair branch and redeploy Staging. Do not alter EWP packages, `ARCH-004`, Production, migrations, or the database. The source change is isolated to the timeout wrapper and its tests.

## OPS-003B Readiness

**READY FOR RECHECK.** The startup barrier is removed from the observed failure mode, and Staging is live and observable. The temporary OPS-003B diagnostic gate itself was not re-enabled with secrets under INF-003; its approved diagnostic run should be repeated after CTO review.

## INF-001A Readiness

**BLOCKED pending CTO review and OPS-003B recheck.** This mission did not execute live ACID transaction certification.

## Mission Status

**READY FOR CTO REVIEW**

INF-003 is complete within scope. No automatic progression to `INF-001A` or `SOP-001` was performed.
