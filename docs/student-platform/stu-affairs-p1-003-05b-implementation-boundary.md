# STU-AFFAIRS-P1-003-05B — Implementation Boundary

## Authorized Scope

This mission was discovery and architecture only. The following are the only implementation boundaries identified for a later, separately authorized mission:

1. Add the approved durable command/idempotency storage contract for `student_import`.
2. Add a transaction-aware import application orchestrator that owns exactly one `UnitOfWork`.
3. Reuse canonical registration validation and repository rules through internal transaction-aware participants, without calling the public transaction-owning registration method per row.
4. Add an explicit Student Import permission check using the existing authorization service. Do not redesign the authorization engine.
5. Add the approved batch response replay and result contract.
6. Add tests for same-key replay, same-key/different-payload conflict, concurrent claims, crash/lease recovery, all-or-nothing rollback, duplicate prevention, tenant isolation, audit durability, and outbox atomicity.

## Explicitly Out of Boundary

- No implementation of `POST /api/students/bulk`.
- No Student Import UI or file-upload flow.
- No Batch Transfer implementation.
- No changes to `UnitOfWork`, `TenantEngine`, `AuthorizationEngine`, authentication, RLS, or shared migration architecture under this mission.
- No schema, migration, SQL, RPC, trigger, function, seed, or live database change under this mission.
- No production or live PostgreSQL certification.

## Safe Dependency Order

1. Approve command-store semantics, retention, lease, and replay rules.
2. Approve the transaction-aware participant interface and permission name.
3. Implement and test the durable command claim/result path.
4. Implement the import orchestrator around one request-scoped transaction.
5. Add API contract and only then connect an import UI.
6. Run staging transaction, concurrency, tenant, audit, and outbox tests.

## Boundary Decision

**STOP + DEPENDENCY.** The current repository contains enough transaction primitives for a safe design, but not enough durable command state for a production-grade import implementation.

