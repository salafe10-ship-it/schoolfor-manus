# STU-AFFAIRS-P1-006-08 — Binary Storage Security & API Decision Package

## Status and boundary

This package converts P1-006-07 into an architecture, security, and API decision set. It is not an implementation. It creates no bucket, storage policy, migration, SQL, RPC, API route, UI, upload, or production configuration.

## Decision summary

| Decision | Proposed standard | Implementation status |
|---|---|---|
| Provider | Private Supabase Storage for the canonical deployment | Not configured |
| Bucket | One private bucket, `student-documents-private`, with server-controlled name | Not created |
| Object visibility | Private only; no public URLs | Not configured |
| Storage reference | Separate storage-object record associated to a document version | Schema decision only |
| Upload | Server-authorized quarantine flow followed by verification and finalization | Not implemented |
| Download | Authorization-checked short-lived signed URL or server stream | Not implemented |
| Scan | Mandatory quarantine and malware/content validation before verification | Not implemented |
| Tenant path | Server-derived tenant/school/branch/student/document/version key | Not implemented |
| Retention | Soft-delete metadata, legal hold, reconciliation, controlled final purge | Not implemented |

These are proposed decisions for CTO/Security approval. They do not describe live Staging behavior.

## 1. Storage architecture

### Bucket and visibility

Use a single private canonical bucket for the Student Affairs binary boundary. The browser never chooses the bucket and never receives service-role credentials. Public access is prohibited because student documents are confidential or regulated by class.

The bucket is an infrastructure dependency. It must be created and governed in a separate approved operation after Storage Security approval; this package intentionally does not create it.

### Object key

The server derives the key from trusted context and canonical database identifiers:

```text
tenant/{tenantId}/school/{schoolId}/branch/{branchIdOrGlobal}/student/{studentId}/document/{documentId}/version/{versionId}/{serverSafeName}
```

The client cannot supply or override any scope segment, bucket, or path. `serverSafeName` is a sanitized display suffix only; UUID/ULID identifiers remain the security boundary. Object keys are opaque to the client except when returned through an authorized, time-limited delivery mechanism.

### Quarantine and finalization

1. Authenticate and validate permission.
2. Resolve trusted tenant context and student/document scope.
3. Create or reserve a document version in an upload-pending state using an idempotency key.
4. Authorize a single quarantine object under a server-derived key.
5. Validate byte count, content signature, declared MIME, extension, filename, checksum, and malware result.
6. Mark the object verified only after all checks pass.
7. Move/copy to the final key using a server-side operation, or finalize the provider object if the provider supports an atomic equivalent.
8. Persist the verified storage reference and publish the canonical audit/outbox events.
9. Reconcile any uncertain state asynchronously; never report success solely because a signed upload URL was issued.

### Orphans and cleanup

An object without a verified database reference is an orphan candidate, not an automatic deletion target. A reconciliation worker compares provider inventory to verified storage references, respects retention and legal hold, quarantines anomalies, retries transient failures, and records every action. Cleanup after a database failure is compensating cleanup; PostgreSQL rollback cannot roll back a remote object.

## 2. Upload contract

### Authorization and scope

Upload requires the existing order:

```text
Authentication → Session validation → Authorization → Tenant validation → Student scope → Document policy → Storage action
```

The permission must be a dedicated Student Document upload permission. The exact permission identifier must use the existing registry and be approved before implementation. A user’s browser role, school, branch, tenant, or request body is never authoritative.

### Content policy

The recommended initial policy is:

- Maximum object size: 25 MiB, subject to approved document-class overrides.
- Allow only explicitly approved document/image MIME classes; the implementation must publish the final allow-list before deployment.
- Validate both MIME declaration and magic bytes. Extension alone is never sufficient.
- Reject executables, scripts, active content, ambiguous polyglots, and archives unless a later security decision explicitly allows a named class.
- Normalize the filename to a base name, remove path separators and control characters, reject `..`, and generate the final object name server-side.
- Calculate and store a content checksum for duplicate detection and reconciliation.

The existing metadata payload limit is not a binary upload limit and must not be reused.

### Duplicate, version, and idempotency behavior

