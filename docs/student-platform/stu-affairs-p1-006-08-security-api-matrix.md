# STU-AFFAIRS-P1-006-08 — Security and API Decision Matrix

## Status

Decision matrix only. No endpoint, policy, bucket, schema, or provider was changed.

## Trust and responsibility matrix

| Concern | Client may provide | Server must derive/verify | Client authority |
|---|---|---|---|
| Display filename | Original display name | Sanitized object suffix | None over path |
| MIME declaration | Declared MIME | Magic bytes and approved class | None over acceptance |
| File size | Claimed size | Actual byte count and maximum | None over limit |
| Tenant/school/branch | None | Authenticated identity and trusted tenant context | None |
| Student/document/version | Logical reference | Database scope and ownership checks | None over scope |
| Bucket/object key | None | Server-side constants and identifiers | None |
| Permission | None | Authorization service and permission registry | None |
| Upload capability | Request intent | Exact binding, expiry, method, size, MIME | No reuse outside binding |
| Finalization | Completion request | Object existence, checksum, scan, state transition | None over verified state |
| Download | Document/version request | Permission, tenant, state, signed capability | None over path |

## Proposed API command contracts

These are logical contracts, not routes or implementation.

### Prepare upload

Input: document category, student/document reference, declared filename, declared MIME, declared size, idempotency key.

Server checks: authentication, permission, trusted tenant context, student scope, category policy, size, MIME declaration, filename, idempotency fingerprint.

Output: an upload intent bound to one document version and a short-lived quarantine capability. It is not a verified document.

### Finalize upload

Input: upload intent ID and checksum.

Server checks: intent ownership, exact object existence, byte size, checksum, magic bytes, scan result, expiry, and version state.

Output: verified document-version result only after all checks pass. Any uncertain provider/database state is pending and must not be reported as success.

### Request delivery

Input: document ID, optional version ID, delivery purpose (`download` or `preview`).

Server checks: authentication, permission, trusted tenant context, document scope, verified state, retention, legal hold, and delivery policy.

Output: short-lived exact-object capability or controlled server stream. Permanent public URLs are forbidden.

### Archive/restore/purge

These remain business lifecycle commands. They must update document metadata and storage lifecycle state through the canonical service, record audit, respect legal hold, and delegate provider deletion/reconciliation to an approved worker. They must not directly accept a client bucket or object key.

## Permission matrix

| Operation | Required permission family | Additional checks |
|---|---|---|
| Prepare upload | Student Document upload | Student/category scope |
| Finalize upload | Student Document upload | Exact intent and scan result |
| Download | Student Document view/download | Verified version and tenant scope |
| Preview | Student Document view/preview | Safe content class and version state |
| Archive/restore | Existing Student Document lifecycle permissions | Legal hold and optimistic version |
| Purge | Restricted retention administration | Retention expiry, legal hold absent, approval |
| Reconcile | Restricted operations permission | Server worker identity and audit |

The exact identifiers must be resolved through the existing authorization registry during implementation. No role-name comparison is permitted.

## State machine decision

```text
pending → quarantined → scanning → verified → finalization_pending → finalized
                    ↘ rejected
pending ───────────→ failed
quarantined/scanning/finalization_pending ─→ failed
finalized → archived → deleted
```

`verified` means security checks passed. `finalized` means the database reference and final provider object are reconciled. No state transition may be client-selected. Legal hold can block `deleted` regardless of prior archive state.

## Idempotency and concurrency

- Mutating commands require an idempotency key scoped to tenant, actor, operation, and logical aggregate.
- Store a request fingerprint and return the prior result only for an exact match.
- Document-version changes use optimistic version checks and row locking in the canonical service boundary.
- Upload capabilities are single-purpose and expire; a retry must not create a second business version unless the original intent is terminally failed.

## Observability and audit

Every prepare, upload attempt, scan result, finalize, download, preview, archive, restore, purge, denial, retry, and reconciliation action records actor, role/permission decision, tenant/school/branch, student/document/version, object reference hash or opaque ID, request ID, correlation ID, timestamp, source, result, and reason. Secrets, signed URLs, and raw document contents never enter logs.

## API error catalog

| Code | Meaning |
|---|---|
| `DOC_STORAGE_CONTEXT_REQUIRED` | Trusted tenant or authenticated context is missing |
| `DOC_STORAGE_SCOPE_DENIED` | Student/document is outside the caller’s scope |
| `DOC_STORAGE_PERMISSION_DENIED` | Required permission is missing |
| `DOC_STORAGE_POLICY_REJECTED` | MIME, extension, size, or document policy rejected the content |
| `DOC_STORAGE_CAPABILITY_EXPIRED` | Upload/download capability expired |
| `DOC_STORAGE_OBJECT_NOT_VERIFIED` | Object is not yet verified/finalized |
| `DOC_STORAGE_SCAN_REJECTED` | Malware/content scan rejected the object |
| `DOC_STORAGE_IDEMPOTENCY_CONFLICT` | Same key was reused with a different request fingerprint |
| `DOC_STORAGE_VERSION_CONFLICT` | Optimistic version check failed |
| `DOC_STORAGE_LEGAL_HOLD` | Retention/legal hold blocks the requested operation |
| `DOC_STORAGE_RECONCILIATION_PENDING` | Provider and database state needs reconciliation |

## Approval status

All values above are proposed. The package is ready for CTO/Security/API/Schema review; it is not authorization to implement.

