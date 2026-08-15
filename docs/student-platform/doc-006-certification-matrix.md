# DOC-006 — Student Documents Certification Matrix

## 1. Decision Rules

This matrix separates code-level readiness from live operational evidence.

- **PASS**: verified by source review and/or automated local tests in the canonical Student Documents path.
- **EVIDENCE BLOCKED**: requires the approved Operations Evidence Capability and was not replaced with a fixture, SQL Editor execution, service-role access, or RLS bypass.
- **N/A**: the scenario is intentionally outside this package, such as binary storage and OCR.

No row marked `EVIDENCE BLOCKED` is represented as a production or live-database success.

## 2. Certification Matrix

| Test / Contract | Local | Staging Live | DB Evidence | Security Evidence | Status | Evidence |
|---|---|---|---|---|---|---|
| Category Create | PASS — validation, trusted context, transaction/outbox path reviewed | EVIDENCE BLOCKED | EVIDENCE BLOCKED | PASS — route is authenticated and permission protected | EVIDENCE BLOCKED | `StudentDocumentService.createCategory`; `POST /api/student-document-categories` |
| Category Update | PASS — optimistic version check and scoped update reviewed | EVIDENCE BLOCKED | EVIDENCE BLOCKED | PASS — canonical route uses trusted request context | EVIDENCE BLOCKED | `StudentDocumentService.updateCategory`; `PATCH /api/student-document-categories/:id` |
| Document Create Metadata | PASS — registration, rollback, audit/outbox and idempotency covered | EVIDENCE BLOCKED | EVIDENCE BLOCKED | PASS — tenant/school/branch scope is reasserted in repository SQL | EVIDENCE BLOCKED | `StudentDocumentService.registerDocument`; focused service tests |
| Document List | PASS — pagination/filter normalization and empty state covered | EVIDENCE BLOCKED | EVIDENCE BLOCKED | PASS — authenticated view permission and scoped repository query | EVIDENCE BLOCKED | `GET /api/student-documents`; portal empty-state test |
| Document Search | PASS — search input is sent as a bounded query filter | EVIDENCE BLOCKED | EVIDENCE BLOCKED | EVIDENCE BLOCKED | EVIDENCE BLOCKED | Live query-plan and tenant evidence require Operations capability |
| Document Filters | PASS — student/category/lifecycle/verification/classification/retention filters normalized | EVIDENCE BLOCKED | EVIDENCE BLOCKED | EVIDENCE BLOCKED | EVIDENCE BLOCKED | `normalizeDocumentListFilters`; service validation tests |
| Document Detail | PASS — detail and version list are loaded only after successful API response | EVIDENCE BLOCKED | EVIDENCE BLOCKED | PASS — repository detail query is scoped | EVIDENCE BLOCKED | `GET /api/student-documents/:id`; portal detail test |
| Current Version | PASS — current version is returned by canonical detail path | EVIDENCE BLOCKED | EVIDENCE BLOCKED | EVIDENCE BLOCKED | EVIDENCE BLOCKED | Live database verification is unavailable |
| Verify | PASS — reason required and only `pending_verification` can be verified | EVIDENCE BLOCKED | EVIDENCE BLOCKED | PASS — authenticated permission and trusted actor path | EVIDENCE BLOCKED | `POST /api/student-documents/:id/verification`; service tests |
| Reject | PASS — reason required and only `pending_verification` can be rejected | EVIDENCE BLOCKED | EVIDENCE BLOCKED | PASS — authenticated permission and trusted actor path | EVIDENCE BLOCKED | Service transition guards and focused tests |
| Expire | PASS — eligibility, legal hold, retention date, and repeated expiry are guarded | EVIDENCE BLOCKED | EVIDENCE BLOCKED | PASS — authenticated permission and trusted actor path | EVIDENCE BLOCKED | Service transition guards |
| Invalid Verification Transitions | PASS — invalid source states return conflict | EVIDENCE BLOCKED | EVIDENCE BLOCKED | PASS — no client state can bypass service guard | EVIDENCE BLOCKED | `ConflictError` guards; draft verification test |
| Archive | PASS — legal hold and archive eligibility are enforced | EVIDENCE BLOCKED | EVIDENCE BLOCKED | PASS — authenticated archive permission | EVIDENCE BLOCKED | `POST /api/student-documents/:id/archive` |
| Restore | PASS — restore is a separate explicit action with reason and idempotency scope | EVIDENCE BLOCKED | EVIDENCE BLOCKED | PASS — authenticated archive permission | EVIDENCE BLOCKED | Archive/restore service path |
| Legal Hold | PASS — archive/expiry operations reject held documents | EVIDENCE BLOCKED | EVIDENCE BLOCKED | PASS — client cannot override server decision | EVIDENCE BLOCKED | Service business-rule guards |
| Retention | PASS — retention and archive-eligibility dates are validated | EVIDENCE BLOCKED | EVIDENCE BLOCKED | PASS — values are validated server-side | EVIDENCE BLOCKED | Input validation and lifecycle guards |
| Version Create | PASS — version creation is transactional and idempotency-scoped | EVIDENCE BLOCKED | EVIDENCE BLOCKED | PASS — trusted scope is enforced on document/version updates | EVIDENCE BLOCKED | `POST /api/student-documents/:id/versions`; focused tests |
| Current-Version Transition | PASS — new required-verification versions return to pending verification | EVIDENCE BLOCKED | EVIDENCE BLOCKED | PASS — update predicates include trusted scope | EVIDENCE BLOCKED | `updateCurrentVersion` scoped SQL |
| Historical Immutability | PASS — historical versions are read-only through the canonical service contract | EVIDENCE BLOCKED | EVIDENCE BLOCKED | EVIDENCE BLOCKED | EVIDENCE BLOCKED | Requires live mutation attempt and DB evidence |
| Access Log Read | PASS — access history is read through a protected endpoint | EVIDENCE BLOCKED | EVIDENCE BLOCKED | PASS — dedicated permission is required | EVIDENCE BLOCKED | `GET /api/student-documents/:id/access-log` |
| Access Log Mutation | PASS — no canonical mutation endpoint is exposed | EVIDENCE BLOCKED | EVIDENCE BLOCKED | EVIDENCE BLOCKED | EVIDENCE BLOCKED | Live database immutability evidence remains unavailable |
| 401 Missing/Expired Session | PASS — UI renders an explicit re-authentication message | EVIDENCE BLOCKED | EVIDENCE BLOCKED | PASS — route is behind `authenticateRequest` | EVIDENCE BLOCKED | Central UI error mapping; live request unavailable |
| 403 Missing Permission | PASS — UI renders an explicit permission message and does not reveal rows | EVIDENCE BLOCKED | EVIDENCE BLOCKED | PASS — six registered document permissions are tested | EVIDENCE BLOCKED | Portal authorization test |
| 409 Stale/Illegal State | PASS — UI renders a recoverable conflict message | EVIDENCE BLOCKED | EVIDENCE BLOCKED | PASS — service uses optimistic version/state guards | EVIDENCE BLOCKED | Portal conflict-state test and service tests |
| 400/422 Validation | PASS — UI preserves server validation message or renders a validation fallback | EVIDENCE BLOCKED | EVIDENCE BLOCKED | PASS — service validates input | EVIDENCE BLOCKED | `documentErrorMessage`; service validation tests |
| 500/Transient Failure | PASS — UI renders a retry-oriented server failure message; refresh action remains available | EVIDENCE BLOCKED | EVIDENCE BLOCKED | EVIDENCE BLOCKED | EVIDENCE BLOCKED | Live failure injection is blocked |
| Forged Tenant | PASS — canonical SQL predicates use trusted context, not request body | EVIDENCE BLOCKED | EVIDENCE BLOCKED | PASS — trusted context is injected before service execution | EVIDENCE BLOCKED | Repository query review |
| Forged School | PASS — document and actor queries reassert school scope | EVIDENCE BLOCKED | EVIDENCE BLOCKED | PASS — client school values are not used as identity | EVIDENCE BLOCKED | Scoped repository SQL review |
| Forged Branch | PASS — document and actor queries reassert branch scope | EVIDENCE BLOCKED | EVIDENCE BLOCKED | PASS — client branch values are not used as identity | EVIDENCE BLOCKED | Scoped repository SQL review |
| Forged Role | PASS — backend permission middleware remains authoritative | EVIDENCE BLOCKED | N/A | PASS — no StudentDocument role decision is trusted from React | EVIDENCE BLOCKED | `authenticateRequest` + `requirePermission` route chain |
| Audit | PASS — audit rows are created inside the operation transaction | EVIDENCE BLOCKED | EVIDENCE BLOCKED | EVIDENCE BLOCKED | EVIDENCE BLOCKED | Live append-only and tenant evidence unavailable |
| Outbox | PASS — business write, audit and outbox are within the service transaction | EVIDENCE BLOCKED | EVIDENCE BLOCKED | EVIDENCE BLOCKED | EVIDENCE BLOCKED | Live persistence and retry evidence unavailable |
| Rollback | PASS — service tests cover database failure rollback | EVIDENCE BLOCKED | EVIDENCE BLOCKED | EVIDENCE BLOCKED | EVIDENCE BLOCKED | Live partial-failure evidence unavailable |
| Idempotency | PASS — operation/resource namespaces prevent cross-operation key reuse | EVIDENCE BLOCKED | EVIDENCE BLOCKED | PASS — keys are server-scoped to trusted operation context | EVIDENCE BLOCKED | Focused idempotency namespace test |
| Binary Storage / OCR | N/A | N/A | N/A | N/A | N/A | Explicitly outside DOC-006 and the canonical metadata package |

