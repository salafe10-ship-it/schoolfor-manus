# STU-AFFAIRS-P1-006-61 — Student Documents Metadata Readiness Audit

## Audit decision

**PARTIAL — SPECIFIC BLOCKERS REMAIN**

The metadata portal has a canonical read path and strong action/error safeguards, but metadata registration does not yet prove the created record through a canonical detail postcondition before showing success. This audit is discovery-only; no source, contract, API, database, RLS, Storage, or security code was changed.

## Scope and evidence

Reviewed:

- `src/modules/student-documents/presentation/StudentDocumentsPortal.tsx`
- `src/modules/student-documents/application/StudentDocumentService.ts`
- `src/modules/student-documents/infrastructure/StudentDocumentRepository.ts`
- `src/modules/student-documents/domain/types.ts`
- `server.ts` Student Documents routes
- `src/__tests__/studentDocumentsPortal.test.tsx`
- `src/__tests__/stuAffairsP1DocumentsResponsive.test.ts`
- `src/__tests__/stuAffairsP1DocumentsActionCapability.test.ts`
- `docs/student-platform/stu-affairs-p1-006-60-validation.md`

The mounted Student Affairs route uses `StudentDocumentsPortal`. The legacy-looking components `src/components/student-affairs/StudentDocuments.tsx` and `src/components/StudentDocumentManager.tsx` are not imported by the mounted Student Affairs portal and were recorded as non-canonical surfaces, not modified.

## Canonical path

The active flow is:

`StudentDocumentsPortal` → authenticated/permissioned Express route → `resolveStudentTenantMiddleware` → `StudentDocumentService` → request-scoped `UnitOfWork` transaction → `StudentDocumentRepository`.

The routes reviewed are:

- `GET /api/student-document-categories`
- `GET /api/student-documents`
- `GET /api/students/:studentId/documents`
- `POST /api/students/:studentId/documents`
- `GET /api/student-documents/:id`
- `POST /api/student-documents/:id/versions`
- `POST /api/student-documents/:id/verification`
- `POST /api/student-documents/:id/archive`
- `GET /api/student-documents/:id/access-log`

## Metadata capability results

| Capability | Result | Evidence / limitation |
|---|---|---|
| Create/register metadata | **PARTIAL** | Input validation, idempotency, transaction, audit and outbox are present. The UI shows success after POST plus list reload, but does not fetch the returned `documentId` and verify canonical detail/postconditions. |
| List | **PROVEN / READY** | Canonical list route, tenant-scoped service/repository, explicit total handling, loading/error/empty states, search and filters. |
| Detail | **PROVEN / READY** | Canonical detail response supplies identity, state, versions and nullable fields; stale detail is cleared and sequence-guarded. |
| Verify | **PROVEN / READY** | Permissioned route, expected version, reason, mutation guard, canonical refresh and verified-state postcondition. |
| Reject | **PROVEN / READY** | Confirmation, reason, expected version, canonical refresh and rejected-state postcondition. |
| Expire | **PROVEN / READY** | Eligibility and legal-hold gates, confirmation, canonical refresh and expired-state postcondition. |
| Archive | **PROVEN / READY** | Eligibility/legal-hold gates, confirmation, canonical refresh and archived-state postcondition. |
| Restore | **PROVEN / READY** | Archived-only visibility, confirmation, canonical refresh and restored-state postcondition. |
| Add version metadata | **PROVEN / READY** | Version validation, expected current state, canonical refresh and strictly increased current version postcondition. |
| Access history | **PROVEN / READY** | Explicit load, retryable errors, empty state and allowlisted display fields. |
| Search / filter | **PROVEN / READY** | Server query parameters are used; no client identity or tenant values are trusted as authority. |
| Sort | **PROVEN / READY** | Deterministic sort is explicitly limited to currently loaded results and disclosed to the user. |
| Retry | **PROVEN / READY** | Retry uses read-only category/list/detail synchronization; mutation retry is not automatic. |
| Conflict semantics | **PROVEN / READY** | 409/version conflicts are surfaced and followed by read synchronization, without replaying the mutation. |
| Unknown outcome | **PROVEN / READY** | Timeout/network/canonical-refresh uncertainty does not produce success. |
| Selection/detail consistency | **PROVEN / READY** | Detail request sequencing, stale clearing, selection cancellation and canonical refresh are present. |
| Accessibility | **PROVEN / READY** | Dialog names, live announcements, alerts, focus handling, labels and keyboard cancellation are covered by source/tests. |
| Responsive behavior | **PROVEN / READY** | Bounded page, local table overflow and responsive action/form layouts are covered by the responsive contract test. |

## Findings

### P1-006-61-F01 — Registration success is not detail-postcondition verified

- **Severity:** P1
- **Classification:** PARTIAL
- **Location:** `StudentDocumentsPortal.tsx`, `submitCreate`
- **Observed behavior:** The POST result is validated and `loadDocuments()` is called. Success is then announced without a canonical `GET /api/student-documents/:id` check against the returned `documentId` and expected initial version/state.
- **Risk:** A stale/partial list response could make a committed or missing record appear successful without proving the exact created metadata.
- **Required evidence for closure:** A bounded implementation or contract decision that verifies the returned document through the canonical detail path before success, with explicit behavior for an unconfirmed outcome.
- **No fix performed:** The current order is audit-only.

### P1-006-61-F02 — List student label is contextual

- **Severity:** P2
- **Classification:** PARTIAL
- **Location:** `StudentDocumentsPortal.tsx`, `studentName(students, row.student_id)`
- **Observed behavior:** The list receives canonical `student_id`, but the visible student label is resolved from the parent `students` prop. The canonical detail view was corrected to show the canonical student identifier.
- **Risk:** A missing or stale parent student list can display a fallback identifier or contextual name that is not part of the document-list response.
- **Required evidence for closure:** Confirm that the parent student list is an approved canonical identity source for this display, or issue a bounded list-display contract/fix.
- **No fix performed:** The current order is audit-only.

## Binary and Storage boundary

The following are **NOT IMPLEMENTED** in this metadata portal and must not be inferred from metadata fields or buttons:

- Upload
- Download
- Preview
- Binary version content
- Malware scanning
- Quarantine
- Storage lifecycle
- Signed URLs
- Retention purge

The current UI explicitly states that it records metadata only and that binary/storage/OCR/scanning operations are unavailable. This is truthful for the current scope.

## Security boundary

The audit observed the existing authentication, permission and tenant middleware dependency in the route chain. It does not reimplement or recertify the general security hardening chain. No RLS, tenant, authorization, Storage or authentication change was made.

## Release conclusion

Student Documents Metadata UI is **not yet fully release-ready** because F01 prevents complete proof of registration success and F02 needs a source-of-truth decision for the visible list student label. The remaining metadata operations are classified **PROVEN / READY** within their current contracts.

No automatic P1-006-62 order is issued.
