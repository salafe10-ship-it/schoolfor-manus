# DB-001-NONACC-004 — Configuration Read Failure Semantics

**Mission:** `PROGRAM-RELEASE-P0-002 / DB-001-NONACC-004`  
**Mode:** Bounded code hardening; no database or deployment mutation  
**Decision:** `CODE-LEVEL CLOSED — CONFIGURATION READ FAILURE IS NOT TREATED AS NOT FOUND`

## Root cause

`ConfigurationRepository.getEffectiveConfig` returned `null` for every caught exception. That made a missing configuration indistinguishable from a Supabase outage, timeout, or query failure.

## Change

The existing contract is preserved for a genuine missing configuration: a successful query with no matching rows still returns `null`. When Supabase returns an error or the client is unavailable, the original error is logged and re-thrown. No new error code, fallback source, schema change, or business-rule change was introduced.

## Result

| Condition | Result |
|---|---|
| Configuration exists | Existing value is returned |
| Configuration is missing | `null` remains the not-found result |
| Supabase/query/client failure | Original error is propagated; not converted to `null` |

## Scope controls

- Only `ConfigurationRepository.ts` was changed in production code.
- No `FallbackStorage`, DB, SQL, migration, RLS, tenant, authorization, production, or staging change.
- No automatic retry or new error contract.
