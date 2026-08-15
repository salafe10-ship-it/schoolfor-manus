# DB-001-NONACC-013 — Report/BI Read Fail-Closed

**Mission:** `PROGRAM-RELEASE-P0-002 / DB-001-NONACC-013`  
**Mode:** Bounded code hardening  
**Scope:** The ReportRepository and BIRepository read paths proven by DB-001-NONACC-008.

## Root cause

Report and BI detail reads fell through to `FallbackStorage` after failed Supabase queries. A stale local definition or KPI could therefore resolve as a successful read.

## Implementation

- Routed `ReportRepository.getDefinition` and `BIRepository.getKpi` through existing `FallbackStorage.performRead`.
- Canonical query errors now propagate through existing `assertCanonicalPersistence`/`PERSISTENCE_UNKNOWN` behavior.
- Successful no-record detail reads remain `undefined`, preserving the current return contract.
- No response contract, service contract, retry, source of truth, schema, RLS, tenant, authorization, or central FallbackStorage change was made.
