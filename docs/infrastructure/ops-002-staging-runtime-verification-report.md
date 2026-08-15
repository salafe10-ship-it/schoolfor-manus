# OPS-002 — Staging Runtime Verification Report

**Mission:** OPS-002  
**Scope:** Inspection and verification only  
**Execution date:** 2026-08-08  

## 1. Environment Status

**STAGING NOT AVAILABLE**

Render inspection shows one project environment only:

- Environment: `Production`
- Services in the project: one Node web service, `edupro-school-erp`
- Staging environment/service: not present in the inspected Render project

The separate Supabase project identified as `edupro-school-erp-staging` exists in the browser context, but there is no corresponding isolated Render runtime available for this mission. Therefore the application-to-staging runtime path cannot be verified safely.

## 2. PostgreSQL Availability

- Local workspace connectivity: **UNAVAILABLE** — neither database connection variable is present in the local process environment.
- Staging connectivity: **NOT VERIFIED** — no isolated staging runtime is available and no direct connection was attempted.
- Production connectivity: **NOT ATTEMPTED** — production was explicitly excluded from this mission.

No SQL was executed and no database connection was opened.

## 3. DATABASE_URL Status

- Local process environment: **MISSING**
- Render Production configuration: **PRESENT** (value remained masked and was not inspected)
- Render Staging configuration: **MISSING / NOT AVAILABLE** because no staging runtime exists in the inspected project

## 4. DIRECT_URL Status

- Local process environment: **MISSING**
- Render Production configuration: **PRESENT** (value remained masked and was not inspected)
- Render Staging configuration: **MISSING / NOT AVAILABLE** because no staging runtime exists in the inspected project

## 5. Server Runtime Status

The repository contains server-side runtime wiring for the transaction layer:

- `server.ts` loads environment configuration on the server.
- `server/infrastructure/PostgresTransactionDriver.ts` reads the database URL server-side.
- The driver supports a PostgreSQL pool and request-scoped transaction handling.
- Render shows one Production Node service and no Staging service/environment.

**Result:** Runtime implementation is present, but the required isolated Staging runtime is **NOT READY**. The inspected Render deployment history also contains a failed build for an older commit; this was not changed during OPS-002.

## 6. SSL Status

- Driver implementation: **CONFIGURED** — PostgreSQL SSL options are handled by the server-side driver.
- Staging runtime activation: **NOT VERIFIED** — no staging connection was attempted.
- Production runtime: not used for this verification.

## 7. Pool Configuration Status

- Pool implementation: **AVAILABLE** in `PostgresTransactionDriver.ts`.
- Pool activation in Staging: **NOT VERIFIED** because Staging is absent and local database variables are missing.
- Pool activation in Production: not used for this verification.

## 8. Secret Isolation Verification

- Server-side database secret injection in the transaction design: **PASS**.
- Render Production database variables were visible only as masked secret entries: **PASS** for non-disclosure during inspection.
- Actual secret values were not copied, displayed, logged, or placed in this report.
- No database secret was read from the browser or sent to the client by this verification.
- Example environment files document variable names only; they contain no production values.

**Result:** **PASS for the inspected server-side design; NOT VERIFIED for Staging runtime configuration.**

## 9. Client Exposure Verification

**Result: FAIL — source-level security hygiene finding.**

No actual service-role secret value was found in the inspected source or local process environment, and no client `VITE_*` database-secret pattern was found. However, `src/developer/DeveloperPlatformCenter.tsx` contains a client-side input labeled `SUPABASE_SERVICE_ROLE_KEY (Secret Access)` and a client state value named `supabaseKey`. This creates an unsafe client-facing secret-handling path even though the current value is a placeholder rather than a detected secret.

This must be removed or redesigned in a separately approved security mission. It was not modified under OPS-002.

## 10. Production Isolation Verification

**Result: BLOCKED for Staging verification.**

- No production database or schema was accessed.
- No SQL, migration, table, or database mutation was executed.
- The Render project exposes only the Production environment and one service.
- There is no isolated Staging service from which to verify `DATABASE_URL`, `DIRECT_URL`, pooling, SSL, or live transaction behavior.
- Production configuration must not be reused as Staging.

## 11. Files Modified

- `docs/infrastructure/ops-002-staging-runtime-verification-report.md` — this inspection report only.

No application source, migration, environment value, Render setting, or database object was modified.

## 12. Database Changes

**NONE**

- SQL executed: none
- Tables created or changed: none
- Migrations created or changed: none
- Production data copied: none

## 13. Security Findings

1. **P0 / Release blocker:** Isolated Staging PostgreSQL runtime is unavailable; live transaction verification cannot safely start.
2. **P1:** Render currently shows only Production. A dedicated Staging service/environment is required before INF-001A.
3. **P1:** Client source contains a service-role-key input path in `DeveloperPlatformCenter.tsx`; no actual secret value was detected, but the pattern is unsafe.
4. **P2:** Local runtime variables are absent, so local connectivity and pool activation cannot be verified.
5. **P2:** The inspected Render history includes a failed build for an older commit; deployment health must be revalidated after the runtime is isolated and configured.

## 14. INF-001A Readiness

**NOT READY**

Required before INF-001A:

- Provision an isolated Staging PostgreSQL project/database.
- Provide `DATABASE_URL` to the Staging server runtime through Render server-side environment configuration only.
- Provide `DIRECT_URL` if the approved architecture requires a direct administrative connection.
- Create or link an isolated Staging Render service/environment; do not reuse Production.
- Verify the service starts successfully and that logs do not expose secrets.
- Re-run OPS-002 against the isolated Staging runtime.

## 15. Mission Status

**STAGING NOT AVAILABLE**

OPS-002 is ready for CTO review. INF-001A must remain blocked until an isolated Staging runtime is provisioned and passes this verification.
