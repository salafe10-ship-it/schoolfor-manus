# DB-001-NONACC-011 — Student Assets/Library/Medical Read Fail-Closed

**Mission:** `PROGRAM-RELEASE-P0-002 / DB-001-NONACC-011`  
**Mode:** Bounded code hardening  
**Scope:** Student Asset, Student Library Account, and Student Medical Record repository read paths only.

## Root cause

The three repositories previously fell through to `FallbackStorage` after failed Supabase reads. Their helper checks also converted database errors into `false`, which could hide a canonical failure and produce a false-negative protection decision.

## Implementation

- Routed all targeted detail, student lookup, list, and helper read paths through the existing `FallbackStorage.performRead` contract.
- Canonical query errors now propagate through existing `assertCanonicalPersistence`/`PERSISTENCE_UNKNOWN` behavior.
- `maybeSingle` preserves successful no-record semantics for detail/student lookup reads.
- Existing student filters and predicates were preserved.
- Local fallback remains available only under the existing fallback policy when canonical persistence is not required.
- No Contact, Transportation, Uniform, Document metadata, Storage/Binary, schema, RLS, authorization, tenant design, retry, or central FallbackStorage change was made.
