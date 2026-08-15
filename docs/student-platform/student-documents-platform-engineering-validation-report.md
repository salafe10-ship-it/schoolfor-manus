# Enterprise Student Platform - Student Documents & Attachments Platform

Mission: EWP-005  
Scope: `student_documents`, `student_document_versions`, `student_document_categories`, and `student_document_access_log` only.

## Mission Boundary

This package owns student document metadata, configurable category assignment, immutable version metadata, lifecycle and retention metadata, classification, and access-log references.

It intentionally does not own binary content, object storage, upload transport, virus scanning, OCR, external storage providers, employee documents, finance attachments, examination files, or generic document management.

Previous packages EWP-001 through EWP-004 are unchanged.

## Domain and Dependency Review

| Table | Responsibility | Aggregate role | Direct dependencies |
| --- | --- | --- | --- |
| `student_document_categories` | Tenant-configurable category catalog | Reference entity | `tenants`, trusted `users`, `audit_events` |
| `student_documents` | Current document metadata and lifecycle | Aggregate root | `tenants`, `schools`, `branches`, `students`, categories, trusted `users`, `audit_events` |
| `student_document_versions` | Immutable revision metadata | Child entity | `student_documents`, student scope, trusted `users`, `audit_events` |
| `student_document_access_log` | Append-only access references | Append-only record | document/version records, student scope, trusted actor, `audit_events` |

All foreign keys use `RESTRICT`; no cascade can silently orphan regulated document metadata. Tenant ownership is present on every relationship. School, branch, and student scopes are independently represented so later RLS and service guards can enforce the same context without a schema redesign.

## Static SQL Validation

- Exactly four `CREATE TABLE` statements are present.
- Four UUID primary keys are present and all use `gen_random_uuid()` defaults.
- No RLS, RPC, trigger, view, policy, seed, binary-storage, OCR, or external-provider statement is present.
- No data insertion or mock data is present.
- All four tables carry request/correlation context where applicable; the append-only access log carries both directly.
- Version, audit, retention, legal-hold, classification, lifecycle, and soft-delete metadata are present where applicable.
- No previous package file is modified by this mission.

## Dependency Validation

Execution order:

1. Core Foundation
2. Identity Platform
3. Governance Platform
4. Student Platform Foundation
5. Guardian Platform
6. Enrollment Engine
7. Academic Status Engine
8. Student Documents & Attachments Platform

Required existing objects:

- `tenants`
- `schools`
- `branches`
- `users`
- `audit_events`
- `students`

Internal dependency order is categories, documents, versions, then access log. No circular foreign-key dependency is introduced. Version-to-document consistency and current-version promotion remain request-scoped Unit-of-Work responsibilities because triggers and database functions are explicitly outside scope.

## Constraint Validation

- Primary keys: 4.
- Foreign keys: 34, all tenant-scoped and `RESTRICT` on update/delete.
- Unique constraints: 7.
- Check constraints: 30.
- Categories require a trimmed non-empty code and name, with tenant-unique codes.
- Document lifecycle and verification statuses are constrained independently.
- Classification is constrained to `public`, `internal`, `confidential`, `restricted`, or `highly_confidential`.
- Version numbers are positive and unique per tenant/document; access-log version references are constrained to the same document.
- Only one non-deleted current version is allowed per tenant/document.
- Version rows cannot be soft-deleted and application roles cannot update or delete them.
- Access-log rows require a trusted creator reference and are protected from update/delete for application roles.
- Retention and archive eligibility dates cannot be contradictory.
- Legal hold is represented explicitly; production purge is intentionally not supported by this package.

## Index and Performance Review

Every index has a distinct query purpose:

