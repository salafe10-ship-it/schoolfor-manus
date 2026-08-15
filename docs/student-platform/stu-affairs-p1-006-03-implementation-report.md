# STU-AFFAIRS-P1-006-03 — Student Export Implementation Report

## Final implementation status

Implementation completed within the approved scope. No database schema, migration, RLS, RPC, UnitOfWork, TenantEngine, or AuthorizationEngine redesign was required.

## 1. Files changed

- `src/authorization/PermissionRegistry.ts`
  - Added canonical `Student.Export` permission.
- `src/database/repositories/CanonicalStudentReadRepository.ts`
  - Added bounded export read path using the same canonical filters/search/sort and trusted tenant context.
  - Preserved the grid page limit of 100; export path uses an internal 5,001-row probe only to detect overflow.
- `src/modules/student-export/application/StudentExportService.ts`
  - Added true XLSX generation, operational field projection, formula-safe cell handling, empty-result rejection, and 5,000-row enforcement.
  - Excludes `nationalId` and `parentPhone`/`guardianPhone` from the workbook projection.
- `server.ts`
  - Added `GET /api/students/export`.
  - Added trusted export audit events and response metadata.
- `src/components/student-affairs/repository/StudentRepository.ts`
  - Added server export client method and filename extraction.
- `src/components/StudentAffairsPortal.tsx`
  - Replaced page-only browser CSV with server-generated XLSX download.
  - Removed the old Excel success path and added busy/failure states.
- `src/__tests__/stuAffairsP1Export.test.ts`
- `src/__tests__/stuAffairsP1ExportRouteContract.test.ts`
- `docs/student-platform/stu-affairs-p1-006-03-implementation-report.md`

## 2. API and route changes

`GET /api/students/export` accepts only the approved Student grid query semantics:

- `search`
- `classroom`
- `section`
- `status`
- `gender`
- `sortBy`
- `sortOrder`

It does not accept a client school or tenant selector. The response is a real XLSX artifact with:

- `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- safe ASCII fallback filename and encoded filename;
- `X-Student-Export-Row-Count`;
- server-generated request and correlation IDs.

## 3. Permission

The route requires canonical `Student.Export`, distinct from `Student.View`. The existing authorization engine and role resolver were not redesigned. Existing database role assignments remain the source of trusted permission grants.

## 4. Export architecture

`Authentication → Student.Export authorization → tenant validation → canonical server query → 5,000-row check → XLSX generation → audit → download`.

The browser no longer serializes the current page. The server performs the query for all matching approved filters and rejects results above 5,000 instead of truncating or silently falling back to async behavior.

## 5. Tenant and security enforcement

- Tenant, school, branch, academic year, actor, and role come from the trusted authenticated context.
- `resolveStudentTenantContext` is required before the canonical export query.
- Client-provided school/tenant authority fields are not used by the route.
- Canonical SQL predicates apply trusted tenant, school, branch, and soft-delete scope.
- Authorization and tenant middleware remain in the required order.

## 6. Sensitive-field enforcement

The XLSX projection contains only:

- student number;
- student name;
- classroom;
- section;
- status;
- registration date.

`nationalId` and guardian phone are not included in the server-side workbook projection. They are not merely hidden by the UI.

## 7. XLSX evidence

- The artifact is generated with the existing `xlsx` dependency.
- The generated buffer begins with the ZIP/XLSX signature `PK`.
- The workbook contains an actual `Students` worksheet and Arabic headers.
- Formula-like cell prefixes are escaped before writing.
- The browser receives the artifact only after the server has generated it.

## 8. 5,000-row enforcement

- `0` matching rows: rejected with a truthful empty-result validation error; no misleading file is created.
- `1..5,000`: eligible for synchronous XLSX generation.
- `5,001+`: rejected with a clear validation error; no truncation and no async fallback.

## 9. Audit behavior

The export path records trusted server-side events for:

- `STUDENT_EXPORT_ACCEPTED` after the bounded canonical result is accepted;
- `STUDENT_EXPORT_SUCCESSFUL` after XLSX generation completes;
- `STUDENT_EXPORT_REJECTED` for empty results, invalid filters, and row-limit violations;
- `STUDENT_EXPORT_FAILED` for generation or downstream failures.

Audit details include actor, trusted scope, operation, status, row count, request ID, correlation ID, timestamp, and reason where applicable. Raw student rows and restricted field values are not written to audit metadata. Authorization and tenant denials continue through the existing audit hooks.

## 10. Error and empty behavior

- Non-success server responses are surfaced as failure notifications.
- No success notification is emitted for HTTP failure, empty result, or generation failure.
- The UI displays `جاري التصدير...` while the operation is active.
- The client uses the server-provided filename and does not construct a page-only CSV.

## 11. Tests executed

### Focused Student Export tests

- `src/__tests__/stuAffairsP1Export.test.ts`
- `src/__tests__/stuAffairsP1ExportRouteContract.test.ts`
- **8/8 tests passed**.

Coverage includes authorization separation, trusted permission assignment, XLSX signature and Arabic headers, sensitive-field exclusion, formula safety, empty result, 5,000-row overflow, audit acceptance, route middleware, and removal of the browser CSV path.

### Full regression

- **42 test files passed**.
- **216 tests passed**.

### Static and build checks

- TypeScript `--noEmit`: **PASS**.
- Vite production build: **PASS**.
- Server bundle: **PASS**.
- `git diff --check`: **PASS**; existing LF/CRLF normalization warnings only.
- Secret scan: **PASS**.

## 12. Live/database limitations

No live PostgreSQL, Supabase, RLS, or production export test was executed in this local implementation pass. The route uses the existing configured PostgreSQL transaction driver and existing audit table path, but live tenant isolation, role assignments, artifact download behavior, and performance at 5,000 rows require staging verification.

## 13. STOP conditions

No STOP + RCA condition was encountered. No schema, migration, RLS, SQL mutation, UnitOfWork redesign, TenantEngine redesign, AuthorizationEngine redesign, Import, Transfer, or production change was made.

## Final decision requested

`STU-AFFAIRS-P1-006-03 = READY FOR CTO REVIEW`

CTO review must confirm the code-level implementation and separately schedule live staging verification before production certification.

