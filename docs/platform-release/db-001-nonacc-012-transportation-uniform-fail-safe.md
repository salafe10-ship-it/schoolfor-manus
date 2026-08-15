# DB-001-NONACC-012 — Transportation/Uniform Fail-Safe Containment

**Mission:** `PROGRAM-RELEASE-P0-002 / DB-001-NONACC-012`  
**Mode:** Bounded code hardening  
**Scope:** TransportationRepository and UniformRepository legacy read/write paths only.

## Root cause

The legacy Transportation and Uniform repositories fell through to local fallback after failed Supabase reads and writes. Helper reads also converted database failures into `false`. This could expose stale/local data or return a successful-looking write result after canonical persistence failure.

## Implementation

- Routed Transportation read paths (`isRegistered`, `getById`, `getAll`) through existing `FallbackStorage.performRead`.
- Routed Uniform read paths (`hasUnpaidUniform`, `getById`, `getAll`) through existing `FallbackStorage.performRead`.
- Routed Transportation and Uniform save/delete paths through existing `FallbackStorage.performWrite`.
- Canonical errors now propagate through existing `assertCanonicalPersistence`/`PERSISTENCE_UNKNOWN` behavior.
- Successful empty detail reads remain `null`; helper failures no longer become `false`.
- Existing school filters and search/validation behavior were preserved; fallback paths now honor the existing school scope.
- No retry, new source of truth, schema, RLS, API, Tenant/Authorization redesign, or central FallbackStorage change was made.
