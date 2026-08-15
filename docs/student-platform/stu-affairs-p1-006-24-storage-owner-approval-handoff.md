# STU-AFFAIRS-P1-006-24 — Student Document Storage Owner Approval Handoff

## Scope

Decision handoff only. This document does not create a bucket, storage policy, SQL, migration, RLS rule, API, UI, database object, or environment change.

## Official status

`P1-006-24 = STORAGE DECISION HANDOFF COMPLETE — IMPLEMENTATION BLOCKED UNTIL SECURITY/OPERATIONS/SCHEMA APPROVAL`

## Baseline

The earlier P1-006-08 and P1-006-09 packages proposed a private Supabase Storage boundary for Student Affairs documents. The proposals are not live configuration and are not authorization to implement.

## Proposed standard for approval

| Area | Proposed decision | Current status |
|---|---|---|
| Provider | Supabase Storage in the canonical Supabase project | UNDECIDED / APPROVAL REQUIRED |
| Bucket | One private bucket named `student-documents-private` | UNDECIDED / NOT CREATED |
| Visibility | Private only; no public URLs | UNDECIDED |
| Ownership | Storage object belongs to one immutable document version | UNDECIDED / SCHEMA APPROVAL REQUIRED |
| Key hierarchy | Server-derived tenant/school/branch/student/document/version identifiers | UNDECIDED |
| Browser authority | Browser cannot choose bucket, tenant path, object key, or verification state | PROPOSED SECURITY STANDARD |
| Upload | Prepare intent → quarantine → scan → validate → finalize | UNDECIDED |
| Verification | Only server-side finalization can mark a version verified | UNDECIDED |
| Delivery | Exact-object short-lived signed URL or controlled server stream | UNDECIDED / SECURITY+API |
| Scan | Malware/content scan before verified/finalized state | UNDECIDED / SECURITY+OPERATIONS |
| MIME and magic bytes | Declared MIME is advisory; detected bytes and allow-list decide | UNDECIDED / SECURITY |
| Size | Initial proposal 25 MiB unless document-class policy overrides | UNDECIDED / DATA PROTECTION |
| Retention | Policy-defined; no duration inferred | UNDECIDED / COMPLIANCE |
| Legal hold | Blocks purge and destructive lifecycle | UNDECIDED / COMPLIANCE |
| Purge | Restricted, approved, audited Operations/Security action | UNDECIDED |
| Orphans | Reconciliation worker; no automatic deletion without policy | UNDECIDED / OPERATIONS |
| Failure compensation | Compensating cleanup plus reconciliation; DB rollback cannot roll back remote storage | UNDECIDED / OPERATIONS |
| Versioning | Immutable document versions; replacement creates a new version | UNDECIDED / DOMAIN+SCHEMA |
| Idempotency | Required for prepare/upload/finalize/retry commands | UNDECIDED / API+OPERATIONS |
| Encryption | Provider encryption at rest and TLS; application-layer encryption by data class decision | UNDECIDED / SECURITY+DATA PROTECTION |

## Owner questions

### Security

- Approve private visibility and trusted server-derived object keys.
- Approve quarantine, scan, magic-byte, MIME, size, archive, legal-hold, and delivery controls.
- Decide whether regulated document classes require application-layer encryption.
- Approve storage policy design based on trusted JWT/app metadata and server context only.

### Operations

- Own bucket provisioning after approval.
- Select and operate the malware/content scanner.
- Own reconciliation, retry, dead-letter, alerting, purge, and evidence collection.
- Define RTO/RPO and recovery evidence for binary objects.

### Schema / Architecture

- Approve the separate `storage_object` concept linked to a document version.
- Approve cardinality, uniqueness, deletion rules, retention fields, legal-hold fields, and migration order.
- Confirm that business document/version remains the source of truth.

### API / Domain

- Approve prepare-upload, finalize-upload, delivery, archive, restore, purge, idempotency, version, and error contracts.
- Define the document-class allow-list and business ownership.

## Hard constraints until approval

- No bucket creation.
- No storage policy.
- No service-role key in the browser.
- No client-selected bucket or object path.
- No public URL.
- No object marked verified from client state.
- No upload or delivery API implementation.
- No migration or storage schema implementation.

