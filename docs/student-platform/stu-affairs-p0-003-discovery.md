# STU-AFFAIRS-P0-003 — Student Affairs Discovery Audit

## Mission boundary

- **Mode:** discovery/audit only.
- **Scope:** Student Affairs flows, UI wiring, repositories, API routes, validation, authorization/tenant enforcement, audit/atomicity, performance, and build/test evidence.
- **Explicitly excluded:** source-code fixes, SQL execution, migrations, schema changes, RLS changes, Production access, and reopening `STU-AFFAIRS-P0-002P` / creating `TransferOperation`.
- **Audit date:** 2026-08-11.

## Executive decision

`STU-AFFAIRS-P0-003 = BLOCKED — independent defects discovered; remediation orders required before certification.`

The canonical student registration, canonical read, document routes, trusted tenant context, and fail-closed physical-delete boundary are present. However, Student Affairs still has multiple coexisting legacy paths. Several lifecycle routes bypass the canonical tenant-context boundary, Guardian synchronization can use fallback/local storage, the bulk contract is incompatible between the active repository and server route, the main screen paginates only the first server page locally, and several visible workflows are disabled or notification-only. These defects prevent a complete enterprise certification.

`P0-002P` remains an independent blocked Operations/Security gate. This audit does not reopen it and does not implement its TransferOperation.

## What is demonstrably healthy

| Area | Evidence | Assessment |
|---|---|---|
| Canonical list | `server.ts:716-779` authenticates, authorizes, resolves trusted tenant context, validates request target, and calls `CanonicalStudentReadRepository` through a request-scoped Unit of Work. | PASS for this route |
| Canonical create/update | `server.ts:781-834` uses `studentRegistrationService` / `CanonicalStudentWriteRepository`; audit and identity metadata are generated server-side. | PASS for this route |
| Registration idempotency | `server.ts:839-855` requires `Idempotency-Key` and calls the canonical registration service. | PASS for this route |
| Document isolation | `server.ts:881-960` consistently applies authentication, permission middleware, and `resolveStudentTenantMiddleware`. | PASS for inspected routes |
| Physical delete boundary | `server.ts:984-1010` allows only soft delete/restore and rejects `permanent`. | PASS / fail closed |
| Tenant-aware student-guardian repository | `src/database/repositories/StudentGuardianRepository.ts` requires trusted context and scopes tenant/school/branch in the inspected path. | PASS for this repository path |
| Build/test baseline | `tsc --noEmit` passed; Vite production build passed; six selected Student Affairs/security tests passed (24/24). | PASS with build warnings |

## Findings

### P0-003-01 — Legacy lifecycle API bypasses the canonical tenant boundary

**Severity:** P0 / release blocker  
**Evidence:** `server.ts:1012-1113` routes transfer, promote, re-enroll, graduate, dismiss, and archive through `StudentService` using only `(req as any).user.schoolId`. Unlike the canonical list/write/document paths, these routes do not call `resolveStudentTenantContext` or `resolveStudentTenantMiddleware`. `src/database/services/StudentEnrollmentService.ts:74-137,155-195,207-235` reads and writes through the legacy repository and constructs a movement record in memory.  
**Impact:** A legacy path can have weaker tenant/branch validation and different lifecycle semantics from the canonical path. Transfer is additionally blocked by the separate P0-002P gate, but the same architectural split affects promotion, re-enrollment, graduation, dismissal, archive, and timeline behavior.  
**Disposition:** Independent remediation order required; transfer implementation remains out of scope until P0-002P is authorized.

### P0-003-02 — Guardian synchronization is not guaranteed to use canonical persistence

