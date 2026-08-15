# Document Upload Wizard Contract

Mission: EWP-005

## Purpose

Capture and validate student document metadata and create a new immutable document version. The wizard does not upload binary content, call Storage, scan files, perform OCR, or contact an external provider.

## Actors and Permissions

- Authorized student affairs staff: create document metadata and versions.
- Authorized verifier: may be selected by the workflow, but identity is resolved server-side.
- Auditor: no create capability.

Required permissions: `StudentDocument.Create` and, where applicable, `StudentDocument.Version.Create`.

## Workflow

1. Confirm trusted student and tenant context.
2. Select an active configurable category.
3. Enter document metadata and classification.
4. Enter version metadata: original name, media type, size, and content hash.
5. Validate retention and legal-hold fields.
6. Submit one idempotent command.
7. Commit document/version/audit/outbox records in one request-scoped transaction.
8. Return the document reference and version number.

## Validation Matrix

| Field/rule | Requirement |
| --- | --- |
| Category | Must belong to the trusted tenant and be active. |
| Document reference | Required, trimmed, and unique within tenant. |
| Title | Required and non-empty after trimming. |
| Classification | One of public, internal, confidential, restricted, highly confidential. |
| Original name | Required metadata; no path traversal or executable interpretation. |
| Media type | Required, normalized, and validated by the future service boundary. |
| Byte size | Integer ≥ 0; bounded by deployment policy. |
| Content hash | Required integrity reference with minimum length. |
| Retention | Archive eligibility cannot exceed retention end date. |
| Legal hold | Prevents archive/purge actions while true. |
| Idempotency | Repeated request ID/idempotency key returns the original result without a duplicate version. |

## States

- Loading: context and categories are loading; submit disabled.
- Draft: fields editable and not persisted.
- Validation error: field-level messages; no command submitted.
- Submitting: one request only; duplicate submission disabled.
- Success: show document reference, version number, and next permitted action.
- Conflict: stale category/document/version; require refresh.
- Forbidden: do not reveal tenant or student details outside the trusted scope.
- Failure: show correlation ID and allow safe retry.

## Performance Budget

- Category load p95 ≤ 200 ms.
- Registration command p95 ≤ 800 ms.
- Retry behavior must be idempotent and must not create duplicate versions.

## Accessibility and Security

- Wizard steps have headings and a visible current-step indicator.
- Every field has a label, hint, and accessible error message.
- Keyboard users can move through steps without pointer-only controls.
- Client values for tenant, school, branch, actor, timestamps, and audit fields are ignored by the server.
- No sensitive document content is placed in URLs, browser storage, or analytics payloads.
