# OPS-003 — Isolated PostgreSQL Staging Environment Provisioning Report

**Mission:** OPS-003  
**Mode:** Operational provisioning  
**Execution date:** 2026-08-08  

## 1. Staging Architecture

The non-production topology has been partially provisioned:

```text
Development
    |
Staging Render Environment
    |
Staging Web Service
    |
Dedicated Supabase Staging Project
```

Production was not used for deployment verification, database access, migration execution, or test data.

## 2. Render Staging Service

**PASS — provisioned**

- Render environment: `Staging`
- Service: `edupro-school-erp-staging`
- Service ID: `srv-d9rdjiqjnfac73ffo3l0`
- Runtime: Node
- Plan: Free
- Branch: `main`
- Primary URL: `https://edupro-school-erp-staging.onrender.com`
- Build command: `npm install && npm run build`
- Start command: `npm run start`
- Deployment commit: `3cb8cd1abefffc8b5fa8dc7764f48179ddbc5d64`
- Build: **PASS**
- Service startup: **PASS**
- Render service status: **Live**

The service is isolated from the existing Production service at the Render environment/service level. No existing Production service was moved, restarted, or reconfigured.

## 3. PostgreSQL Staging

**PASS — dedicated project available**

The separate Supabase project `edupro-school-erp-staging` is healthy and is distinct from the Production project.

Observed non-secret status:

- Project status: Healthy
- Compute: nano
- Region: West EU (Ireland)
- Database connections shown: 5/60
- Migrations: none
- Backups: none
- Project data: no business data was created or copied

No SQL was executed. No migration was run. No schema or data was changed.

## 4. Environment Variables Status

- `DATABASE_URL`: **MISSING** in Render Staging
- `DIRECT_URL`: **MISSING** in Render Staging
- Production values: not copied, not read, and not reused
- Local process values: not present

Render’s Staging service log confirmed that neither database connection variable is configured and that the service entered local JSON fallback mode.

This is the exact remaining provisioning blocker.

## 5. SSL Status

- Transaction driver SSL handling: **PASS in approved code**
- Staging PostgreSQL SSL activation: **NOT VERIFIED** because no connection URL is configured
- Production SSL: not inspected or used

## 6. Pool Status

- Bounded pool implementation: **PASS in approved code**
- Pool activation against Staging PostgreSQL: **NOT VERIFIED** because the service has no database URL
- Timeout/idle/statement controls: present in the approved driver configuration, but not live-tested in this mission

## 7. Server-side Secret Isolation

**PASS for handling policy; configuration incomplete**

- The service has a server-side environment-variable configuration surface.
- No database secret was placed in source control, React code, browser bundles, logs, or this report.
- Production credentials were not copied.
- No secret value was requested, displayed, or pasted into chat.
- Staging values must be entered directly by the owner into Render’s Staging Environment Variables page.

## 8. Client Exposure Verification

**FAIL — separate security finding remains open**

`src/developer/DeveloperPlatformCenter.tsx` contains a client-side input labeled `SUPABASE_SERVICE_ROLE_KEY (Secret Access)` and a client state value named `supabaseKey`. No actual service-role secret value was detected, but this is an unsafe secret-handling pattern and belongs to the separate `SEC-001` mission. It was not modified under OPS-003.

No `DATABASE_URL` or `DIRECT_URL` value was exposed to the client.

## 9. Production Isolation Verification

**PASS**

- Existing Production Render service was not modified.
- Production database was not connected to.
- Production migrations were not run.
- Production data and credentials were not copied.
- The new Render service belongs to the Staging environment.
- The Supabase Staging project is separate from the Production project.

## 10. Connectivity Verification

**BLOCKED — not attempted**

The service is live, but its log reports:

- `DATABASE_URL/DIRECT_URL is not configured`
- PostgreSQL transactional writes are unavailable
- The application is using local JSON fallback storage

Because connection credentials are missing, no PostgreSQL connection test was attempted. This is required by the security stop conditions.

## 11. Files Modified

- `docs/infrastructure/ops-003-staging-provisioning-report.md` — this report only

No application source, transaction infrastructure, migrations, or UI files were modified.

## 12. Database Changes

**NONE**

- SQL executed: none
- Migrations executed: none
- Tables created: none
- Data created: none
- Production schema/data: untouched

## 13. Security Findings

1. **P0:** `DATABASE_URL` and `DIRECT_URL` are missing from Render Staging; live PostgreSQL validation cannot begin.
2. **P1:** Staging service is currently running with JSON fallback, which is unsuitable for INF-001A.
3. **P1:** Client UI contains a service-role-key input pattern; tracked separately as `SEC-001`.
4. **P2:** SSL and pool behavior are implemented but remain unverified against a live Staging PostgreSQL connection.

## 14. INF-001A Readiness

**NOT READY**

Required next action by the project owner:

1. Open Render service `edupro-school-erp-staging` → `Environment`.
2. Add `DATABASE_URL` using the connection string for the separate Supabase Staging project only.
3. Add `DIRECT_URL` only if required by the approved transaction driver.
4. Keep both values server-side and never paste them into chat, source files, or browser code.
5. Redeploy the Staging service.
6. Re-run OPS-003 verification and perform only the minimal safe connectivity check.

Do not run INF-001A until this report is revalidated with both variables present and connectivity proven against Staging.

## 15. Mission Status

**STAGING PROVISIONING BLOCKED**

The isolated Render Staging environment, Staging service, and separate Supabase Staging project are provisioned. The mission cannot be certified until the owner adds the two server-side connection variables without exposing their values.
