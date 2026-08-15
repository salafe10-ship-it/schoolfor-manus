# DB-001-NONACC-014 — MDM/Integration Read Fail-Closed

**Mission:** `PROGRAM-RELEASE-P0-002 / DB-001-NONACC-014`  
**Mode:** Bounded code hardening  
**Scope:** MDMRepository.getRegistry and IntegrationRepository.getApiConfig only.

## Root cause

The MDM and Integration detail reads fell through to `FallbackStorage` after failed Supabase queries, allowing stale local registry/configuration records to resolve as successful results.

## Implementation

- Routed both read paths through existing `FallbackStorage.performRead`.
- Canonical query errors now propagate through existing `assertCanonicalPersistence`/`PERSISTENCE_UNKNOWN` behavior.
- Successful no-record reads remain `undefined`, preserving the existing method contracts.
- No API/business contract, retry, new source of truth, schema, RLS, tenant, authorization, or central FallbackStorage change was made.
