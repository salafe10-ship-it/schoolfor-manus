# STU-AFFAIRS-AUDIT-001

## Comprehensive Student Affairs Audit Report

**Mission:** Student Affairs — Comprehensive Functional, Technical, Integration, UX/UI, Performance & Release Audit  
**Mode:** Audit only — no implementation  
**Date:** 2026-08-11  
**Repository:** `codex/sop-001-staging`  
**Scope:** Student Affairs screens, workflows, repositories, services, API routes, integrations, security boundaries, UX/UI, performance and release readiness.

## 1. Executive Summary

Student Affairs presents a polished first impression: RTL layout, coherent dark/navy and cream/gold identity, clear section tabs, KPI cards, search controls and a focused registration modal. A school manager is likely to perceive the interface as intentional and enterprise-oriented within the first five seconds.

The implementation is not yet commercially releasable. The principal risk is not visual quality; it is the coexistence of a canonical server-backed path with local seed data, browser storage, simulated actions and legacy competing paths. This creates a gap between what the interface reports and what can be proven to have been persisted, authorized and isolated.

**Overall enterprise score: 56/100**  
**Commercial readiness: 48/100**  
**Production decision: BLOCKED**

The score is an audit assessment, not a claim of live database or RLS certification.

## 2. Evidence and Classification Method

Every observation is classified as one of:

- **Implemented:** behavior exists in the inspected code.
- **Code-level verified:** the code contains a relevant control, but live infrastructure proof is absent.
- **Locally tested:** covered by the local automated checks listed below.
- **Integrated:** connected to the application path, without implying remote database proof.
- **Demo/Fallback:** synthetic, browser-local, simulated or fallback behavior.
- **Dead/Unused:** an older path not used by the inspected active route.
- **Evidence blocked:** cannot be certified without Operations evidence.
- **Production blocker:** prevents a reliable production release.

`PLATFORM-EVIDENCE-002` remains **CLOSED / BLOCKED + RCA**. This mission does not reopen, bypass, replace or reinterpret Operations evidence requirements. No live database, RLS or production certification is claimed.

## 3. Scorecard

| Area | Score | Assessment |
|---|---:|---|
| Architecture | 58 | Canonical services exist, but legacy and local paths coexist. |
| Database/data integrity | 42 | The application has repository and transaction abstractions; remote equivalence is unproven. |
| Functional completeness | 55 | Core flows are visible, while import, some reports and settings are simulated or incomplete. |
| Security | 52 | Trusted server paths exist, but client-local sources and browser-driven actions remain in scope. |
| Integration | 35 | Student–finance/accounting and document flows are not proven as live end-to-end integrations. |
| Performance | 60 | Local filtering and pagination are responsive for the small fixture; scale behavior is not certified. |
| UI quality | 86 | Strong visual identity and hierarchy; some controls are inconsistent in behavior. |
| UX quality | 74 | Good navigation and RTL presentation; false-success feedback damages confidence. |
| Release readiness | 40 | Vite production build is blocked by the existing `TenantContext.ts` browser incompatibility. |

## 4. P0 Risk Register — Release Blockers

### SA-AUD-P0-001 — Simulated Excel import reports success without importing

- **Severity:** P0
- **Evidence:** `src/components/StudentAffairsPortal.tsx`, `handleSimulateImportExcel` uses a timeout and displays a success message for 45 records; it does not receive a file, validate rows, call an API or persist records.
- **Classification:** Demo/Fallback; production blocker.
- **Business impact:** A registrar can believe that students were imported when no records exist. This can cause enrollment, attendance and billing omissions.
- **Customer impact:** Immediate loss of trust and potential data loss.
- **Technical impact:** UI state and audit messaging can diverge from the system of record.
- **Repair complexity:** High; requires an approved import contract, validation, idempotency, authorization, audit and transactional persistence.
- **Estimated fix:** 3–5 engineering days after the import contract is approved.
- **Required tests:** malformed file, duplicate rows, partial row failure, idempotent retry, unauthorized import, tenant scope, transaction rollback and post-import reconciliation.

### SA-AUD-P0-002 — Batch transfer is not one atomic business operation

