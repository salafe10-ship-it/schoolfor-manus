# STU-AFFAIRS-P0-002E — Migration Boundary

## Existing schema used by the design

The approved Enrollment migration already provides `enrollments`, `enrollment_transfers`, and `enrollment_history`, with tenant-scoped foreign keys, transfer row idempotency, status checks, history immutability grants, and reporting indexes.

## No migration in this mission

No SQL, migration, RLS, RPC, trigger, function, view, seed, or live database change is authorized here.

## Potential future dependencies (not approved)

1. A durable batch idempotency/result store if the existing platform does not provide one.
2. Any missing composite constraint needed to represent the approved destination semantics.
3. A verified canonical mapping from legacy placement fields to Enrollment records.
4. Any audit/outbox linkage required by the final application service.

Each item must be confirmed against the real staging schema and approved as a separate migration mission if needed. No design assumption here is evidence that staging has applied the migration; `PLATFORM-EVIDENCE-002` remains closed and blocked.

## Ordering if separately approved

`business decisions → transaction composition architecture → persistence/idempotency schema decision → migration (if needed) → repository/application implementation → API/UI migration → tests → Operations evidence`.

Skipping an earlier gate is prohibited.
