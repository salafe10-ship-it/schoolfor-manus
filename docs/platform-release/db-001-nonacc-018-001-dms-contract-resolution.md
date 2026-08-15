# DB-001-NONACC-018-001 — DMS Canonical Contract Resolution

## Decision

`DB-001-NONACC-018-001 = BLOCKED — DMS CANONICAL CONTRACT INCOMPLETE`

The evidence does not prove a production-ready `dms_documents` contract. No implementation, schema change, SQL execution, migration, Storage change, or production/staging change was performed.

## Evidence from the legacy DMS path

### `dms_documents` references

`DocumentRepository.getMetadata` reads `dms_documents` by `id` and maps only these database-shaped fields:

- `id`
- `tenant_id`
- `file_name`
- `file_size`
- `uploaded_by`
- `uploaded_date`
- `status`
- `checksum`

`DocumentRepository.saveMetadata` names `dms_documents` as its write target, but both the Supabase callback and the fallback callback are empty. Therefore no canonical write contract is implemented.

`FallbackStorage` contains a local `dms_documents_database.json` collection. This is fallback state, not proof of a database schema or an authoritative production source.

### Primary identity and tenant ownership

- Application identity consumed: `id`.
- Application tenant field consumed: `tenantId` / `tenant_id`.
- Database primary key, tenant foreign key, composite uniqueness, and RLS contract for `dms_documents`: **not proven** because no `dms_documents` table definition was found in the project migrations.

### Student relationship

No `studentId`, `student_id`, student foreign key, or student ownership invariant exists in the legacy `DocumentMetadata` contract or `DocumentRepository` mapping. The Student relationship is therefore **not proven**.

### Metadata fields

The legacy `DocumentMetadata` type has optional `description`, `tags`, and `moduleContext`, while `DocumentRepository.mapFromDatabase` ignores them. There is no proven canonical mapping for:

- title
- document reference
- description
- classification
- category
- lifecycle/status beyond the loose `status` value

### Versioning and lifecycle

`DocumentMetadata.version` is optional and `DocumentService.upload` initializes it to `1`. No `dms_documents` version table, current-version invariant, immutable version history, lifecycle state machine, or retention contract is proven.

The active Student Documents domain separately defines `student_documents.current_version_number` and `student_document_versions.version_number`. That contract must not be silently reused as a legacy `dms_documents` mapping.

## Canonical-write finding

`saveMetadata` is not a canonical write. It delegates to `FallbackStorage.performWrite`, but the Supabase write callback is empty and the fallback callback is empty. The current path cannot be certified as a database-backed DMS operation.

## Scope boundary

The active `student_documents` domain does prove a separate student-document schema with `student_id`, tenant/school/branch ownership, category, lifecycle, classification, current version, version history, audit, and access logging. This is evidence for that domain only and does not establish the missing `dms_documents` contract.

