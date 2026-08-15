# ACC-001-IMPLEMENTATION-004E — Server Authorization and Canonical GL Reads

## Implemented

- Financial database API routes continue to derive `schoolId` only from the verified request identity and now reject missing trusted school context.
- Financial file read/write behavior is blocked whenever canonical persistence is required; the endpoint cannot present or mutate a local JSON file as production financial data.
- Journal and account repository reads fail closed before local fallback data can be returned in canonical mode.
- Trial balance, journal audit, and accounting-period validation fail closed until their canonical database read contracts are available.
- Explicit local compatibility mode remains available for isolated development only.

## Security Boundary

Authentication, permission checks, and tenant validation remain mandatory middleware. No client-provided school or tenant value is accepted as the financial scope. No SQL, migration, RLS, RPC, or production database object was changed.

## Remaining Dependency

Canonical accounting reads still require approved PostgreSQL repository contracts and deployed accounting tables. Until that dependency is approved and available, the system refuses to report local values as authoritative.
