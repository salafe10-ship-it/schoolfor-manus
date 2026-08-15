# Student Affairs P1-006-07 — Binary Document Storage Contract

## Contract status

This is an architecture contract only. It is not implemented. No bucket, policy, schema, API, upload flow, or UI behavior is created by this document.

## Separation of concerns

`student_documents` and `student_document_versions` remain the source of truth for business metadata, lifecycle, approval, retention, legal hold, and audit state. A storage object is an external binary artifact referenced by a document version. A database transaction must never claim a verified document version before the object has been durably created and passed the required checks.

## Provider and bucket

- Proposed provider: the project’s private Supabase Storage instance.
- Proposed canonical private bucket: `student-documents-private`.
- The bucket must not be public.
- The bucket name must be a server-side constant/configuration value; clients must never choose a bucket.
- Bucket creation and policy deployment require a separate approved Storage/Security operation.

## Server-derived object key

The server derives the object key from trusted identity and the document aggregate:

```text
tenant/{tenantId}/school/{schoolId}/branch/{branchIdOrGlobal}/student/{studentId}/document/{documentId}/version/{versionId}/{safeFileName}
```

`tenantId`, `schoolId`, `branchId`, `studentId`, `documentId`, and `versionId` must come from validated server-side context and database records. The client may provide display metadata only; it may not provide a bucket, tenant segment, school segment, branch segment, or arbitrary object path.

## Upload contract

1. Authenticate the caller.
2. Resolve session, authorization, and tenant context in the existing order.
3. Validate that the student and document category belong to the trusted tenant/school/branch scope.
4. Validate content type, file size, filename, and document policy before allocating an object.
5. Issue a short-lived, server-authorized upload capability or stream through a server endpoint; never expose storage credentials.
6. Write to a quarantine state until object existence, checksum, size, MIME signature, and malware scan are verified.
7. Persist the storage reference and verified version metadata only after verification succeeds.
8. Emit audit and outbox records with request and correlation IDs.
9. On any database failure after object creation, run compensating object cleanup and record the failure; database rollback alone cannot roll back an external object.

## Content rules

The initial policy should use an explicit allow-list rather than extension trust. The implementation must validate magic bytes and declared MIME type, reject executable/script content and archive formats unless a later policy explicitly permits them, and normalize filenames server-side.

Recommended initial limit: 25 MiB per object, subject to CTO/product approval and document-class overrides. The current metadata payload limit is not a binary upload approval and must not be reused as a storage limit.

Filename normalization must strip path components, reject `/`, `\\`, `..`, control characters, and ambiguous executable suffixes, and use server-generated IDs as the security boundary.

## Download and preview contract

- Every download or preview requires authentication, permission, trusted tenant validation, and a current document/version check.
- No public URL may be stored or returned as a permanent access mechanism.
- Preferred delivery is a short-lived signed URL or server-side stream. A five-minute signed URL is a proposed starting point, not a live configuration.
- Download, preview, denial, expiry, and legal-hold decisions must be audit events.
- A signed URL must be generated only after the server has checked the document row; clients must never sign arbitrary paths.

## Security and privacy

- Provider encryption at rest and transport encryption are required.
- Regulated document classes may require application-layer encryption; that decision belongs to the Security/Data Protection review.
- Storage policies must use trusted JWT/app metadata and server tenant context. They must not trust request headers, body fields, local storage, or client-selected paths.
- Service-role credentials must remain server-only and must never be sent to React or the browser.

## Lifecycle and retention

- A document archive or soft delete changes business visibility and records the actor; it does not silently destroy the object.
- Legal hold blocks purge and records the reason.
- Restore must restore metadata visibility only after the object is confirmed to exist and remains in the correct tenant path.
- A scheduled reconciliation job must identify missing objects and orphan objects. It must quarantine or report them before deletion.
- Final purge requires retention expiry, no legal hold, explicit authorization, an audit event, and a recoverable operational record.

## Required metadata relation

Before implementation, the schema/API design must approve a provider reference containing at least: document ID, document version ID, provider, bucket, object key, checksum, byte size, detected MIME type, scan status, verification time, creation time, deletion time, and retention/legal-hold state. This is a design requirement, not a request to alter the schema in this mission.

## Failure model

Storage and database operations are separate systems. The implementation must use explicit states (`pending`, `quarantined`, `verified`, `rejected`, `deleted`) and compensating cleanup/reconciliation rather than pretending a database transaction can atomically roll back a remote object.

## Approval gate

Implementation requires explicit approval for Storage, Security, API, and schema changes. Until those approvals exist, Student Affairs remains metadata-only and this contract remains unimplemented.

