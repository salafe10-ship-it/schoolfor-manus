# ARCH-004 — Repository Integration Roadmap

Status: Architecture roadmap for CTO review

Purpose: Integrate the independent local and GitHub repository lineages without rewriting `main`, bypassing security, or transferring unreviewed files.

This roadmap authorizes planning and review only. It does not authorize implementation, migration execution, force-push, unrelated-history merge, or production deployment.

## 1. Fixed integration rules

- `origin/main` remains the official GitHub history and is never force-pushed.
- Every integration unit is a reviewed package, not an arbitrary file copy.
- Each package has one canonical owner, explicit adapters, and a rollback point.
- No package may create a second authentication, authorization, tenant, transaction, repository, or audit path.
- Each package is integrated on a branch created from the current `origin/main`.
- Each accepted package is delivered through a normal Pull Request into `main`.
- A package cannot proceed while its dependency gate, tests, or security review is incomplete.

## 2. Integration sequence

| Phase | Package | Purpose | Depends on | PR target |
|---|---|---|---|---|
| 0 | Lineage and schema inventory | Freeze references and identify duplicate ownership | ARCH-001 to ARCH-003 | Review only |
| 1 | Canonical Core contracts | Establish ownership and adapter boundaries | ARCH-003 | `main` |
| 2 | Trusted Security | Authentication, session, authorization entry point, tenant guard | Phase 1 | `main` |
| 3 | Transaction Infrastructure | PostgreSQL driver, Unit of Work, request scope, rollback | Phase 1 and Phase 2 | `main` |
| 4 | Repository Adapters | Move approved remote repositories behind canonical contracts | Phase 2 and Phase 3 | `main` |
| 5 | Student Platform | Port SOP-001 and approved complementary Student capabilities | Phase 4 | `main` |
| 6 | Live Certification | Staging tests, Render verification, operational sign-off | Phase 5 | Release review |

The sequence is intentionally dependency-ordered. Student code cannot be integrated before trusted identity, tenant validation, authorization, and real PostgreSQL transaction boundaries are available.

## 3. Phase 0 — Lineage and schema inventory

Deliverables:

- current `origin/main` commit and tree inventory;
- local certified commit inventory;
- canonical component matrix;
- duplicate table and migration map;
- list of remote capabilities that are complementary versus overlapping;
- explicit decision for every overlapping schema and domain owner.

Acceptance criteria:

- no unreviewed duplicate table owner;
- no migration is classified as safe merely because it compiles;
- all remote Student, Guardian, Tenant, Authorization, and transaction artifacts are mapped.

Required evidence:

- `git merge-base` result;
- tree presence matrix;
- dependency graph;
- schema name and ownership map.

## 4. Phase 1 — Canonical Core contracts

Scope:

- canonical identity contract;
- authorization engine contract and policy-provider extension point;
- tenant context and guard contract;
- transaction driver and repository transaction contract;
- append-only audit and outbox contract;
- package ownership and adapter rules.

Acceptance criteria:

- one owner per core capability;
- no endpoint imports a remote authorization or transaction entry point directly;
- adapters have no authority to replace trusted identity or tenant context;
- ADR is present for any change to a canonical owner.

Tests:

- contract shape/type checks;
- forbidden dependency/import scan;
- canonical-owner uniqueness check;
- documentation completeness review.

## 5. Phase 2 — Trusted Security package

Scope:

- Supabase password verification and trusted identity;
- session validation, refresh, expiration, restoration, and logout;
- canonical authorization entry point;
- policy-provider adapter for approved remote policies;
- tenant resolution, tenant validation, branch context, and academic-year context;
- trusted denial audit hooks.

Acceptance criteria:

- client cannot choose user, role, tenant, school, branch, or academic year;
- missing, invalid, expired, or corrupted sessions fail closed;
- unknown permissions and invalid roles return denial;
- cross-tenant and cross-branch targets are rejected;
- authorization and tenant denials each produce one canonical audit event.

Mandatory tests:

- wrong password, missing password, disabled user;
- invalid school, invalid role, invalid refresh token;
- session expiration, refresh, restoration, logout, browser refresh;
- allowed permission, missing permission, unknown permission, invalid role;
- tenant spoofing, missing tenant, cross-school, cross-branch;
- concurrent sessions and cache separation.

