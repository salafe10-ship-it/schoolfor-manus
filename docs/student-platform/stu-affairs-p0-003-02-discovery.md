# STU-AFFAIRS-P0-003-02 — Guardian Scope & Persistence Discovery

## Mission boundary

- **Mode:** Discovery/audit only.
- **Audit date:** 2026-08-12.
- **Scope:** Guardian creation, resolution, relationship persistence, update synchronization, API callers, UI wiring, fallback behavior, tenant scope, audit/outbox behavior, and duplicate-identity behavior.
- **Explicitly excluded:** source fixes, SQL execution, database mutation, migrations, schema changes, RLS, Production, TransferOperation, P0-002P/P0-002Q, and changes to the general UnitOfWork, TenantEngine, or AuthorizationEngine.

## Executive decision

`STU-AFFAIRS-P0-003-02 = BLOCKED — Guardian persistence is split between a safe canonical registration path and uncertified legacy/fallback paths.`

The canonical Student Registration workflow resolves or creates a Guardian inside the trusted tenant context and the same request-scoped Unit of Work as the Student and relationship rows. That path is suitable for further certification.

The legacy Guardian path is not production-certifiable: it generates synthetic identifiers and contact data, reads local fallback storage directly, writes Guardian SQL without tenant/branch/audit predicates, and is reachable through the bulk student-insert path. The active Student Affairs edit screen also sends Guardian fields to `/api/students`, while the canonical update mapper ignores those fields; the UI can therefore report a successful student update without persisting the Guardian change. No dedicated Guardian API route was found.

No repair is applied in this discovery mission. A separate CTO remediation order is required.

## Evidence: canonical path

| Area | Evidence | Assessment |
|---|---|---|
| Canonical Guardian identity | `src/modules/student-registration/infrastructure/StudentRegistrationRepositories.ts:216-282` resolves an existing Guardian only within `tenant_id`, `school_id`, `branch_id`/global-branch scope and `deleted_at IS NULL`; otherwise it creates a UUID Guardian and a `GDN-...` number. | **PASS for this path** |
| Canonical relationship | `StudentRegistrationRepositories.ts:324-359` writes `student_guardians` with tenant, school, branch, student, Guardian, relationship, consent, audit, request, and correlation values. | **PASS for this path** |
| Trusted scope | `StudentRegistrationService.ts:240-370` receives `TenantContext`, validates it, resolves internal actor identity, and passes only trusted context values to Guardian resolution and relationship writes. | **PASS for this path** |
| Atomicity | `StudentRegistrationService.ts:272-370` runs audit, Guardian, Student, relationship, enrollment, and status writes inside one `UnitOfWork.runInTransaction(...)`. | **PASS for this path** |
| Duplicate handling | Existing Guardian matching is scoped by tenant/school/branch and compares normalized email or exact phone; an explicit Guardian id is also scope-checked. | **Partially proven; concurrency/unique-constraint integration evidence remains required** |
| Audit/outbox | The canonical workflow queues `audit_events` before business rows and includes `outbox_events` in the transaction contract. Guardian and relationship rows carry audit/request/correlation references. | **PASS for this path** |
| API entry | `server.ts:781-834` and `server.ts:839-855` call canonical registration/update flows after authentication, permission, and trusted tenant resolution. | **PASS for these entry points** |

## Evidence: legacy and fallback paths

### P0-003-02-A — Synthetic Guardian creation and unscoped enlist SQL

**Severity:** P0 / release blocker.

**Evidence:**

- `src/database/services/StudentGuardianService.ts:9-42` creates `guard_${Date.now()}_${random}` and `sg_${Date.now()}_${random}` identifiers.
- The same code synthesizes `${guardianId}@alnoor.edu.sa`, a fixed occupation, a fixed Riyadh address, and `appAccess: true`/`appAccountStatus: 'active'` from a simple parent name/phone payload.
- `src/database/repositories/GuardianRepository.ts:158-175` enlists SQL containing `id, school_id, name, national_id, phone, email, relation, qualification`, but no `tenant_id`, `branch_id`, audit id, request id, correlation id, or trusted-scope predicate on updates.
- `GuardianRepository.enlistUpdateGuardian` updates by `id` only (`GuardianRepository.ts:168-175`).
- `StudentGuardianRepository.enlistCreateStudentGuardian` attempts trusted scope, but `StudentGuardianService.ts:30-39` passes a `join` object without `schoolId`; the repository therefore calls `trustedScope('')`, which is expected to fail closed rather than create a valid scoped relationship.

