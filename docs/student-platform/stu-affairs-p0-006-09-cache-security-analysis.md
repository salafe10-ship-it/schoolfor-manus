# STU-AFFAIRS-P0-006-09 — Authorization Cache Security Analysis

Status: `UNSAFE AS CURRENTLY KEYED — SECURITY APPROVAL REQUIRED`

## Current model

- Database role assignments are resolved using identity and scope.
- `RoleResolver` caches database assignments by `identity + school + branch` for 30 seconds.
- `AuthorizationEngine` caches the resulting permission set by `role` key.
- Middleware clears the engine cache before route authorization, but direct engine consumers can call it without that clearing step.

## Risk

`role → permission set` is not sufficient when permissions can differ by user, tenant, school, branch, time window, or database assignment. The current design creates a privilege-leakage risk for direct consumers and makes future scope-specific permissions unsafe unless the cache contract is tightened.

## Safe cache contract for approval

If caching remains enabled, the key must include at least:

`identity_id + tenant_id + school_id + branch_id + role_assignment_version/permission_revision`

The cached value must be immutable, have a bounded TTL, and be invalidated on role assignment, permission, scope, status, or session changes. Cache entries must fail closed when identity or scope is incomplete. Sensitive approval operations should use a fresh authorization decision or an explicitly versioned snapshot.

## Direct consumers

Direct calls to `authorizationEngine.can()` must either use the same safe context-aware policy and cache contract or be restricted to approved non-request contexts. Client-side helpers must never be treated as enforcement.

## Decision

`UNSAFE AS CURRENTLY KEYED — DO NOT APPROVE FOR SCOPE-SENSITIVE AUTHORIZATION WITHOUT SECURITY SIGN-OFF`.
