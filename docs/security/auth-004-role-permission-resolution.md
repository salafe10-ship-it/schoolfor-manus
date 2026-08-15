# AUTH-004 — Role-Permission Resolution Alignment

## Scope

AUTH-004 aligns server-side effective role and permission resolution for the isolated Staging environment. It does not change authentication, tenant validation, RLS, the authorization engine, business modules, or database schema.

## Authoritative flow

1. Supabase Auth supplies the verified identity.
2. The application derives the tenant scope from that trusted identity; client headers, query parameters, and request bodies are not used to select the role assignment.
3. The server loads active `users`, `user_roles`, `roles`, `role_permissions`, and `permissions` records inside a request-scoped Unit of Work transaction.
4. `PermissionRegistry` canonicalizes and validates every database permission key.
5. `RoleResolver` uses the active database assignment as the effective role-permission set.
6. `AuthorizationEngine` remains the single permission decision point.

## Fail-closed rules

- Missing trusted identity, missing tenant identity, no active assignment, unknown role, unknown permission, and wildcard permission assignments are rejected.
- Multiple assigned roles are deterministic: role keys are normalized and sorted; effective permissions are the de-duplicated union of the validated assignments.
- A database assignment overrides the client-provided role value; the client cannot self-assign role or permission.
- The existing static role map remains only as a local/no-database-driver compatibility path for existing tests and fallback development mode. A configured live transaction driver returns an array, including an empty array, and therefore rejects missing assignments.
- The six StudentDocument permissions remain distinct and are not replaced by wildcard access.

## Scope and cache

The short-lived resolver cache is keyed by trusted identity, school, and branch. Authorization middleware clears the AuthorizationEngine's role cache before evaluating a request so one identity's effective permissions cannot be reused for another identity through the existing role-keyed engine cache.

## Database query boundaries

The loader reads only active, non-deleted records, enforces tenant joins across the role model, applies valid assignment dates, and permits only global or current-tenant permissions. It performs no schema writes and does not introduce a migration.

## Non-goals

No RLS, authentication, TenantEngine, AuthorizationEngine, Student Documents routes, business data, migrations, or production configuration were changed.
