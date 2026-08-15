# STU-AFFAIRS-P0-003-03 — Discovery Validation

## Validation scope

This was an inspection-only mission. No TypeScript, React, SQL, migration, RLS, Supabase, Render, or production file was changed for this discovery.

## Checks performed

| Check | Result | Evidence |
|---|---|---|
| Enterprise Student/Guardian migration located | PASS | `supabase/migrations/202608051500_student_platform_foundation.sql` |
| Guardian extension migration located | PASS | `supabase/migrations/202608051600_guardian_platform.sql` |
| Approved RLS migration identified | PASS | `supabase/migrations/202608081700_db_sec_003_rls.sql` |
| Canonical registration writer traced | PASS | `StudentRegistrationService` → `resolveGuardian` / `enqueueStudentGuardian` |
| Canonical read join traced | PASS | `CanonicalStudentReadRepository` joins canonical tables with trusted scope |
| `parent_*` dependency classified | PASS | `parent_name`/`parent_phone` are SELECT aliases derived from Guardian columns |
| Legacy schema conflict identified | PASS | `src/database/migrations/student_affairs_tables.sql` uses text IDs and legacy shape |
| Legacy fallback copy path identified | PASS | `src/database/migrations/student_affairs_tables.ts` |
| Live deployed schema verified | NOT RUN | This mission forbids live DB mutation and the current evidence set does not prove catalog state |
| Schema/RLS/migration change required by this discovery | NO | Source model is sufficient for application-only Guardian Update design |

## Static consistency result

The source-controlled enterprise migration order is coherent for this boundary:

`Core → Identity → Governance → Student Platform → Guardian Platform → later security layer`

The canonical application read projection does not require physical `parent_name` or `parent_phone` columns. It derives them from `guardians` and `student_guardians` under trusted scope.

## Stop/RCA assessment

`STU-AFFAIRS-P0-003-03 = DISCOVERY PASS / LIVE ENVIRONMENT VERIFICATION PENDING`

No STOP+RCA is required for a schema redesign. A live Supabase catalog/migration-history check is still required before declaring production schema authority certified.

## Recommended next mission

`STU-AFFAIRS-P0-003-04 — Canonical Guardian Update` may be opened for application-only implementation, with these hard requirements:

- trusted TenantContext only;
- Guardian lookup by tenant/school/branch scope;
- no client-selected ownership values;
- request-scoped UnitOfWork;
- optimistic version check;
- audit and correlation metadata from trusted server context;
- no fallback write;
- no schema/RLS/migration changes;
- cross-scope, missing-context, not-found, stale-version, and concurrent-update tests.
