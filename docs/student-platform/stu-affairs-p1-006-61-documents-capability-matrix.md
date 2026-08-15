# STU-AFFAIRS-P1-006-61 — Student Documents Capability Matrix

## Classification legend

- **PROVEN / READY:** Direct source and focused tests establish the behavior within the current contract.
- **PARTIAL:** A material evidence or source-of-truth gap remains.
- **BLOCKED:** The capability cannot be accepted without an external dependency or authorization.
- **NOT IMPLEMENTED:** Explicitly outside the current metadata-only scope.
- **NOT PROVEN:** No sufficient evidence was found.

## Metadata matrix

| Area | UI path | Canonical backend path | State / error evidence | Result |
|---|---|---|---|---|
| Registration validation | Metadata form | `POST /api/students/:studentId/documents` | Required fields, MIME, size, hash, dates, dirty-form and focus errors | **PROVEN / READY** |
| Registration commit proof | Form submit success | Same POST plus list refresh | Returned identifier is not followed by canonical detail postcondition | **PARTIAL** |
| Registration idempotency | Form submit | Service idempotency + outbox | Idempotency key is sent; no automatic replay | **PROVEN / READY** |
| List retrieval | Main table | `GET /api/student-documents` | Loading, error, empty, filtered-empty and total-known semantics | **PROVEN / READY** |
| Student list identity | Student column | List `student_id` plus parent `students` prop | Contextual name lookup rather than canonical response label | **PARTIAL** |
| Detail retrieval | Read-only detail dialog | `GET /api/student-documents/:id` | Sequence guard, stale clear, canonical nullable values | **PROVEN / READY** |
| Categories | Form select | `GET /api/student-document-categories` | Error is explicit and retryable through metadata retry | **PROVEN / READY** |
| Verify | Detail action | `POST /:id/verification` | Permission, reason, version and verified postcondition | **PROVEN / READY** |
| Reject | Detail action + confirmation | `POST /:id/verification` | Confirmation, reason, conflict handling and rejected postcondition | **PROVEN / READY** |
| Expire | Detail action + confirmation | `POST /:id/verification` | Retention/legal-hold eligibility and expired postcondition | **PROVEN / READY** |
| Archive | Detail action + confirmation | `POST /:id/archive` | Archive eligibility/legal-hold and archived postcondition | **PROVEN / READY** |
| Restore | Archived detail action + confirmation | `POST /:id/archive` with restore | Archived-only visibility and restored postcondition | **PROVEN / READY** |
| Add version | Version form | `POST /:id/versions` | Required metadata and current version increase postcondition | **PROVEN / READY** |
| Access history | Explicit load | `GET /:id/access-log` | Allowlist, explicit empty, error and retry | **PROVEN / READY** |
| Search | Search field | `GET /api/student-documents?search=` | Server-side search value with bounded input | **PROVEN / READY** |
| Filters | Filter controls | Query filters | Category, lifecycle, verification, classification, retention and student scope | **PROVEN / READY** |
| Sort | Sort select | Current loaded rows only | Scope is disclosed; deterministic tie-breaker | **PROVEN / READY** |
| Pagination | Pager | `page` / `limit` | Disabled when total is not canonical/known | **PROVEN / READY** |
| Retry | Error banner / access log | Read-only GET paths | No mutation replay | **PROVEN / READY** |
| Conflict | Mutation error | Service 409 / conflict code | Warning plus resynchronization | **PROVEN / READY** |
| Unknown outcome | Network/timeout/refresh mismatch | Request and canonical refresh | No success notification | **PROVEN / READY** |
| Selection race | Detail/filter changes | Canonical GET sequence guards | Old responses ignored; stale detail cleared | **PROVEN / READY** |
| Accessibility | Dialogs/forms/actions | N/A | Labels, roles, live regions, focus and Escape cancellation | **PROVEN / READY** |
| Responsive layout | Portal/table/forms | N/A | Overflow is localized; form/action rows wrap | **PROVEN / READY** |

## Binary and Storage matrix

| Capability | Result | Boundary |
|---|---|---|
| Upload | **NOT IMPLEMENTED** | No binary upload contract in this mission. |
| Download | **NOT IMPLEMENTED** | No download URL or binary response is exposed. |
| Preview | **NOT IMPLEMENTED** | No preview/object URL path is present. |
| Binary version content | **NOT IMPLEMENTED** | Version rows contain metadata only. |
| Malware scan | **NOT IMPLEMENTED** | No scanner integration or trust decision exists here. |
| Quarantine | **NOT IMPLEMENTED** | No quarantine state or workflow exists here. |
| Storage lifecycle | **NOT IMPLEMENTED** | No bucket/object lifecycle is implemented. |
| Signed URL | **NOT IMPLEMENTED** | No signed URL is generated or consumed. |
| Retention purge | **NOT IMPLEMENTED** | Retention is metadata/eligibility only; purge is outside scope. |

## Evidence limitations

The focused test command was attempted during this audit but the local test runner could not load `vitest.config.ts` because the sandboxed esbuild process reported `Access is denied` while resolving a parent directory. Prior P1-006-60 validation records the focused Student Documents suite as 41/41 PASS, with TypeScript and production build PASS. The audit therefore treats the prior evidence as historical evidence and does not claim a new clean runtime test execution.