## 3. API ↔ UI Contract Review

| UI action | Endpoint | Method | Server permission | Success state | Failure state |
|---|---|---|---|---|---|
| Load categories | `/api/student-document-categories` | GET | `StudentDocument.View` | Categories rendered | 401/403/5xx explicit alert |
| Create category | `/api/student-document-categories` | POST | `StudentDocument.Create` | Category result returned | Validation/conflict/permission warning |
| Update category | `/api/student-document-categories/:id` | PATCH | `StudentDocument.Create` | Updated result returned | Version conflict/validation warning |
| Load list | `/api/student-documents` | GET | `StudentDocument.View` | Rows, total, pagination | Loading, empty, 401, 403, retry-oriented 5xx |
| Load student list | `/api/students/:studentId/documents` | GET | `StudentDocument.View` | Scoped rows | Permission and server error states |
| Register metadata | `/api/students/:studentId/documents` | POST | `StudentDocument.Create` | Success notification and refresh | Validation/conflict/permission warning |
| Open detail | `/api/student-documents/:id` | GET | `StudentDocument.View` | Detail and versions | 401/403/409/5xx explicit alert |
| Add version | `/api/student-documents/:id/versions` | POST | `StudentDocument.Version.Create` | Success notification and refresh | Validation/conflict/permission warning |
| Decide verification | `/api/student-documents/:id/verification` | POST | `StudentDocument.Verify` | Decision committed and detail closed | Validation/conflict/permission warning |
| Archive/restore | `/api/student-documents/:id/archive` | POST | `StudentDocument.Archive` | Archive/restore committed | Legal-hold/conflict/permission warning |
| Read access log | `/api/student-documents/:id/access-log` | GET | `StudentDocument.AccessLog.View` | Access history rendered | Permission/server error alert |

