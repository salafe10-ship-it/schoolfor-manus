# DB-001-NONACC-010 — Student Document Read Fail-Closed Hardening

**Mission:** `PROGRAM-RELEASE-P0-002 / DB-001-NONACC-010`  
**Mode:** Bounded code hardening  
**Scope:** `src/database/repositories/StudentDocumentRepository.ts` read paths only.

## Root cause

The repository previously fell through to `FallbackStorage` after a Supabase detail/list query failed. Its `hasActiveDocuments` helper also converted a database error into `false`. In a canonical or staging environment these outcomes could hide persistence failure and produce stale, empty, or false-negative results.

## Implementation

- Routed `hasActiveDocuments`, `getById`, and `getAll` through the existing `FallbackStorage.performRead` contract.
- Canonical query errors now propagate through the existing `assertCanonicalPersistence`/`PERSISTENCE_UNKNOWN` behavior.
- Successful empty detail results use `maybeSingle` and remain `null`.
- Local fallback remains available only through the existing fallback policy when canonical persistence is not required.
- Write paths, `saveMetadata`, DocumentRepository, Storage/Binary, API contracts, schema, RLS, authorization, and tenant design were not changed.
- No retry or new source of truth was introduced.
