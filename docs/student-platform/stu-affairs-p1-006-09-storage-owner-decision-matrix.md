# STU-AFFAIRS-P1-006-09 — Storage Owner Decision Matrix

## Purpose and boundary

This is a decision handoff for the proposed Student Affairs binary-storage contract. It records ownership and approval state; it is not an implementation authorization. No source, API, SQL, migration, RLS, bucket, policy, storage object, or environment was changed.

## Status vocabulary

- `Pending`: the responsible reviewer has not provided an approval in the evidence available to this project.
- `Required`: an explicit review is required before implementation.
- `UNDECIDED`: no final decision is recorded; implementation must not infer one.
- `Proposed`: an engineering recommendation awaiting owner approval.

## Decision matrix

| Decision | Recommendation | Owner | Security | Operations | Final Status | Evidence |
|---|---|---|---|---|---|---|
| Bucket name | `student-documents-private` | Storage/Architecture | Pending | Pending | UNDECIDED | P1-006-07 live Staging evidence shows no bucket |
| Private/public | Private only; no public URLs | Security | Required | Pending | UNDECIDED | Student documents are confidential by policy class |
| Object-key model | Server-derived trusted tenant/school/branch/student/document/version hierarchy | Architecture | Required | Pending | UNDECIDED | P1-006-08 security/API package |
| Upload flow | Quarantine → scan → validate → finalize | Security/Operations | Required | Required | UNDECIDED | P1-006-08 decision package |
| MIME/magic validation | Required; extension alone is insufficient | Security | Required | Pending | UNDECIDED | P1-006-08 threat controls |
| Malware scanning | Required before verified/finalized state | Security/Operations | Required | Required | UNDECIDED | P1-006-08 threat controls |
| Delivery method | Short-lived signed URL or server stream, exact-object bound | Security/API | Required | Pending | UNDECIDED | P1-006-08 download contract |
| Maximum file size | Proposed initial value: 25 MiB, subject to policy | Product/Data Protection | Required | Required | UNDECIDED | P1-006-08 content policy |
| Allowed file types | Explicit approved MIME/signature classes | Product/Data Protection | Required | Required | UNDECIDED | P1-006-08 content policy |
| Filename sanitization | Server normalized base name; IDs define security boundary | API/Security | Required | Pending | UNDECIDED | P1-006-08 upload contract |
| Retention | No duration assumed; policy owner must define | Product/Compliance | Required | Required | UNDECIDED | P1-006-08 approval gates |
| Legal hold | Blocks purge until compliance release | Compliance | Required | Required | UNDECIDED | P1-006-08 lifecycle rules |
| Purge authority | Restricted Operations/Security action with audit | Operations/Security | Required | Required | UNDECIDED | P1-006-08 lifecycle rules |
| Orphan reconciliation | Operations-owned worker with Security review and audit | Operations | Required | Required | UNDECIDED | P1-006-08 failure/recovery model |
| Storage failure compensation | Compensating cleanup plus reconciliation; DB rollback is insufficient | Architecture/Operations | Required | Required | UNDECIDED | P1-006-08 failure model |
| Schema model | Separate `storage_object` concept linked to document version | Architecture/Schema | Required | Pending | UNDECIDED | P1-006-08 database relationship |
| Idempotency/versioning | Idempotent commands and immutable document versions | API/Domain | Required | Pending | UNDECIDED | Existing document service contract plus P1-006-08 |
| Signed capability expiry | Proposed five-minute starting point; not approved configuration | Security/API | Required | Pending | UNDECIDED | P1-006-08 delivery contract |
| Encryption at rest | Provider encryption required; app-layer encryption by data class decision | Security/Data Protection | Required | Pending | UNDECIDED | P1-006-08 security controls |

## Ownership handoff

### CTO / Architecture

Approve the provider and bucket strategy, the separate `storage_object` relationship, and the compensating/reconciliation model.

### Security / Data Protection

Approve private visibility, threat controls, MIME and malware policy, delivery mechanism, encryption requirements, retention/legal hold controls, and purge gates.

### API / Domain

Approve prepare-upload, finalize-upload, request-delivery, lifecycle contracts, idempotency, versioning, and error semantics.

### Operations

Approve provisioning ownership, scanning integration, reconciliation worker, retry/dead-letter handling, alerts, purge execution, and evidence collection.

### Product / Compliance

Approve document classes, maximum sizes, allowed content types, retention durations, and legal-hold rules. No retention duration is invented in this matrix.

## Current decision

All rows remain `UNDECIDED` until the named owners provide recorded approvals. This matrix does not convert a recommendation into a production requirement and does not authorize implementation.

**Decision: STOP + SECURITY/API/SCHEMA DECISION REQUIRED**

