# DB-001-NONACC-007 — Migration / Seed Atomicity Audit

**Mission:** `PROGRAM-RELEASE-P0-002 / DB-001-NONACC-007`  
**Mode:** Discovery/design audit only  
**External mutation:** None  
**Decision:** `OWNER DECISION REQUIRED — MIGRATION/SEED ATOMICITY POLICY`

## Migration sequence

| Step | Operation | Waits for previous step | Single transaction | Failure behavior | Retry/recovery |
|---|---|---:|---:|---|---|
| Student data | Supabase count then insert into `students` | Yes | No | Throws into outer catch; result reports `success: false` | None |
| Exam data | Supabase count then insert into `exams_database` | Yes | No | Throws into outer catch; prior student write is not rolled back | None |
| Student Affairs auxiliary | `StudentAffairsMigration.migrateAll()` | Yes | No shared boundary proven | Failure is converted to outer failure result; prior writes remain possible | None |

The count-before-insert checks are only conditional duplicate avoidance. They are not an idempotency key and are race-prone without a transaction/unique constraint contract.

## Seed sequence

`DatabaseSeeder.seedAll()` checks and inserts the following sequentially:

1. `schools`
2. `branches`
3. `teachers`
4. `employees`
5. `inventory`
6. `buses`

Each table uses an independent count query followed by an insert. No shared transaction, rollback, retry, recovery, or idempotency-key mechanism is present. If a later insert fails, `seededTables` reports the earlier successful steps and those writes may remain committed.

## Feasibility and ownership

Atomicity cannot be declared ready solely from the current source. Implementing it safely may require a transaction-capable database contract, migration/seed ownership policy, and an approved recovery/idempotency strategy. Choosing whether partial execution is acceptable is an Operations/Architecture decision.

## Required decision

Operations/Architecture must select one policy:

- one atomic transaction for each complete migration/seed run;
- atomic transaction per bounded phase with documented restart/recovery;
- intentional partial execution with explicit acceptance, idempotency, and reconciliation requirements.

No policy is chosen by this audit, and no transaction implementation is added.

The step-by-step matrix is recorded separately in `db-001-nonacc-007-migration-seed-atomicity-matrix.md`.
