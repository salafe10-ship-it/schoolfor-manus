# DB-001-NONACC — False-Success Audit

**Mode:** Static/read-only source audit  
**Decision:** `P1/P2 HARDENING REQUIRED — NO PROVEN LIVE P0 INCIDENT`

## Confirmed source patterns

### P1 — Attendance

`AttendanceRepository.create`, `update`, `delete`, and `saveBulk` attempt Supabase, catch or observe failure, then write `FallbackStorage` and return a record, boolean, or count. A caller can interpret this as a successful authoritative operation even though PostgreSQL was not confirmed.

### P1 — Employee and Teacher

`EmployeeRepository.saveEmployee`, `saveTeacher`, `deleteEmployee`, and `deleteTeacher` fall back after Supabase failure and return a record or `true`. This is a direct non-accounting false-success risk.

### P1 — Inventory

`InventoryRepository.save` and `delete` have the same fallback-success shape after Supabase failure.

### P1 — Document metadata

`DocumentRepository.saveMetadata` supplies an empty canonical callback and an empty fallback callback to `performWrite`. The operation is not a verified persistence operation and must not be represented as a successful saved metadata record until a real canonical writer exists.

### P2 — Configuration read ambiguity

`ConfigurationRepository.getEffectiveConfig` catches database errors and returns `null`. This can make “configuration absent” indistinguishable from “database unavailable,” causing unsafe defaults in callers unless every caller treats the result as an infrastructure error or a typed absence.

### P2 — Local validation reads

Validation and compatibility utilities directly read FallbackStorage collections. These may be acceptable for local fixtures, but they cannot certify production state or be used as an authoritative precondition for a production mutation.

## Not classified as proven P0

No mutation was executed by this audit, no live record was inspected, and no confirmed production false-success or data corruption was established. The findings are release-blocking risks based on reachable code paths.

## Required response semantics

Every configured staging/production non-accounting mutation must return one of:

- confirmed canonical success after PostgreSQL commit/read-back;
- `PERSISTENCE_UNAVAILABLE` when no write was accepted;
- `OUTCOME_UNKNOWN` when acceptance cannot be determined;
- deterministic conflict/validation failure.

It must never return a normal success from a local fallback after a canonical failure.
