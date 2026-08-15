# STU-AFFAIRS-P1-006-04 — Function Matrix

Legend: **C** = CANONICAL, **L** = LEGACY/PROJECTION, **N** = NOT_IMPLEMENTED, **B** = BLOCKED, **T** = NOTIFICATION_ONLY/local, **P** = staging verification pending.

| Function | Button/UI | Real handler | API/provider | Permission / tenant | Persistence | Success/error state | False success | Tests | Readiness |
|---|---:|---:|---:|---|---:|---|---|---|---|
| Student list/search/filter/sort/page | Yes | Yes via load effect | `GET /api/students` | Auth + Student.Read; tenant resolution in server path | Read | Error message exists; staging returned read failure | No success on failed read | Canonical read tests | B / P |
| Add student | Yes | Yes | `POST /api/students` | Auth + Student.Write; trusted tenant context | Yes | Validates required fields and requires returned student before success | Guarded | Registration tests | C / P |
| Edit student | Yes | Yes | `POST /api/students` | Auth + Student.Write; version included | Yes | Success only after returned persisted record | Guarded | Canonical write tests | C / P |
| Edit guardian during student edit | Indirectly | Yes | `PATCH /api/students/:id/guardian` | Auth + Student.Write; canonical guardian version checks | Yes | Rejects missing version metadata and reports error | Guarded | Guardian boundary/writer tests | C / P |
| View student profile | Yes | Local modal | No separate call | Inherits loaded trusted student scope | No | Close action; card printing disabled | No | Existing portal coverage | C read-dependent |
| Suspend student | Yes | Yes | Student write route | Auth + Student.Write; tenant route contract | Yes | Requires persisted response before success | Guarded | Status/write coverage | C / P |
| Direct reactivation | Disabled for suspended row | Fail-closed | None | N/A | No | Warning/correction workflow message | Closed | False-success coverage | N |
| Soft delete student | Yes | Yes | `DELETE /api/students/:id?action=soft` | Auth + Student.Delete | Yes | Confirm + success only after await; warning on error | Guarded | Write coverage | C / P |
| Guardian list/cards | Yes | Projection | Student list data | Inherits student read scope | No independent guardian persistence | Empty state exists | No write success | Guardian tests cover write boundary | L |
| Link guardian | Yes but disabled | No | None | No approved API | No | Explicit unavailable title | Closed | Guardian false-success test | N |
| Guardian call/message | Yes but disabled | No | No provider | No approved provider | No | Explicit unavailable title | Closed | Guardian false-success test | N |
| Student documents list | Yes | Yes | `/api/student-documents` | StudentDocument.View + tenant middleware | Read | Loading/empty/error states | Guarded | Portal/auth tests | C |
| Document details/access log | Yes | Yes | Detail/access-log endpoints | Dedicated document permissions + tenant | Read | Permission and conflict errors | Guarded | Portal/auth tests | C |
| Register document metadata | Yes for allowed role | Yes | `POST /api/students/:id/documents` | Create permission + tenant + idempotency | Yes | Success after response, warning on failure | Guarded | Service/portal tests | C |
| Verify/reject/expire/archive/restore/version | Yes for allowed role | Yes | Dedicated document endpoints | Dedicated permission + expected version + tenant | Yes | Required reason and conflict handling | Guarded | Service tests | C |
| Binary document upload | No | No | None | No storage provider path in this screen | No | Explicitly not offered | Closed | N/A | N |
| Excel import | Dialog only | No mutation | None | No durable command contract | No | Explicit no-op message | Closed | Import false-success test | N |
| Batch transfer/promotion | Modal only | Warning-only | No approved atomic API | No execution | No | Button disabled and no mutation statement | Closed | Existing false-success coverage | B |
| Student list print | Yes | Yes, browser-local | `window.open` / `window.print` | No server report permission path | No durable artifact | Popup warning only | No success toast | No dedicated print test found | T / P |
| XLSX export | Yes | Yes | `GET /api/students/export` | Student.Export + auth + tenant | Generated artifact | Success only after blob | Guarded | Export tests and route contract | C / P |
| ID card print | Visible but disabled | No | None | No issuance service | No | Explicit unavailable title | Closed | No dedicated card test found | N |
| Enrollment certificate | Visible “coming soon” | No | None | No issuance/signature service | No | No action | Not applicable | No dedicated certificate test found | N |
| Student timeline | No action in reviewed portal | Server API exists | `GET /api/students/:id/timeline` | Student.Read + tenant middleware | Read | API response contract exists; no reviewed UI entry point | No UI false success found | No dedicated portal timeline test found | API C / UI N |
| Registration settings | Read-only inputs | No save handler | None | No settings permission/API | No | Read-only state | Closed | No dedicated settings test found | N |

## Required next missions, in strict order

1. **P0 — Operations observability:** provide an access-log/trace channel so Student Read and dependent staging paths can be verified without guessing.
2. **P1 — Student timeline UI contract:** expose the existing timeline API through a permission-aware, tenant-scoped screen with loading/empty/error states and tests.
3. **P1 — Durable import command:** design and implement only after approval: file validation, preview, idempotency, atomic persistence, audit, and rollback.
4. **P1 — TransferOperation:** replace the blocked batch UI only after an atomic, idempotent transfer/promotion service is approved.
5. **P2 — Certificate issuance:** trusted server-generated certificate workflow with approval/signature/audit requirements.
6. **P2 — ID card issuance:** trusted card generation and QR lifecycle, with server audit and revocation semantics.
7. **P2 — Guardian providers:** separate communication provider contracts for call/SMS/message actions.
8. **P2 — Registration settings:** server-backed settings contract with permissions, validation, versioning, and audit.