**Impact:** The path can fabricate identity/contact data, fail to create the relationship after enlisting the Guardian, or reach a SQL update without the canonical tenant/branch predicate. It is not equivalent to the canonical Guardian aggregate.

**Disposition:** Remediation required. Do not delete or rewrite the path until its active callers and rollback behavior are addressed under a dedicated order.

### P0-003-02-B — Reachable legacy Guardian path through bulk insertion

**Severity:** P0 / release blocker.

**Evidence:**

- `server.ts:962-981` exposes `POST /api/students/bulk`, authenticates and checks `STUDENT_WRITE`, then calls `StudentService.executeBulkOperation(...)` without `resolveStudentTenantMiddleware`.
- `src/database/services/StudentService.ts:281-305` routes bulk `insert` items to `StudentService.createStudent`.
- `StudentService.createStudent` delegates to `StudentAdmissionService.createStudent` (`StudentService.ts:32-38`), which calls `StudentGuardianService.enlistCreateGuardianRelation` (`src/database/services/StudentAdmissionService.ts:88-89`).

**Impact:** The canonical `/api/students` registration route is not the only creation route. Bulk insertion can therefore invoke the synthetic/legacy Guardian path and bypass the canonical Guardian contract. The route uses `req.user.schoolId` and does not establish the same explicit trusted `TenantContext` boundary used by canonical Student registration.

**Disposition:** P0 remediation required. Transfer routes remain untouched; this finding does not authorize P0-002P/P0-002Q work.

### P0-003-02-C — Guardian update synchronization reads local fallback directly

**Severity:** P0 / authoritative-persistence and tenant-isolation blocker.

**Evidence:**

- `src/database/services/StudentService.ts:44-143` calls `StudentGuardianService.syncGuardians(...)` during legacy Student update.
- `StudentGuardianService.ts:47-67` reads `FallbackStorage.getStudentGuardians()` and `FallbackStorage.getGuardians()` directly, filtering only by `studentId` and Guardian id; it does not receive or validate `tenant_id`, `school_id`, or `branch_id` from trusted context.
- It then calls `GuardianRepository.enlistUpdateGuardian`, whose SQL update is `WHERE id = $3` only.
- The method is synchronous/`void`, so the service has no explicit asynchronous result or failure contract for the Guardian synchronization.

**Impact:** A Student update can leave the canonical Guardian record unchanged, can update a record outside the intended tenant/school/branch if ids collide or data is stale, and can report Student success while Guardian persistence is not proven.

**Disposition:** P0 remediation required. A trusted canonical Guardian update contract and explicit failure/transaction behavior are needed.

### P0-003-02-D — Emergency fallback queue is not tenant-complete

**Severity:** P0 / recovery-isolation blocker for any Guardian repository path that uses it.

**Evidence:**

- `src/database/repositories/StudentGuardianRepository.ts:123-237` uses `FallbackStorage.performWrite` for create/update/delete after trusted scope is resolved.
- `src/database/repositories/FallbackStorage.ts:37-49` defines `QueueItem` with `schoolId` but no `tenantId` or `branchId`.
- `FallbackStorage.ts:486-586` reconciles queued records by `id` only and performs delete/upsert without tenant/school/branch predicates. The queued payload is merged into remote state rather than revalidated against a complete trusted scope.
- `FallbackStorage.ts:614-655` queues writes after an outage and returns the local value as the operation result.

**Impact:** The fallback can provide read-your-own-writes behavior, but it is not sufficient evidence of an authoritative, tenant-isolated Guardian commit. Queue replay and conflict resolution require a Guardian-specific trusted recovery contract before production certification.

**Disposition:** Do not remove FallbackStorage in this mission. Prove whether it is an approved operational capability; otherwise route Guardian writes fail-closed until a separate recovery design is approved.

