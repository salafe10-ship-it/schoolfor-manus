# STU-AFFAIRS-P1-006-06 — Student Documents Discovery

## Scope

Discovery-only review of the Student Documents module. No source, API, database, SQL, RLS, migration, UnitOfWork, authorization, tenant-engine, or storage changes were made.

## Executive conclusion

The module is a **canonical metadata and lifecycle workflow**, not a file-upload/download platform. It has a real authenticated API, dedicated permissions, trusted tenant resolution, request-scoped transaction boundaries, optimistic version checks, audit events, access logs, outbox events, and idempotency for mutating commands. The UI explicitly tells the operator that binary files are not uploaded from this screen.

Therefore:

- Metadata registration and lifecycle actions are **CANONICAL** at code level.
- Binary upload, storage, download, and file preview are **NOT_IMPLEMENTED** in this module.
- Staging/production readiness was not certified here because this mission is discovery-only and the broader Student Read observability gate remains blocked.

## Operation chain review

| Operation | UI | Handler | API | Authorization | Tenant context | Service/repository | Transaction | Audit / access log | Outbox | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| List documents | `StudentDocumentsPortal` filters/table | `loadDocuments` | `GET /api/student-documents` | `StudentDocument.View` | `resolveStudentTenantMiddleware` → trusted context | `listDocuments` | Yes; read/access tables listed | Access audit + access log per returned document | No event for read | **CANONICAL** |
| List categories | Component load effect | `loadCategories` | `GET /api/student-document-categories` | `StudentDocument.View` | Trusted tenant middleware | `listCategories` | Yes | No mutation audit | No | **CANONICAL READ** |
| Open document details | “فتح التفاصيل” | `openDetails` | `GET /api/student-documents/:id` | `StudentDocument.View` | Trusted tenant middleware | `getDocument` + versions | Yes | Access audit + access log | No | **CANONICAL READ** |
| Access history | “تحميل” | `loadAccessHistory` | `GET /api/student-documents/:id/access-log` | `StudentDocument.AccessLog.View` | Trusted tenant middleware | `accessHistory` | Yes | Access audit + access log | No | **CANONICAL READ** |
| Register metadata | “تسجيل مستند” form | `submitCreate` | `POST /api/students/:studentId/documents` | `StudentDocument.Create` | Trusted tenant middleware | `registerDocument` + insert functions | Yes | Audit event | `StudentDocument.Registered` | **CANONICAL** |
| Add metadata version | “إصدار جديد” | `addVersion` | `POST /api/student-documents/:id/versions` | `StudentDocument.Version.Create` | Trusted tenant middleware | `addVersion`, row lock/version update | Yes | Audit event | `StudentDocument.VersionAdded` | **CANONICAL** |
| Verify/reject/expire | Decision buttons | `decide` | `POST /api/student-documents/:id/verification` | `StudentDocument.Verify` | Trusted tenant middleware | `decide`, expected-version validation | Yes | Audit + access log | Verified/Rejected/Expired event | **CANONICAL** |
| Archive/restore | Archive/restore buttons | `archive` | `POST /api/student-documents/:id/archive` | `StudentDocument.Archive` | Trusted tenant middleware | `archive`, legal-hold/date/version rules | Yes | Audit + access log | Archived/Restored event | **CANONICAL** |
| Binary upload | None | None | None | None | None | None | None | None | None | **NOT_IMPLEMENTED** |
| Download/open binary file | None | None | None | None | None | None | None | None | None | **NOT_IMPLEMENTED** |
| OCR/scanning/external provider | None | None | None | None | None | None | None | None | None | **OUT OF SCOPE** |

## Security and integrity findings

- Route order is authentication → permission → tenant middleware → business service.
- `studentDocumentContext` rejects a missing trusted tenant context and generates request/correlation IDs server-side.
- Repository queries constrain tenant, school, and branch from trusted context; student membership is checked before registration.
- Client request bodies carry document business metadata only. They do not control actor, tenant, school, branch, audit IDs, timestamps, or transaction identity.
- Mutating operations require an `Idempotency-Key`; keys are namespaced by operation and resource and the stored result is returned idempotently.
- Mutations create audit/outbox records in the same UnitOfWork boundary. Verification and archive operations also create access-log records.
- Optimistic concurrency is enforced with `expectedVersion`; current document rows are locked for update before version mutations.
- Legal hold, retention, lifecycle, file metadata, content hash, and classification validation are present.
- UI success notifications occur only after awaited successful API responses; errors produce warning states.

## Findings requiring separate missions

- No binary storage bucket/provider/upload/download contract exists in this module.
- No preview/virus-scan/OCR workflow exists.
- No dedicated document deletion command exists; archive is the available lifecycle action.
- Staging verification of the complete document path should be a separate controlled mission once operational observability is available.

*** Add File: C:\Users\admin\Documents\New project\docs\student-platform\stu-affairs-p1-006-06-function-matrix.md
# STU-AFFAIRS-P1-006-06 — Student Documents Function Matrix