- **Severity:** P0
- **Evidence:** `src/components/StudentAffairsPortal.tsx`, `handleBatchTransfer` loops through selected students and invokes `StudentRepository.transferStudent` one by one. A later failure can leave earlier transfers committed; the UI explicitly reports a partial count.
- **Classification:** Code-level verified; production blocker.
- **Business impact:** A school can have a mixed transfer state and conflicting enrollment history.
- **Customer impact:** Reports and student placement become unreliable after a partial batch.
- **Technical impact:** No single transaction boundary is visible at the component operation boundary.
- **Repair complexity:** High; requires an approved server-side batch contract and transaction semantics.
- **Estimated fix:** 3–5 engineering days after the transaction/transfer contract is approved.
- **Required tests:** failure at each item, rollback of all items, concurrent transfer, retry/idempotency, cross-tenant denial and immutable history.

### SA-AUD-P0-003 — Student Affairs display source is local seed/browser state rather than a proven canonical read

- **Severity:** P0
- **Evidence:** `src/App.tsx` imports `studentsSeed`, enriches it with synthetic fields and initializes local React state. `StudentAffairsPortal` receives that state and filters/paginates it client-side. `FallbackStorage` can seed or persist browser-local data through `localStorage`.
- **Classification:** Demo/Fallback; production blocker.
- **Business impact:** Different users or browsers may see different student populations; updates may appear successful locally but not be durable.
- **Customer impact:** The application can look correct while showing stale or non-production data.
- **Technical impact:** The canonical `CanonicalStudentReadRepository` exists, but the inspected primary screen is not demonstrably driven by it for its main list.
- **Repair complexity:** High; requires an approved cutover plan, not a cosmetic change.
- **Estimated fix:** 5–8 engineering days including reconciliation and regression testing.
- **Required tests:** authoritative read after refresh, multi-user visibility, tenant/branch scope, offline/browser storage absence, stale-cache invalidation and persistence verification.

### SA-AUD-P0-004 — Bulk delete can report success for failed HTTP responses

- **Severity:** P0
- **Evidence:** `src/components/student-affairs/StudentSearchPanel.tsx` uses `Promise.all` over `fetch` calls and does not reject on non-2xx HTTP responses before removing local rows and showing success.
- **Classification:** Code-level verified; production blocker.
- **Business impact:** Operators can believe records were deleted when the server rejected them.
- **Customer impact:** Misleading destructive-operation feedback.
- **Technical impact:** Client state becomes inconsistent with the backend and audit trail.
- **Repair complexity:** Medium–high.
- **Estimated fix:** 1–2 engineering days plus destructive-operation regression tests.
- **Required tests:** 403, 404, 409, network failure, mixed success/failure, retry and tenant-scope denial.

### SA-AUD-P0-005 — Production Vite build is blocked by a server-only Node import

- **Severity:** P0
- **Evidence:** `src/tenant/TenantContext.ts` imports `AsyncLocalStorage` from `node:async_hooks`. Vite transforms the browser graph and fails because `AsyncLocalStorage` is not available from the browser external.
- **Classification:** Production blocker; pre-existing and outside the preceding Guardian mission scope.
- **Business impact:** A repeatable browser production build cannot be certified.
- **Customer impact:** Deployment may fail or deliver an incomplete artifact.
- **Technical impact:** Server-only tenant context is coupled to the client bundle.
- **Repair complexity:** Medium–high; requires an explicit architecture-safe boundary between server request context and browser code.
- **Estimated fix:** 1–3 engineering days after CTO approval of the tenant-context boundary.
- **Required tests:** Vite build, server bundle, browser smoke test, tenant propagation, concurrent request isolation and full regression suite.

## 5. P1 Risk Register — High Priority

### SA-AUD-P1-001 — Competing student write paths

`POST /api/students` remains available beside canonical `POST /api/student-registration`. The legacy route delegates to older orchestration and accepts broad request data, while the canonical route applies the newer registration contract, idempotency and outbox/audit flow. Two paths can evolve different business rules.

