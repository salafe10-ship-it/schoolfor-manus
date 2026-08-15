# STU-AFFAIRS-P1-006-06 — Student Documents Function Matrix

| Function | UI / handler | API and permission | Tenant / persistence | Audit / outbox | Classification |
|---|---|---|---|---|---|
| Load categories | Initial `loadCategories` effect | `GET /api/student-document-categories`; StudentDocument.View | Trusted middleware; read transaction | No mutation event | CANONICAL READ |
| List documents | Filters, refresh, pagination; `loadDocuments` | `GET /api/student-documents`; StudentDocument.View | Trusted tenant/school/branch queries; read transaction | Access audit/log for returned records | CANONICAL |
| Open details | “فتح التفاصيل”; `openDetails` | `GET /api/student-documents/:id`; StudentDocument.View | Trusted scope; document + versions read transaction | Access audit/log | CANONICAL |
| Access history | “تحميل”; `loadAccessHistory` | `GET /api/student-documents/:id/access-log`; AccessLog.View | Trusted scope; read transaction | Access audit/log | CANONICAL |
| Register metadata | Role-gated form; `submitCreate` | `POST /api/students/:studentId/documents`; Document.Create | Student-in-scope check; one UnitOfWork | Audit + StudentDocument.Registered outbox | CANONICAL |
| Add version metadata | “إصدار جديد”; `addVersion` | `POST /api/student-documents/:id/versions`; Version.Create | Row lock, optimistic version, one UnitOfWork | Audit + VersionAdded outbox | CANONICAL |
| Verify | Reason-gated button; `decide('verify')` | Verification endpoint; Document.Verify | Lifecycle + expected-version checks; one UnitOfWork | Audit + access log + Verified outbox | CANONICAL |
| Reject | Reason-gated button; `decide('reject')` | Verification endpoint; Document.Verify | Lifecycle + expected-version checks; one UnitOfWork | Audit + access log + Rejected outbox | CANONICAL |
| Expire | Reason-gated button; `decide('expire')` | Verification endpoint; Document.Verify | Retention/legal-hold checks; one UnitOfWork | Audit + access log + Expired outbox | CANONICAL |
| Archive | Reason-gated button; `archive(false)` | Archive endpoint; Document.Archive | Eligibility/legal-hold/version checks; soft delete in one UnitOfWork | Audit + access log + Archived outbox | CANONICAL |
| Restore | Reason-gated archived action; `archive(true)` | Archive endpoint; Document.Archive | Expected-version check; clears soft delete in one UnitOfWork | Audit + access log + Restored outbox | CANONICAL |
| Binary upload | No file input; metadata-only notice | No endpoint/provider | None | None | NOT_IMPLEMENTED |
| Binary download/preview | No button or URL | No endpoint/provider | None | None | NOT_IMPLEMENTED |
| OCR/scanning | No UI or API | No provider | None | None | OUT OF SCOPE |
| Category administration | No UI in reviewed portal | POST/PATCH category routes; Document.Create | Tenant-scoped UnitOfWork; version update | Audit + outbox for mutations | API CANONICAL / UI GAP |

## Risk register

- **P1:** Actual file upload/download/storage/preview is absent; do not advertise metadata registration as file upload.
- **P1:** Live Staging validation remains pending the broader observability gate.
- **P2:** Category administration has API support but no visible UI in this portal.
- **P2:** Listing records audit/access events per returned document; large-volume performance should be measured separately.