**Severity:** P0 / data-integrity and tenant-isolation blocker  
**Evidence:** `src/database/services/StudentGuardianService.ts:9-65` generates `guard_${Date.now()}_${random}` identifiers, synthesizes an email, and `syncGuardians` reads/writes `FallbackStorage`. `src/database/repositories/GuardianRepository.ts:11-143` scopes legacy operations by `school_id` only, can fall back to local storage, and its enlist SQL at lines 158-175 does not provide the canonical tenant/branch/audit contract.  
**Impact:** A student update can leave the canonical student record and Guardian relationship out of sync, duplicate guardians, or write to an emergency/local path that is not the authoritative PostgreSQL record. Cross-tenant safety is weaker than the canonical StudentGuardian repository.  
**Disposition:** Must be resolved before Guardian/Student Affairs certification. No fallback write should be treated as a successful production commit without an approved recovery contract.

### P0-003-03 — Two competing Student Affairs schema/migration authorities exist

**Severity:** P0 / deployment and data-integrity blocker  
**Evidence:** `supabase/migrations/202608051500_student_platform_foundation.sql` defines UUID canonical `students`, `guardians`, and `student_guardians` with tenant/school/branch scope. `src/database/migrations/student_affairs_tables.sql` separately defines legacy text-key Guardian/relationship and auxiliary tables, enables RLS, and creates different policies.  
**Impact:** A deployment can use a schema different from the code path being exercised. The duplicate authority also makes RLS, foreign keys, identifiers, and lifecycle semantics non-deterministic.  
**Disposition:** Architecture/deployment decision required before any further Student Affairs migration or live certification. This audit did not change either source.

### P1-003-04 — Main portal is first-page-only with client-side totals and pagination

**Severity:** P1 / customer-facing correctness and scalability  
**Evidence:** `src/components/StudentAffairsPortal.tsx:116-169` always requests `page: 1, limit: 100`. Lines `171-233` compute totals, filtering, sorting, and pagination from the loaded array. The server returns `meta.totalCount` at `server.ts:765-775`, but the portal does not use it.  
**Impact:** Schools with more than 100 students see incomplete KPIs, search/filter results, and page counts. Queries can become slow and stale as the tenant grows.

### P1-003-05 — Bulk contract mismatch and inactive import path

**Severity:** P1 / broken workflow  
**Evidence:** `src/components/student-affairs/repository/StudentRepository.ts:39-49` posts a raw array to `/api/students/bulk`; `server.ts:962-981` expects `{ operation, items }`. The main portal import modal at `StudentAffairsPortal.tsx:1715-1742` explicitly reports import as unavailable.  
**Impact:** Bulk operations cannot reliably execute from the repository contract; import is not a production capability. Any alternate `StudentSearchPanel` path must not be presented as operational until its route contract is covered by integration tests.

### P1-003-06 — Visible actions are disabled, simulated, or misleading

**Severity:** P1 / commercial and operational readiness  
**Evidence:** `StudentAffairsPortal.tsx:1147-1194` marks guardian linking, direct call, and SMS as unavailable/provider-unconnected. Lines `1526-1529` display a generic saved/confirmed message for non-basic tabs without tab-specific persistence. Lines `1622-1631` display a successful official-card notification without generating a card. Lines `1640-1742` keep transfer/import unavailable.  
**Impact:** A school operator can reasonably believe an action completed when it did not, or encounter a polished screen with missing enterprise workflows.

### P1-003-07 — Print/export paths need output-safety and correctness review

**Severity:** P1 / security and data-export risk  
**Evidence:** `StudentAffairsPortal.tsx:464-480` creates CSV without robust escaping for commas, quotes, or newlines. Lines `482-550` interpolate student values into a new HTML document before printing.  
**Impact:** Malformed exports and unsafe rendered output are possible when fields contain delimiters or markup. Export/print must be treated as a data-exfiltration boundary with authorization, escaping, and audit requirements.

### P1-003-08 — Timeline and legacy writes are not proven canonical/audit-event based

**Severity:** P1 / auditability  
**Evidence:** `server.ts:1115-1140` obtains all logs through legacy `AuditRepository.getAll(schoolId)` and filters in application memory. `StudentService.ts:44-143` performs legacy writes, fallback synchronization, and legacy audit calls. `StudentEnrollmentService.ts:112-119` returns an in-memory `movementLog` rather than persisting a dedicated immutable history record.  
**Impact:** Timeline completeness, tenant scope, retention, and append-only guarantees differ by workflow. An operator may not see a complete or authoritative history.