## 6. Phase 3 — Transaction Infrastructure package

Scope:

- PostgreSQL pool and transaction driver;
- request-scoped Unit of Work;
- parameterized repository commands;
- explicit begin, commit, rollback, and release;
- statement timeout and connection-failure handling;
- adapter boundary for remote repositories.

Acceptance criteria:

- no static shared transaction context;
- no nested or cross-request transaction reuse;
- every failure rolls back;
- commit happens only after all commands succeed;
- every connection is released;
- transaction tenant context is validated before writes.

Mandatory tests:

- commit;
- rollback before persistence;
- failure during each persistence step;
- connection failure;
- concurrent requests with independent sessions;
- nested transaction rejection;
- repeated commit and rollback rejection;
- parameterized command enforcement;
- timeout and connection release.

## 7. Phase 4 — Repository Adapters package

Scope:

- review remote Student, Guardian, admission, lifecycle, and shared repositories;
- classify each as retain, adapt, retire, or defer;
- adapt approved repositories to canonical tenant and transaction contracts;
- preserve domain behavior without copying duplicate infrastructure;
- define repository-level audit and concurrency behavior.

Acceptance criteria for each repository:

- canonical tenant context is mandatory;
- repository cannot execute without an active transaction where a write is involved;
- all write parameters are bound, not interpolated;
- client audit metadata is ignored;
- soft-delete and version behavior is explicit;
- foreign-key and schema ownership is documented;
- unit and integration tests exist.

Mandatory tests:

- tenant isolation read, update, and delete;
- missing context;
- optimistic-concurrency conflict;
- rollback after repository failure;
- duplicate prevention;
- audit metadata spoofing;
- large-result pagination and query plans where applicable.

## 8. Phase 5 — Student Platform package

Scope:

- port the certified SOP-001 Student Registration package;
- integrate only approved complementary remote admission/lifecycle capabilities;
- resolve duplicate Student, Guardian, enrollment, and audit schema ownership;
- validate migration order and deployment safety.

Acceptance criteria:

- SOP-001 has one canonical registration owner;
- registration uses trusted identity, tenant context, authorization, and one transaction;
- no duplicate Student or Guardian workflow is active;
- all required dependencies exist on the integration branch;
- TypeScript, unit, integration, regression, and production build checks pass;
- migration dry-run and staging execution are approved separately.

Mandatory tests:

- valid registration;
- duplicate student prevention;
- guardian matching;
- invalid tenant and client spoofing;
- audit metadata spoofing;
- partial failure at every write step;
- rollback and concurrent registration;
- idempotent retry;
- full existing regression suite.

## 9. Phase 6 — Live certification

Prerequisites:

- all preceding PRs merged and reviewed;
- working tree and branch state verified;
- staging database backup and rollback plan approved;
- environment variables verified without exposing secrets;
- Render deployment source and branch verified.

Required evidence:

- deployment commit and remote HEAD;
- Render deployment status;
- database migration result;
- live authentication and authorization checks;
- tenant isolation tests;
- transaction commit, rollback, concurrency, and release tests;
- SOP-001A live test report.

Release gate:

- any P0/P1 security, tenant, transaction, or data-integrity failure blocks release;
- failed live checks stop the sequence and trigger rollback;
- no business module is activated before the infrastructure certificate is renewed.

## 10. Rollback strategy

- A failed package PR is closed or reverted without rewriting `main`.
- Database migrations are applied only after a migration-specific rollback plan is approved.
- A package branch remains available for forensic comparison until CTO sign-off.
- No rollback uses `git reset --hard`, force-push, or deletion of remote history.
- Runtime rollback uses the last certified deployment artifact.

## 11. Required governance records

Each phase must provide:

- package scope and file matrix;
- canonical owner and adapter matrix;
- dependency graph;
- security and tenant review;
- test results;
- migration impact and rollback plan;
- PR link and reviewer decision;
- final CTO status.

## Final roadmap decision

The safe path is:

`Canonical Core → Trusted Security → PostgreSQL Transactions → Repository Adapters → Student Platform → Live Certification`

No SOP-001 transfer, schema migration, or production deployment is authorized until the preceding package gate is accepted.
