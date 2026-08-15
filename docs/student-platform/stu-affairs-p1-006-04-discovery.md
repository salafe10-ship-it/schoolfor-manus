# STU-AFFAIRS-P1-006-04 — Student Affairs Functional Discovery

## Scope and decision

This is a discovery-only audit of the visible Student Affairs functions and their implementation paths. No business code, API, SQL, database, RLS, migration, UnitOfWork, authorization, or tenant-engine changes were made.

The audit separates:

- **Code-level readiness:** the repository contains a real handler and a server/API path with trusted authentication/authorization/tenant controls where applicable.
- **Staging readiness:** the function has been exercised successfully in the deployed environment. This remains blocked for Student Read and therefore for dependent actions.

## Findings by functional area

| Area | Visible function | Classification | Evidence | Current conclusion |
|---|---|---|---|---|
| Student data | List, search, filters, sorting, pagination | **BLOCKED** | `StudentRepository.list` calls `GET /api/students`; `StudentAffairsPortal` delegates filtering/sorting/pagination to the server | Code path is canonical, but staging read verification remains blocked by platform observability and the observed server-side rollback |
| Student registration | Add student | **CANONICAL** | `handleSaveStudent` validates name, birth date, guardian name/phone, then calls `StudentRepository.saveStudent`; server route is authenticated and permission protected | Real write path; staging verification pending the Student Read/observability gate |
| Student profile | View profile | **CANONICAL / READ DEPENDENT** | `setViewStudent` opens the profile modal; the official card-print action is disabled | Read-only local projection exists; it must not be treated as a separately persisted profile service |
| Student profile | Edit student | **CANONICAL** | `handleOpenEditModal` + `StudentRepository.saveStudent`; optimistic version is passed on edit | Real update path; guardian changes use the canonical guardian endpoint when version metadata is present |
| Student profile | Suspend | **CANONICAL** | `handleToggleSuspendStudent` calls the student save path with `status=suspended`; suspended rows fail closed for direct reactivation | Real status write with explicit domain restriction; needs staging verification |
| Student profile | Delete | **CANONICAL** | `handleDeleteStudent` confirms and calls `StudentRepository.softDeleteStudent` | Soft-delete path exists; needs staging verification |
| Guardian area | Guardian cards and linked data | **LEGACY / PROJECTION** | Guardian details are projected from the student list (`parentName`, `parentPhone`, relationship) | Not an independent guardian read service |
| Guardian area | Link guardian | **NOT_IMPLEMENTED** | Button is disabled, `aria-disabled=true`, and has an explicit unavailable title | False-success risk closed; requires a dedicated API/provider mission |
| Guardian area | Call / message | **NOT_IMPLEMENTED** | Buttons are disabled, with no notification, fetch, or `window.open` | False-success risk closed; requires provider integrations |
| Documents | List/filter documents | **CANONICAL** | `StudentDocumentsPortal` calls `/api/student-documents` with auth headers; server route has document permission and tenant middleware | Real API/UI path; focused tests exist; staging verification not performed in this mission |
| Documents | Open details/access history | **CANONICAL** | Detail and access-log endpoints exist and show explicit loading/error/empty states | Real path; permission-denied and stale-version tests exist |
| Documents | Register metadata/version/verify/reject/archive/restore | **CANONICAL** | Dedicated POST endpoints, idempotency keys, version checks, and success/error handling exist | Metadata-only workflow; binary file upload is intentionally not implemented |
| Import | Open Excel import dialog | **NOT_IMPLEMENTED** | Dialog explicitly states no legal durable import path exists; no file is accepted and no student is mutated | Fail-closed and correctly communicates unavailable state |
| Batch actions | Batch transfer/promotion | **BLOCKED** | Modal and button are disabled; handler only warns that no student was changed | Must remain closed until an atomic, idempotent TransferOperation is approved |
| Reports | Student list print | **NOTIFICATION_ONLY / LOCAL** | `handlePrintList` builds a browser print window from the current page projection | Not a server report; does not establish a durable report artifact or server audit record |
| Reports | XLSX export | **CANONICAL / STAGING PENDING** | `StudentRepository.exportStudents` calls `/api/students/export`; dedicated export permission and server XLSX generation exist | Code-level path and tests pass; staging verification is explicitly waiting on Student Read/observability |
| Reports | ID cards | **NOT_IMPLEMENTED** | Card action is disabled with an explicit unavailable title | Requires an approved issuance/QR service |
| Reports | Certificates | **NOT_IMPLEMENTED** | Certificate tile is visibly marked “coming soon” and has no handler | Requires an issuance/signature workflow |
| Timeline | Student timeline | **CANONICAL API / UI GAP** | Server exposes `GET /api/students/:id/timeline`; no corresponding Student Affairs Portal action was found in the reviewed component | API exists, but the reviewed Student Affairs UI does not expose a timeline screen/action |
| Settings | Numbering/registration settings | **NOT_IMPLEMENTED / READ-ONLY** | Inputs are read-only and display “managed by server” / “not approved”; no save handler or API call exists | Correctly avoids pretending settings were persisted |

## Security and trust observations

- Student write routes use authenticated requests and permission middleware; tenant-aware routes additionally use the tenant resolver middleware.
- Document UI obtains the bearer token from the existing trusted session storage and the server enforces document permissions and tenant context.
- No client-side school selector was found in the export route contract.
- Guardian call/message/link actions no longer generate success-like notifications or client-side effects when unavailable.
- Student Read remains unresolved operationally; the deployed test produced a server error after a successful PostgreSQL connection and rollback, while the expected access trace was not observable in Render application logs.

## Out of scope and frozen paths

Student Read RCA, Student Export staging execution, database/RLS/SQL/migrations, UnitOfWork changes, AuthorizationEngine/TenantEngine changes, API creation, and removal of legacy components were not performed.