- The client sends an idempotency key for a logical registration/upload command.
- A repeated key returns the original command result only when its request fingerprint matches; a mismatched fingerprint is rejected as a conflict.
- Duplicate content is detected by checksum within the permitted document scope, but deduplication must not silently merge document versions with different business meaning.
- Every accepted replacement is a new immutable document version. The prior version remains auditable and subject to retention/legal hold.
- Upload states are explicit: `pending`, `quarantined`, `scanning`, `verified`, `rejected`, `finalization_pending`, `failed`, `deleted`.

### Contract shape

The future API should accept metadata and a declared content intent, not a bucket or path. The server returns an upload capability bound to the exact document/version, size, MIME class, and expiry. The server finalizes the object and is the only authority that can mark the version verified.

## 3. Download and preview contract

- Check authentication, permission, tenant context, document scope, version state, retention, legal hold, and access policy before generating delivery.
- Only `verified` objects are downloadable or previewable.
- Prefer a short-lived signed URL bound to one exact object, with a proposed initial TTL of five minutes, or server streaming when policy requires stronger control.
- Never return a permanent public URL, provider credential, arbitrary object key, or path-signing capability.
- A download/preview event records actor, tenant/school/branch, document/version, request/correlation ID, source, result, and reason.
- Expired, archived, rejected, missing, or legally held objects return an explicit non-success state according to policy; no fallback or metadata-only success is allowed.

## 4. Security controls

### Threat controls

| Threat | Required control |
|---|---|
| MIME spoofing | Magic-byte inspection plus declared MIME and extension policy |
| Executable content | Explicit deny-list and content inspection |
| Path traversal | Server-generated identifiers; reject separators, `..`, and control characters |
| Oversized payload | Enforce size before and during upload; verify actual byte count |
| Cross-tenant access | Trusted tenant context and exact object-reference scope checks |
| Unauthorized object access | Permission check before every delivery capability |
| Quarantine bypass | Separate state/key; only server-side finalization can verify |
| Replay | Idempotency key, capability expiry, exact object binding |
| Credential leakage | Browser receives only scoped short-lived capability; service role remains server-only |
| Legal-hold deletion | Purge worker checks hold state immediately before deletion |
| Malware | Mandatory scan result before verified state |

### Encryption

Provider encryption at rest and TLS in transit are required. Application-layer encryption may be required for regulated classes; that decision belongs to the Data Protection/Security owner and must not be assumed by a client implementation.

### Policies

Storage policies must be written only after the object-reference and request flow are approved. They must rely on trusted JWT/app metadata and server tenant context, never on request headers, body fields, local storage, or a client-selected path. This package does not create or alter policies.

## 5. Database relationship decision

Use a distinct storage-object concept associated to exactly one document version, while allowing a document version to have a controlled number of representations only if an approved use case requires previews or derivatives.

```text
student 1 ── * student_document 1 ── * document_version 1 ── 0..* storage_object
```

The business document/version remains the source of truth. The storage object contains provider identity and verification state, not student business meaning. The schema owner must approve the exact cardinality and deletion rules before migration.

Minimum conceptual fields: document version ID, provider, bucket, object key, checksum, byte size, detected MIME, scan status, verification state, timestamps, deletion state, retention state, and request/correlation IDs. No field or table is created here.

## 6. Failure and recovery matrix

| Failure | Required response | User-visible result |
|---|---|---|
| Database reservation succeeds, storage upload fails | Mark failed/retryable; retain audit; no verified version | Explicit upload failure |
| Storage object succeeds, database finalization fails | Compensating cleanup; reconciliation if uncertain | Not successful until finalized |
| Upload interrupted | Expire pending capability; clean quarantine candidate after policy window | Resumable/retryable only if approved |
| Scan rejected | Quarantine/reject object; retain reason and audit | Rejected, never downloadable |
| Duplicate idempotency key | Return matching prior result; reject fingerprint mismatch | Deterministic result/conflict |
| Delete fails | Keep metadata state, retry worker, alert on repeated failure | Not silently deleted |
| Signed URL generation fails | Return controlled error and audit denial | No object exposure |
| Worker fails | Retry with bounded backoff and dead-letter state | Operational alert; no false success |
| Unknown finalization state | Reconcile provider and database before retry or cleanup | Pending until proven |

## Approval gates

Implementation remains blocked until the CTO/Security/API/Schema owners approve:

1. provider and private bucket strategy;
2. exact MIME, size, scan, and retention policies;
3. storage-object relationship and migration contract;
4. upload, finalization, download, and preview API contract;
5. signed URL TTL and audit policy;
6. malware scanning and orphan reconciliation ownership.

