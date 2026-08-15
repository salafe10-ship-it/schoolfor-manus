# DB-001-NONACC-009 — Guardian/Contact Read Fail-Closed Hardening

**Mission:** `PROGRAM-RELEASE-P0-002 / DB-001-NONACC-009`  
**Mode:** Bounded code hardening  
**Scope:** Guardian and Student Guardian read paths only. `StudentContactRepository` was inspected but has no reachable read path; it is not modified.

## Root cause

`GuardianRepository` and `StudentGuardianRepository` previously queried Supabase and, when the query failed or returned an error, fell through to `FallbackStorage`. In canonical/staging operation this could return stale/local records or an empty list as if the canonical read had succeeded.

## Implementation

- Replaced the affected Guardian and Student Guardian read fallthroughs with the existing `FallbackStorage.performRead` contract.
- Canonical query errors are thrown into the existing `assertCanonicalPersistence` path; no new error type or contract was created.
- Successful canonical empty results remain empty/`null` using `maybeSingle` for detail reads.
- Local fallback remains available only through the existing fallback contract when canonical persistence is not required.
- Existing school, tenant and branch predicates were preserved.
- No mutation, retry, schema, RLS, TenantContext, authorization, or FallbackStorage redesign was performed.

## Student Contact decision

`StudentContactRepository` is imported only by `StudentWithdrawalService` for a queued delete command. No actual read caller was found in the inspected source, so no Contact read change was authorized or made.

## Result

The targeted failure shape is now fail-closed: canonical failure cannot become fallback data followed by a successful-looking read.
