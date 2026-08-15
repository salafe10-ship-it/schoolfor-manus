# STU-AFFAIRS-P0-002E — Persistence Model

## Canonical records

The existing Enrollment package is the intended persistence boundary:

- `enrollments`: source and destination enrollment state.
- `enrollment_transfers`: transfer process, source/destination references, approval/completion state, reason, and row-level idempotency key.
- `enrollment_history`: immutable domain timeline.
- `audit_events`: cross-domain compliance evidence.
- `outbox_events`: integration delivery state.

## Command mapping

1. Load source Enrollment using trusted tenant/school/branch scope.
2. Validate the destination scope and academic context against trusted context and approved business policy.
3. Close the source Enrollment with the approved transfer state and effective date.
4. Create the destination Enrollment only when the business contract permits it and admission/activation gates pass.
5. Insert one `enrollment_transfers` record with source/destination references.
6. Append history for each lifecycle effect.
7. Append one central audit event per successful transfer effect.
8. Append the required integration outbox event(s) in the same transaction.

## Immutability

History is append-only. Transfer rows may advance only through approved status transitions; no physical deletion is allowed. Audit and outbox semantics remain owned by their platform domains.

## Existing limitation

The migration contains a row-level `enrollment_transfers.idempotency_key`, but that is not by itself a durable batch-command result store. A batch key/result model remains a dependency and must not be invented in this architecture-only mission.

## Legacy boundary

`students.classroom`, `students.section`, and `students.stage_id` cannot be silently mapped to Enrollment transfer semantics. They require an explicit mapping or a Placement Edit contract before implementation.