| Index | Reason |
| --- | --- |
| `uq_student_document_versions_current` | Enforces and resolves the single current version per document without scanning history. |
| `idx_student_document_categories_lookup` | Tenant category lists filtered by lifecycle and ordered for configuration screens. |
| `idx_student_documents_student_lookup` | Primary student document lookup by tenant, school, branch, student, and lifecycle. |
| `idx_student_documents_category_lookup` | Category-based document filtering and reporting. |
| `idx_student_documents_verification_queue` | Verification work queues by school/branch and verification status, excluding archived rows. |
| `idx_student_documents_expiration_reporting` | Retention and archive-eligibility reporting while excluding legal-hold rows. |
| `idx_student_document_versions_history` | Fast version history ordered newest first. |
| `idx_student_document_access_log_document` | Document access timeline lookup ordered by occurrence. |
| `idx_student_document_access_log_actor` | Security and support investigation by actor and time. |

There are 9 indexes in total, including 1 partial unique index. No index duplicates a primary key or unique constraint, and no JSON, full-text, or low-selectivity index is introduced.

## Lifecycle and Immutability Review

- Category lifecycle: active → inactive → archived.
- Document lifecycle: draft → pending verification → verified → expired → archived.
- Verification status is independent from lifecycle and storage.
- A new revision inserts a new version row; existing versions are never updated.
- The current version is identified by `is_current`; the partial unique index permits only one current row.
- Access log rows are append-only and record actor, action, result, reason, request, correlation, and occurrence time.
- Soft deletion is allowed for categories and document metadata only when the row is archived and deletion metadata is complete.
- Physical deletion of production document metadata is not part of this package.

## Security and Supabase Review

- No RLS or policies are implemented, as directed.
- The schema is prepared for future RLS through tenant, school, branch, and student columns plus tenant-scoped foreign keys.
- Client-provided actor, audit, tenant, and scope values must be replaced by trusted server identity/context in the future service layer.
- No file bytes, storage keys, provider tokens, or external URLs are stored.
- `REVOKE` statements protect immutable versions and access logs from application-role update/delete/truncate operations.
- Future implementation must write document mutation, version promotion, audit event, and outbox event in one request-scoped transaction.

## Future Scalability Review

### Data Growth

- At 1 million document rows, the tenant-first partial indexes support operational lookup without indexing archived metadata.
- At 10 million version rows, the tenant/document/version index supports bounded history reads; access logs should be time-windowed in operational queries.
- At 100 million access-log rows, partitioning by time with tenant-local indexes should be evaluated before operational latency degrades.

### Partition Strategy

No partition is introduced in this migration. `student_document_access_log` is the first candidate for time-range partitioning; document and version partitioning should be considered only after measured volume and retention requirements justify it.

### Archiving Strategy

Archived metadata remains queryable. Legal-hold rows are excluded from archive-eligibility reporting. A future governed archival process may move immutable historical metadata to an archive tier without deleting the source-of-truth record.

### Search Strategy

Operational search uses exact identifiers, category, lifecycle, verification, and tenant/school/student scope. Full-text search is deliberately deferred until search terms and language requirements are known.

### Reporting Strategy

Operational reports use the listed tenant-first composite indexes. Cross-domain reporting should consume governed read models or reporting pipelines later; this migration creates no views or materialized views.

### Backup and Restore Impact

The package adds metadata only and no external storage dependency. Database backup covers metadata and hashes, while any future binary provider must have an independently governed retention and restore plan. Point-in-time restore must preserve append-only version and access-log ordering.

### Operational Risk

The main operational risks are service-layer failure to promote exactly one current version, inconsistent document/student scope values, and unbounded access-log growth. These are explicit future Unit-of-Work, tenant-validation, and partition/retention responsibilities rather than hidden database behavior.

## Validation Gate

Static SQL validation is required before review. Database execution is not performed by this mission unless separately authorized. PostgreSQL compatibility is based on UUID, partial indexes, composite foreign keys, check constraints, `REVOKE`, and standard temporal types only.

## Performance Targets

- Student document lookup p95: ≤ 300 ms.
- Document history lookup p95: ≤ 500 ms.
- Document registration p95: ≤ 800 ms.
- Current-version lookup p95: ≤ 250 ms.

## Status

READY FOR CTO REVIEW