**Impact:** inconsistent validation, audit, duplicate prevention and lifecycle behavior.  
**Recommendation:** CTO-approved route consolidation or an explicit compatibility adapter with one canonical service.

### SA-AUD-P1-002 — Finance and accounting behavior in `App.tsx` is browser-local

`handleStudentPaymentSubmit` updates local student/invoice/journal/account state and browser storage keys such as `erp_journal_entries_v2`, `erp_receipt_vouchers_v2` and `erp_chart_of_accounts_v2`. This is not evidence of a live accounting integration.

**Impact:** payment display and accounting posting can diverge.  
**Classification:** Demo/Fallback / evidence blocked for live integration.

### SA-AUD-P1-003 — Guardian tab is not a complete Guardian workflow

The active Guardian view derives a small list from the student list and uses notifications for “link guardian”, call and message actions. This is insufficient as a persistent guardian-management workflow.

**Impact:** operators cannot rely on the screen for authoritative guardian relationships.

### SA-AUD-P1-004 — Documents have a canonical metadata route but no binary upload in the active screen

`src/modules/student-documents/presentation/StudentDocumentsPortal.tsx` uses API-backed metadata, verification, archive/restore, versioning and access history. It explicitly does not upload binary file content. The older `src/components/student-affairs/StudentDocuments.tsx` simulates scanning/upload through local state and is not the active portal path.

**Classification:** Canonical metadata implemented; binary storage incomplete; older component dead/unused.

### SA-AUD-P1-005 — Reports and settings contain false-success or non-persistent controls

ID card and certificate actions primarily show notifications. Registration settings use default-value inputs without a visible save/persistence path. Print/export are client-generated.

**Impact:** the user interface implies capabilities that are not yet durable workflows.

### SA-AUD-P1-006 — Canonical student read mapping is incomplete for fields used by the main UI

`src/database/repositories/CanonicalStudentReadRepository.ts` maps several displayed fields to empty/default values, including national ID, guardian labels/phone, classroom/section and fees. This explains why the current screen remains dependent on enriched seed/local records for a rich table display.

**Impact:** canonical cutover without a completed read contract would degrade the operator experience and data completeness.

### SA-AUD-P1-007 — Client-side export/print handles sensitive data

`StudentAffairsPortal` builds CSV and print HTML in the browser containing identifiers and guardian contact data. The print path writes values into `document.write` without an explicit escaping layer.

**Impact:** privacy exposure and possible HTML injection if untrusted values reach the print surface. Export must be permissioned, audited, scoped and safely encoded.

### SA-AUD-P1-008 — Client-provided request context remains structurally present

Authorization and tenant middleware inspect headers/query/body context and then compare it with trusted identity/context. This is a defense-in-depth assertion, not permission to trust the client. Live enforcement remains unverified because Operations evidence is blocked.

**Impact:** future endpoint omissions could reintroduce spoofing risk; route-level tests must cover every endpoint.

## 6. P2 / P3 Findings

- **SA-AUD-P2-001:** Main table filtering and pagination are client-side; acceptable for a small fixture but not a certified strategy for millions of students.
- **SA-AUD-P2-002:** Some loading, empty and error states are stronger in the documents portal than in the main Student Affairs table; unify them before commercial release.
- **SA-AUD-P2-003:** The visual identity is strong, but duplicated navigation and multiple local action patterns can make behavior feel inconsistent.
- **SA-AUD-P2-004:** Mobile and very-large-table behavior requires dedicated responsive and keyboard testing.
- **SA-AUD-P3-001:** Demo fallback values and synthetic telemetry should be clearly separated from production metrics to avoid misleading operators.
- **SA-AUD-P3-002:** Hardcoded UI audit metadata such as `mgr_sulaiman`, a display name and an IP address remains in `App.tsx` handlers. Server-generated metadata is the required source; the client values must not be treated as authoritative.

## 7. Functional Review

