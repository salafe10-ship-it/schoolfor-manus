# Student Affairs P1-006-07 — Binary Document Storage Discovery

## Scope

This discovery covers the storage path for binary Student Affairs documents only. It does not create buckets, upload files, change database objects, add RLS or storage policies, or modify application behavior.

## Local application evidence

- The production source under `src/` contains no Student Affairs integration with Supabase Storage, `storage.from(...)`, upload APIs, signed-URL generation, or a reusable binary-storage adapter.
- `@supabase/storage-js` is present only transitively through the Supabase client dependency; its presence does not demonstrate an application integration.
- `StudentDocumentsPortal` explicitly operates in metadata-only mode and does not upload or download binary content.
- The Student Document service and repository persist document metadata, versions, audit records, access history, and outbox records, but no provider bucket/object reference is currently persisted or verified.
- `supabase/config.toml` and the repository migration set contain no Student Affairs bucket, storage policy, or storage-object definition.
- The project examples contain no production credentials or binary-storage configuration. No real `.env` file was inspected or modified.

## Live Staging evidence

Project inspected: `edupro-school-erp-staging`

- Project ref: `vjcjscqgmijgzagshsca`
- Project URL: `https://vjcjscqgmijgzagshsca.supabase.co`
- Supabase Storage → Files displayed the empty state with `Create a file bucket` and `New bucket`; no existing bucket was listed.
- Supabase Storage → Policies displayed `Create a bucket first to start writing policies`.
- The page reported no policies under `storage.objects` and no policies under `storage.buckets`.
- No storage settings or provider configuration was changed during this inspection.

## Current canonical metadata path

The existing Student Document path is suitable for document metadata and lifecycle control:

1. The server authenticates the request and resolves trusted tenant context.
2. Student document operations execute in a request-scoped Unit of Work.
3. Document, version, audit, access-log, and outbox records are persisted atomically within the database boundary.
4. The current portal exposes metadata and lifecycle actions only.

## Findings

| Area | Finding | Status |
|---|---|---|
| Storage provider integration | No Student Affairs binary-storage adapter is implemented | Missing |
| Bucket | No Staging bucket exists | Missing |
| Storage policies | No `storage.objects` or `storage.buckets` policies exist | Missing |
| Client bucket/path selection | No upload path exists; a future path must be server-derived | Not implemented |
| Document-to-object relation | No provider object reference is present in the current path | Missing |
| Upload/download | Not available in Student Affairs | Missing |
| Scan/quarantine | No implementation found | Missing |
| Orphan cleanup | No implementation found | Missing |

## Discovery conclusion

The project has a metadata-only Student Document capability, not a binary document-storage capability. The storage dependency is not an application bug that can be safely closed inside this discovery mission: it requires an approved provider contract, private bucket and policy design, object-reference schema, API behavior, security controls, retention rules, and operational scanning/cleanup.

**Decision: STOP + STORAGE/SECURITY/SCHEMA DEPENDENCY**