### P2-003-09 — Alternate Student Affairs components are unwired/dead-code candidates

**Severity:** P2 / maintainability  
**Evidence:** `StudentAffairsPortal.tsx` imports `StudentDocumentsPortal` but not `StudentAffairsHeader`, `StudentSearchPanel`, `StudentAddressInformation`, `StudentTransport`, `StudentUniform`, `StudentLibrary`, or `StudentActivities`. Repository search finds these as standalone definitions. Several contain notification-only actions.  
**Impact:** Fixes made in an alternate component may never reach users; duplicated handlers can drift. They must be classified as retained, integrated, or removed under a separate approved cleanup order.

### P2-003-10 — Client token storage is an authentication hardening concern

**Severity:** P2 / security hardening  
**Evidence:** `StudentAffairsPortal.tsx:118` and `src/components/student-affairs/repository/StudentRepository.ts:6-12` read `edupro_token` from `localStorage`.  
**Impact:** Any same-origin script compromise can read the bearer token. This is not proof of an authentication bypass, but it should be reviewed against the approved Wave 1 session policy before production.

### P2-003-11 — Performance budget is not instrumented for all Student Affairs operations

**Severity:** P2 / scale readiness  
**Evidence:** The canonical list has PERF-004 tracing in `server.ts:734-764`, while the legacy lifecycle routes and client-side filtering do not expose equivalent p95/DB-query metrics. Vite build reports chunks of approximately 2.49 MB and 3.41 MB after minification.  
**Impact:** The system cannot yet demonstrate lookup, search, transfer, timeline, or write SLAs at the stated enterprise scale.

## Business workflow coverage

| Workflow | Current state | Certification result |
|---|---|---|
| Create student | Canonical route exists; idempotent registration exists. | Partially certified; integration evidence still required |
| Update student | Canonical route exists with version; legacy update remains in service layer. | Split path — not certified |
| Delete/archive | Canonical soft-delete/restore exists; legacy archive route also exists. | Split path — not certified |
| Guardian assignment | Canonical StudentGuardian repository exists; legacy service/fallback path remains. | Not certified |
| Transfer | UI disabled; legacy endpoint exists; P0-002P remains blocked. | Blocked |
| Academic status | Canonical suspend path exists; other lifecycle routes use legacy service. | Split path — not certified |
| Documents | Canonical metadata routes and tests exist; binary storage/OCR explicitly out of scope. | Metadata path partially certified |
| Import/export/print | Export/print are local; import is unavailable; card print is notification-only. | Not certified |
| Timeline/audit | Legacy log read and in-memory movement record exist. | Not certified |

## User experience assessment

The main portal has a strong RTL visual language, responsive grid/table scaffolding, loading/error/empty states, and a polished first impression. It is nevertheless dense: the root uses `select-none`, table workflows rely on horizontal scrolling, and several actions present a premium surface while remaining unavailable or notification-only. Keyboard focus order, screen-reader semantics, print behavior, and mobile workflows require dedicated accessibility/UX validation before commercial certification.

## Security and tenant assessment

The canonical paths correctly prefer trusted authentication/authorization/tenant context. The independent risk is path inconsistency: legacy lifecycle and Guardian operations accept a school argument and use legacy repositories/fallback storage. No cross-tenant exploit was executed in this discovery mission; the code evidence is sufficient to keep the affected flows uncertified until the same trusted context and canonical transaction/audit boundary are enforced end-to-end.

## Required next action

Issue a separate remediation order for the independent findings in the priority order in `stu-affairs-p0-003-p0-matrix.md`. Keep `P0-002P` and `P0-002Q` unchanged and do not create `TransferOperation` under this mission.

**Mission status:** `READY FOR CTO REVIEW — DISCOVERY COMPLETE / REMEDIATION BLOCKED`
