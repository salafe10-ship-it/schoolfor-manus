# ARCH-003 — Enterprise Canonical Core Contract

Status: CTO-approved architecture baseline

Scope: Authentication, authorization, tenant isolation, transactions, audit, repositories, and Student registration integration.

This document defines ownership and extension points only. It does not authorize repository merging, code copying, schema changes, migration execution, or database changes.

## 1. Canonical ownership

| Capability | Canonical owner | Remote capability | Decision |
|---|---|---|---|
| Trusted identity and session | `src/middleware/trustedAuthentication.ts` | `src/middleware/auth.ts` | Keep Local |
| Authorization entry point | `src/authorization/AuthorizationEngine.ts` | `PermissionEnforcementService` | Merge behind one engine |
| Tenant context and request guard | Local Tenant Engine and tenant middleware | `modules/shared-kernel` TenantContext | Keep Local; map remote context through an adapter |
| PostgreSQL transaction boundary | `PostgresTransactionDriver` and `UnitOfWork` | Remote static `UnitOfWork` and `TransactionService` | Keep Local |
| Repository contract | Local tenant-aware, parameterized transaction contract | Remote domain and infrastructure repositories | Merge through an adapter contract |
| Audit sink | Local trusted audit metadata, append-only audit, and outbox path | Remote AuditRepository and console logging | Merge into one trusted sink |
| Student registration | Local SOP-001 StudentRegistrationService | Remote admission and student lifecycle capabilities | Merge by domain ownership review |

There is exactly one canonical owner for every platform concern. A remote component is not a second entry point; it can only be an explicitly approved provider or adapter.

## 2. Trusted identity contract

The identity source is Supabase Auth. Password verification, session refresh, and session validation remain server-trusted operations. Role, school, branch, and academic-year claims are accepted only from trusted `app_metadata` and validated against the database.

Client body fields, query fields, headers, local storage values, and UI state never establish identity, role, school, branch, tenant, or audit ownership.

Required outcomes:

- invalid credentials, disabled users, invalid school, invalid role, missing session, expired session, and invalid refresh token fail closed;
- successful authentication produces one trusted identity object;
- remote authentication middleware may consume the canonical identity but may not create a competing identity.

## 3. Authorization contract

`AuthorizationEngine` is the only application authorization entry point.

Every protected action supplies:

- trusted identity;
- canonical permission code;
- resource and action context;
- tenant, school, branch, and request correlation context.

The local permission registry, role resolver, cache, and denial audit hooks remain the canonical path. The remote policy service may be integrated only as a policy provider behind the engine. It may not be called directly by endpoints or React components.

Unknown permissions, invalid roles, and missing permissions deny by default and produce one structured authorization audit event.

## 4. Tenant contract

The canonical tenant context is resolved from trusted identity and validated server-side. It contains tenant, school, branch, academic year, user, and role information required by the operation.

Repositories and services must receive this context before data access. A client-supplied `tenant_id`, `school_id`, `branch_id`, or academic year is a target to validate, never an identity source. Remote `command.tenantId` and request school fields require an adapter that replaces them with canonical context before use.

Tenant denial must be fail-closed, auditable, and distinguish missing context, invalid context, spoofing, cross-school access, and cross-branch access.

## 5. Transaction contract

The canonical transaction boundary is request-scoped and PostgreSQL-backed.

Required guarantees:

- one Unit of Work per business operation;
- one transaction session per request operation;
- parameterized commands only;
- explicit `BEGIN`, `COMMIT`, `ROLLBACK`, and connection release;
- rollback on every failure path;
- no process-wide mutable transaction context;
- no cross-request reuse;
- no nested transaction leakage;
- no Supabase REST sequence presented as an atomic database transaction.

Remote repositories can be retained only after they execute through this contract. The remote static UnitOfWork and sequential REST commit path are non-canonical and cannot be used for production atomic writes.

## 6. Repository contract

Every repository write must:

1. receive canonical tenant context;
2. assert the context before querying;
3. use the active transaction session;
4. issue parameterized SQL or an approved transaction command;
5. generate audit metadata from trusted identity and server time;
6. return a domain result without exposing transaction ownership to the UI.

Remote repository breadth is preserved where useful, but each repository must pass dependency, tenant, transaction, audit, and concurrency review before integration.

## 7. Audit contract

There is one append-only audit sink and one outbox path.

Audit fields are generated from trusted identity, canonical tenant context, server UTC time, request ID, and correlation ID. Client-provided creator, updater, approver, deletion, timestamp, school, tenant, and branch values are ignored.

Console logging is diagnostic only and is not an audit record. Remote audit events must be adapted to the canonical sink and must not create duplicate audit entries.

## 8. Student package contract

Local SOP-001 is the certified reference for Student Registration. It owns the atomic registration workflow, trusted context, server audit metadata, and related migration package.

Remote admission inquiry, Student, Guardian, lifecycle, and numbering capabilities remain candidates for later package-level integration. They are not interchangeable with SOP-001 and may not be enabled until schema ownership, business-rule ownership, and transaction compatibility are approved.

## 9. Extension points

Approved extension points are:

- policy provider behind `AuthorizationEngine`;
- tenant-context adapter from remote domain models to the canonical context;
- repository adapter that translates remote repository contracts to canonical transaction commands;
- audit event adapter into the append-only sink;
- domain package adapter for remote admission and lifecycle capabilities.

No extension point may bypass authentication, authorization, tenant validation, transaction ownership, or trusted audit generation.

## 10. Integration gates

No package integration may begin until all gates pass:

- canonical owner and dependency matrix approved;
- duplicate schema/table ownership resolved;
- remote alternatives mapped to adapters or explicitly retired;
- typecheck, unit tests, integration tests, and production build pass on the integration branch;
- tenant spoofing and cross-tenant tests pass;
- rollback, concurrency, and connection-release tests pass;
- exactly one authorization path and one audit sink are verified;
- normal Pull Request to GitHub `main` is possible without force-push or unrelated-history merge.

## 11. Explicit prohibitions

- force-push or history rewrite;
- `--allow-unrelated-histories` on `main`;
- random cherry-pick;
- manual file copying without package review;
- dual authentication, authorization, tenant, transaction, repository, or audit paths;
- migration or business-module execution before core arbitration gates pass.

## Architecture decision

ARCH-003 establishes the canonical contract: Local owns trusted security and PostgreSQL transaction foundations; Remote domain breadth is integrated only through reviewed adapters and package-level ownership decisions. This document does not authorize implementation or migration.