| Function | UI state | Handler/API | Trusted security | Persistence and atomicity | Audit/outbox | Error/false-success | Tests found | Classification |
|---|---|---|---|---|---|---|---|---|
| Load categories | Loading is implicit in initial module load; error banner exists | `loadCategories` → `GET /api/student-document-categories` | Auth, View permission, tenant middleware | Read transaction | No mutation event | Explicit error; no success toast | Portal empty/error coverage | C |
| List documents | Busy spinner, empty state, table, pagination, filter reset | `loadDocuments` → `GET /api/student-documents` | Auth, View permission, tenant middleware | Read transaction; trusted scope | Access audit/log per returned row | Explicit error and empty state | Portal empty/permission coverage | C |
| Open details | Detail dialog and busy/error state | `openDetails` → `GET /api/student-documents/:id` | Auth, View permission, tenant middleware | Read transaction | Access audit/log | Explicit error; no fake detail | Portal details coverage | C |
| Load access log | Hidden until requested; load button | `loadAccessHistory` → access-log endpoint | Dedicated AccessLog.View permission | Read transaction | Access recorded | Explicit permission/error message | Service access-path coverage | C |
| Register document metadata | Form; mutation only for SchoolAdmin/SuperAdmin | `submitCreate` → POST student documents | Create permission, trusted tenant, student-in-scope check | One UnitOfWork; document + version | Audit + outbox | Notification after response; warning on failure | Service and portal coverage | C |
| Add document version | Reason/file metadata form | `addVersion` → POST versions | Version.Create permission, trusted scope, row lock/version | One UnitOfWork; previous current version update + new version + parent update | Audit + outbox | Required fields; stale/archive errors | Service coverage | C |
| Verify document | Reason required; disabled until reason | `decide('verify')` | Verify permission, expected version, lifecycle rules | One UnitOfWork | Audit + access log + outbox | Success only after response; conflict message | Service coverage | C |
| Reject document | Reason required; disabled until reason | `decide('reject')` | Verify permission, expected version, lifecycle rules | One UnitOfWork | Audit + access log + outbox | Success only after response; conflict message | Service coverage | C |
| Expire document | Reason required; retention/legal-hold checks | `decide('expire')` | Verify permission, expected version | One UnitOfWork | Audit + access log + outbox | Rejects noneligible records | Service coverage | C |
| Archive document | Reason required; archive eligibility/legal hold | `archive(false)` | Archive permission, expected version | One UnitOfWork; soft delete | Audit + access log + outbox | Explicit conflict/error state | Service coverage | C |
| Restore document | Reason required on archived record | `archive(true)` | Archive permission, expected version | One UnitOfWork; clears soft delete | Audit + access log + outbox | Explicit conflict/error state | Service coverage | C |
| Binary file upload | No file input; metadata-only notice | No handler/API | No provider | None | None | Correctly unavailable; no false success | No upload test because not offered | N |
| Binary file download/open | No button or URL | No handler/API | No provider | None | None | No misleading action | No test | N |
| Category create/update | No UI in reviewed portal; server routes exist | POST/PATCH category routes | Create permission + tenant | UnitOfWork; optimistic version on update | Audit + outbox for mutations | Server validation/errors | Authorization/service coverage | C API / UI N |

## Risk classification

- **P0:** none identified inside the reviewed canonical metadata path.
- **P1:** binary upload/download/storage contract is absent if customers expect actual files; requires an independent architecture/security mission.
- **P1:** end-to-end Staging verification remains pending operational observability.
- **P2:** category administration has API support but no visible Student Affairs UI in the reviewed component.
- **P2:** read access logging is performed per listed/opened document; high-volume list behavior should be measured before large deployments.

*** Add File: C:\Users\admin\Documents\New project\docs\student-platform\stu-affairs-p1-006-06-validation.md
# STU-AFFAIRS-P1-006-06 — Student Documents Validation

## Static and architectural checks

| Check | Result | Evidence |
|---|---|---|
| Auth → permission → tenant order | PASS | All document routes follow the required middleware order |
| Trusted tenant context | PASS | `studentDocumentContext` rejects missing context; identity/scope are server-derived |
| Cross-tenant/cross-school/branch query protection | PASS at code level | Repository queries use trusted `tenantId`, `schoolId`, `branchId`; student scope is asserted before registration |
| Client audit metadata trust | PASS at code level | Actor, audit ID, request ID, correlation ID, and timestamps are created/resolved server-side |
| Atomic document registration | PASS at code level | Document, first version, audit event, and outbox event run in one UnitOfWork |
| Atomic version update | PASS at code level | Current-version update, new version, parent version update, audit, and outbox share one UnitOfWork |
| Atomic verification/archive | PASS at code level | Domain update, access log, audit, and outbox share one UnitOfWork |
| Idempotency | PASS at code level | Mutating document operations require namespaced `Idempotency-Key` and reuse stored result |
| Optimistic concurrency | PASS at code level | `expectedVersion` plus `FOR UPDATE` is used for mutable document records |
| Rollback behavior | PASS in existing tests | `studentDocumentService.test.ts` covers commit failure and rollback |
| Unauthorized user | PASS in existing tests | Document authorization test and portal 403 behavior exist |
| Missing student / scope | PASS at code level | `assertStudentInScope` precedes registration |
| False-success UI | PASS at code level | UI awaits API response and renders warnings on failure; no binary-upload success is presented |
| Fallback write | PASS | No FallbackStorage write path found in the canonical document service/repository |
| Storage/upload/download | NOT IMPLEMENTED | The module explicitly states metadata-only; no bucket/provider contract exists |

## Existing test evidence

- `src/__tests__/studentDocumentService.test.ts`: validation bounds, trusted tenant/actor, rollback, required reason, lifecycle rejection, idempotency namespace.
- `src/__tests__/studentDocumentAuthorization.test.ts`: six approved document permissions and unknown-permission rejection.
- `src/__tests__/studentDocumentsPortal.test.tsx`: empty state, details/version rendering, 403 denial, stale-version conflict recovery.

## Validation boundary

This mission did not execute live Staging operations and did not change the database or RLS. Code-level evidence is not a substitute for a live cross-tenant test. Binary file handling is not partially implemented and must not be advertised as available.

## Final status

**STU-AFFAIRS-P1-006-06 = DISCOVERY COMPLETE / CODE-LEVEL CANONICAL PATH CONFIRMED / READY FOR CTO REVIEW**