## 4. Security Boundary Review

The canonical path is:

`authenticateRequest → requirePermission → trusted tenant context → StudentDocumentService → scoped repository SQL → UnitOfWork audit/outbox`

The following were not changed by DOC-006:

- `PermissionRegistry`, `AuthorizationEngine`, and `RoleResolver`.
- `TenantEngine`, tenant middleware, and trusted session/authentication.
- General `UnitOfWork` and transaction infrastructure.
- RLS, migrations, schema, database roles, service-role access, and Production configuration.

The old fallback repository and certification/demo readers remain outside the canonical Student Documents API. They are documented as legacy boundaries and were not deleted automatically.

## 5. Live Evidence Gate

The following evidence is still blocked by the closed `DOC-EVIDENCE-001` Operations gate:

- Live Staging database writes and reads.
- Cross-tenant, cross-school, and cross-branch mutation attempts.
- Live RLS policy evaluation.
- Live audit/outbox persistence and rollback observation.
- Live historical-version mutation attempts.
- Live connection, cleanup, and post-test isolation proof.

No fixture, SQL Editor, `postgres`, `service_role`, token extraction, diagnostic endpoint, or RLS bypass was used to replace that missing evidence.

## 6. Final Classification

`DOC-006 = READY FOR LIVE CERTIFICATION`

The Student Documents code and contract surface are ready for the next approved live-certification mission. The remaining blocker is operational evidence capability, not an identified code-level defect in the canonical path.
