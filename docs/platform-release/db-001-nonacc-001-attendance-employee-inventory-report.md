# DB-001-NONACC-001 — Attendance / Employee / Inventory Persistence Containment

**Mission:** `PROGRAM-RELEASE-P0-002 / DB-001-NONACC-001`  
**Mode:** Bounded code hardening; no database or deployment mutation  
**Scope:** Attendance, Employee, and Inventory repository write paths only  
**Status:** `CODE-LEVEL CLOSED — ATTENDANCE/EMPLOYEE/INVENTORY PERSISTENCE FALSE-SUCCESS CONTAINMENT`

## Root cause

The three repositories attempted a Supabase write and, after an error or missing client, wrote to `FallbackStorage` and returned the fallback record or `true`. In a canonical Staging/Production runtime this could report persistence success without confirmed PostgreSQL persistence.

## Implemented containment

Each permitted write path now invokes the existing `FallbackStorage.assertCanonicalPersistence(...)` immediately after an unsuccessful canonical write and before any local fallback mutation:

- Attendance: create, update, delete, and bulk save.
- Employee: teacher save/delete and employee save/delete.
- Inventory: save and delete.

The existing persistence contract is preserved. In explicitly unconfigured local compatibility mode, fallback behavior remains available. When canonical persistence is required, the existing `CanonicalPersistenceError` with `PERSISTENCE_UNKNOWN` prevents a false success. No automatic mutation retry was added.

## Explicitly unchanged

- `FallbackStorage` was not modified.
- No database, SQL, migration, RLS, tenant, authorization, business-rule, accounting, notification, document, staging, or production code was changed.
- Read fallback behavior was not expanded by this mission.

## Result matrix

| Repository | Canonical success | Canonical failure + fallback reachable | Automatic retry |
|---|---|---|---|
| Attendance | Success preserved | Explicit persistence error; no success confirmation | None |
| Employee | Success preserved | Explicit persistence error; no success confirmation | None |
| Inventory | Success preserved | Explicit persistence error; no success confirmation | None |
