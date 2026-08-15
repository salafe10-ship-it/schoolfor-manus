# STU-AFFAIRS-P0-006-11 — Authorization Hardening Implementation Readiness

Status: `AUTHORIZATION HARDENING IMPLEMENTATION-READY — SECURITY APPROVAL REQUIRED`

## Scope boundary

The proposed hardening can be isolated to authorization, middleware, selected Student Affairs route declarations, and audited direct consumers. It does not require changing Results, Graduation domain data, TransferOperation, Student Read/Export implementation, Binary Storage, database schema, RLS, or production.

## Required bounded package

1. Replace or scope the role-only permission cache according to the approved cache decision.
2. Make the authorization decision consume trusted object/scope context where required.
3. Introduce only security-approved operation permissions and route bindings.
4. Preserve fail-closed behavior for missing source, scope, role, or revision.
5. Review direct `AuthorizationEngine` consumers so client helpers never become enforcement.
6. Preserve denial audit and add only approved security metadata.

## Dependencies that must be approved before implementation

- authoritative source between database assignments and static wildcard roles;
- cache revision/invalidation owner and TTL;
- operation-specific permission names and role assignments;
- maker/checker requirements;
- object-scope policy per operation;
- test/evidence strategy.

## Isolation result

`AUTHORIZATION HARDENING ISOLATABLE` from the blocked Results, Graduation, Transfer, Storage, Student Read, Export, Import, schema, and RLS workstreams. Implementation still requires explicit Security approval.
