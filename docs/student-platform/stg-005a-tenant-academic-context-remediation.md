# STG-005A — Tenant Academic Context Remediation

## Mission

- Mission ID: `STG-005A`
- Environment: Staging only
- Scope: TenantEngine and canonical academic-context provider
- Production: untouched
- Schema/migrations/RLS: unchanged

## Dependency map

`Authenticated request`
→ `Supabase Auth verification`
→ `trusted app_metadata`
→ `TenantEngine`
→ `TenantDataProvider`
→ `academic_years` resolution scoped by tenant/school/branch
→ `terms` validation in Student Registration
→ `StudentRegistrationService`

## Trace findings

- `TenantEngine` owns trusted tenant, branch, and academic-year context resolution.
- The previous default provider referenced `academic_calendars` and local calendar identifiers.
- The approved Staging schema provides `academic_years`, `terms`, and `academic_calendar`.
- Student Registration already validates the trusted academic-year UUID against `academic_years` and the request term against `terms`.
- Local fallback data remains available only when no Supabase database configuration exists; a configured Staging/Production path now fails closed instead of using mock IDs.

## Minimum correction implemented

- The default provider now reads `academic_years`.
- Academic-year reads are restricted by trusted tenant, school, and branch scope. School-level years (`branch_id IS NULL`) remain eligible for a trusted branch.
- Only non-deleted `planned` or `active` academic years are eligible.
- The resolver verifies returned tenant, school, and branch metadata where supplied.
- Database-configured paths return no mock records on provider failure or empty results; tenant validation fails closed.
- Existing trusted authentication, authorization order, request-target spoofing checks, and Student Registration business rules were preserved.

## Files modified

- `src/tenant/TenantEngine.ts`
- `src/__tests__/tenantIsolation.test.ts`

## Focused regression coverage

- Valid trusted academic year resolves with canonical scope.
- Unknown academic year fails closed.
- Foreign tenant/branch academic-year metadata is rejected.
- Missing academic-year context fails closed.
- Existing tenant, branch, repository, cache, API spoofing, and protected-endpoint tests remain covered.

## Local validation completed before Staging deploy

- TypeScript: PASS.
- Focused TenantEngine + Student Registration tests: PASS — 2 files, 19 tests.
- Full Vitest suite: PASS — 15 files, 107 tests.
- Vite production build: PASS; existing chunk-size and dynamic-import warnings remain.
- Server bundle: PASS; existing `import.meta`/CJS warnings remain.
- `git diff --check`: PASS.

## Staging validation status

- Deployment: PASS — Render Staging live on commit `6b45786`.
- `/api/health`: PASS at application-health level; this does not certify transaction correctness.
- Trusted login and session restoration: PASS.
- Canonical academic-year resolution: PASS.
- Basic registration persistence: PASS.
- Idempotent replay and conflict: PASS.
- Duplicate detection and authorized override: PASS.
- Guardian cross-tenant/cross-branch denial: PASS.
- Controlled rollback evidence: PARTIALLY VERIFIED; duplicate-guardian failure left all observed counts unchanged. Per-stage failure injection was not available without modifying prohibited transaction/business code.
- Controlled concurrency: PASS — four independent registrations committed with four distinct student IDs and links.
- Audit and outbox persistence: PASS.
- Cleanup: PASS — all synthetic Auth and public fixture records verified absent.
- RLS: PENDING; observed disabled and intentionally not modified.

## Final decision

**E2E FUNCTIONALLY CERTIFIED — DATABASE-LEVEL TENANT/RLS CERTIFICATION PENDING**

Production remains untouched. The next independent gate is DB-SEC-001; this mission does not authorize RLS changes or a Production readiness declaration.
