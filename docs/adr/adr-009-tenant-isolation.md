# ADR 009: Tenant Isolation

## Context
The application must ensure absolute tenant isolation. Users belonging to one school must never be able to access, modify, or query data belonging to another school.

## Decision
1. **Authentication Enforcement**: All requests must be authenticated via JWT, which includes an immutable `school_id` derived from the server-validated token.
2. **Mandatory Filtering**: Every repository method that interacts with the database *must* accept `schoolId` as a mandatory parameter and apply it as the primary `WHERE` clause filter in all SQL queries.
3. **Prohibition**: Cross-school joins and queries without a `school_id` filter are strictly prohibited.
4. **Middleware Validation**: The `authenticateRequest` middleware will block any request that attempts to override the `schoolId` with a different value from the one embedded in the JWT.

## Alternatives
- Row-Level Security (RLS) at database level (Rejected for now: adding complex infrastructure before enforcing application-level discipline).
- Shared database with no isolation (Rejected: unacceptable security risk).

## Consequences
- Requires strict adherence by all developers to pass `schoolId` to every repository method.
- Provides high confidence in data segregation.

## Future Impact
Allows future migration to physical database segregation (one DB per tenant) without changing repository signatures.
