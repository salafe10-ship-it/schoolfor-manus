# DB-001-NONACC-017 — Remaining Legacy Read Fail-Safe

## Scope

This bounded hardening covers only read paths proven by DB-001-NONACC-008 in:

- `StudentContactRepository`
- `AttendanceRepository`
- `EmployeeRepository`
- `InventoryRepository`

`StudentContactRepository` is included because its existing canonical path was sufficient for the bounded fail-closed change; no new privacy or legal contract was introduced.

Writes previously contained by DB-001-NONACC-001 were not changed or reopened.

## Result

- Canonical success returns canonical data.
- Canonical empty preserves the existing `null`, `[]`, or boolean-empty contract.
- Canonical failure propagates through `FallbackStorage.performRead`.
- Stale local fallback is never returned as a successful canonical result.
- Existing school scope and query filters are preserved.
- No retry, API contract, schema, source-of-truth, tenant, or authorization change was introduced.

## Files Changed

- `src/database/repositories/StudentContactRepository.ts`
- `src/database/repositories/AttendanceRepository.ts`
- `src/database/repositories/EmployeeRepository.ts`
- `src/database/repositories/InventoryRepository.ts`
- `src/__tests__/db001Nonacc017StudentContactAttendanceEmployeeInventory.test.ts`

## Boundaries

No database, SQL, RLS, migration, schema, storage, authentication, authorization, tenant, staging, or production operation was performed. `FallbackStorage` was not modified centrally.