## Evidence: legacy migration and synthetic data

- `src/database/migrations/student_affairs_tables.ts:9-164` migrates `FallbackStorage` Guardian and relationship records directly into Supabase when `DatabaseMigration.migrateAll()` runs.
- `src/database/services/DatabaseService.ts:31-49` only invokes migration when `AUTO_MIGRATE=true`, but that remains a production configuration risk requiring an explicit deployment decision.
- `src/database/repositories/FallbackStorage.ts:267-274` contains synthetic `guard_1`, `guard_2`, `sg_1`, and `sg_2` records with legacy camelCase fields and no tenant/branch metadata.
- The canonical SQL migration defines UUID Guardian and relationship keys with tenant/school/branch scoped foreign keys (`supabase/migrations/202608051500_student_platform_foundation.sql:77-225`). The legacy migration utility is not shape-compatible with that canonical model without an explicit mapping.

## Evidence: UI and API wiring

| Surface | Evidence | Assessment |
|---|---|---|
| Dedicated Guardian API | Search of `server.ts` found no `/api/guardians` or `/api/student-guardians` route. | **Missing** |
| Active registration form | `StudentAffairsPortal.tsx:320-350` requires parent name/phone and sends them to `/api/students`; server canonicalizes them into Guardian input only on create. | **Canonical create input, limited field coverage** |
| Active Student edit | `StudentAffairsPortal.tsx:290-350` sends parent fields on edit, but `server.ts:428-442` `toCanonicalStudentPatch` maps only Student fields and ignores `parentName`, `parentPhone`, relation, occupation, and national ID. | **P0/P1 functional persistence defect; needs dedicated classification in remediation** |
| Guardian tab | `StudentAffairsPortal.tsx:1138-1204` displays parent fields from the loaded Student projection; link, call, and SMS actions are explicitly disabled/provider-unconnected. | **UI display only; not a Guardian management workflow** |
| Alternate Guardian component | `src/components/student-affairs/StudentGuardianInformation.tsx` and `hooks/useGuardianInformation.ts` have local form state only and are not imported by the active portal. | **Dead/unwired candidate; no persistence proof** |
| Parent section | `src/App.tsx:2190-2215` renders Student parent fields and shows a notification-only messaging action. | **Notification-only; no Guardian API evidence** |

## Canonical data model evidence

`supabase/migrations/202608051500_student_platform_foundation.sql` is the canonical model inspected for this phase:

- `guardians` uses UUID id, mandatory `tenant_id`, optional school/branch, Guardian number, legal names, audit metadata, and tenant-scoped foreign keys.
- `student_guardians` uses UUID id, mandatory tenant/school, optional branch, scoped Student and Guardian foreign keys, relationship/consent/custody fields, soft delete, version, and audit metadata.
- Unique indexes protect active Guardian relationships and one active primary relationship per Student.

This is a source-level review only. No migration was executed and no live database/RLS state was changed or certified.

## Discovery conclusion

1. Canonical registration is the preferred source of truth for new Student + Guardian creation.
2. Legacy `StudentGuardianService`/`GuardianRepository` must not be treated as an approved production Guardian implementation.
3. Bulk insertion and legacy Student update keep the unsafe path reachable.
4. FallbackStorage is an operational recovery mechanism in the codebase, not automatically a valid canonical source; its Guardian queue lacks complete tenant scope.
5. Guardian update/edit behavior is not complete: the active UI submits fields that the canonical Student update mapper ignores.
6. No dedicated Guardian API route exists, so Guardian search/profile/link/update workflows are not independently certifiable.
7. The next implementation order must be narrow and must explicitly decide the canonical Guardian write/update path and fallback policy.

## Required CTO decision

Issue a separate remediation order for `STU-AFFAIRS-P0-003-02`. That order must first select the canonical Guardian write/update path and define whether Guardian fallback is permitted, fail-closed, or requires a scoped recovery adapter. Do not modify schema, RLS, SQL migrations, Production, or general security infrastructure under this mission.

**Mission status:** `READY FOR CTO REVIEW — DISCOVERY COMPLETE / REMEDIATION REQUIRED`