| Capability | Result | Classification |
|---|---|---|
| Student list/search/filter | Visible and responsive for local fixture | Demo/Fallback; scale unproven |
| Add/edit student | UI flow exists; persistence path is mixed | Integrated/code-level; needs canonical cutover |
| Soft delete | Repository path exists | Code-level; live persistence/RLS unproven |
| Suspend/status change | Repository call exists | Code-level; workflow completeness needs review |
| Batch transfer | One-by-one loop | P0 partial-write risk |
| Bulk delete | Browser fetch loop | P0 false-success risk |
| Excel import | Simulated only | P0 false-success |
| Guardians | Derived/demo actions | P1 incomplete |
| Documents | Metadata portal exists | Binary storage not implemented in active screen |
| Reports/printing | Client-generated or toast-only | P1 incomplete/privacy risk |
| Settings | Inputs visible | Persistence not demonstrated |

## 8. Security and Tenant Review

The codebase contains trusted authentication, permission checks, tenant context and scoped repository work from the earlier waves. The Guardian repository fix is code-level verified and locally tested. However, the main Student Affairs display and several actions still use local/browser state, and live database/RLS enforcement is not certified.

Required release posture:

1. One trusted server-side source of identity, tenant, school and branch.
2. One canonical service per protected business operation.
3. No client value may become actor, tenant, school or branch authority.
4. Every destructive/export operation must be permissioned, scoped, audited and tested for non-2xx responses.
5. No production claim until Operations evidence C–G is supplied.

## 9. UX/UI Review

### First five seconds

**Strengths:** strong dark top bar, cream/gold surface, RTL alignment, visible identity, concise tabs and KPI cards, and a professional registration modal. The screen communicates a serious school-management product rather than a raw CRUD page.

**Confidence risks:** synthetic KPIs, simulated success messages and controls that only notify without persistence undermine the initial confidence after the first interaction. Visual polish currently exceeds functional certainty.

### Accessibility and usability

The layout has clear grouping and readable hierarchy. Before release, verify keyboard order, focus trapping in dialogs, screen-reader labels for icon buttons, contrast in gold-on-cream controls, responsive table behavior and explicit error recovery.

## 10. Performance Review

The local fixture is small and client filtering is fast. This does not establish readiness for 5,000+ schools, 1,000+ concurrent users or millions of students. The next approved implementation must move search, filtering, sorting and pagination to the canonical server/repository contract, measure p95 latency and test concurrent tenant-scoped requests.

## 11. Validation Executed

- **TypeScript:** PASS — `pnpm run lint`.
- **Focused Guardian and related tests:** PASS per preceding accepted mission.
- **Full Vitest suite:** PASS — 33 files, 176 tests.
- **Server bundle:** PASS per preceding accepted validation.
- **Vite browser build:** FAIL — pre-existing `src/tenant/TenantContext.ts` `node:async_hooks` / `AsyncLocalStorage` browser graph error.
- **Git diff check:** no whitespace errors; existing line-ending warnings only.
- **Live database/RLS/security certification:** NOT EXECUTED / EVIDENCE BLOCKED.

## 12. Prioritized Repair Roadmap

### Wave A — Release blockers

1. Resolve the Vite tenant-context boundary under a separate approved mission.
2. Remove false-success import and bulk-delete behavior by routing through explicit server contracts.
3. Replace batch transfer loop with an approved atomic/idempotent transaction contract.
4. Establish the canonical Student Affairs read source and reconcile local fallback usage.

### Wave B — High-priority business integrity

1. Consolidate legacy and canonical student write routes.
2. Complete canonical student read mapping and guardian relationships.
3. Define live finance/accounting integration boundaries; remove browser-local posting as an authoritative path.
4. Complete document binary storage or clearly limit the product contract to metadata.
5. Make reports, exports and settings persistent, permissioned and auditable.

### Wave C — Enterprise UX and scale

1. Server-side search/filter/pagination and performance budgets.
2. Unified loading/error/empty/accessibility behavior.
3. Responsive and keyboard QA.
4. Replace synthetic telemetry with verified runtime metrics.

## 13. Audit Decision

**Mission status: READY FOR CTO REVIEW**

This report is complete as an audit artifact. No application code, schema, migration, RLS policy or database object was modified by this mission. Implementation must not begin until the CTO issues a separate mission for a specific P0 item and explicitly preserves the audit boundary.
