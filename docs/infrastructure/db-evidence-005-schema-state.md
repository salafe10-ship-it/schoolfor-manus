# DB-EVIDENCE-005 — Schema State

## `student_status_transitions`

- Table exists in `public`.
- Table is empty in Table Editor (`0 records`).
- Visible columns include `id`, `tenant_id`, `school_id`, `branch_id`, and `student_id`.
- Table Editor exposes an RLS policies link showing `4` policies.
- Policies page shows a `Disable RLS` action for this table, which is evidence that RLS is currently enabled.

## `active -> withdrawn` Constraint

The official dashboard surfaces used in this mission do not display the check-constraint expression. Therefore the live presence of the exact `active -> withdrawn` branch is not claimed.

## Boundary

No SQL Editor, schema dump, direct connection, migration push, or mutation was used. The table's existence predates the empty migration history and remains a schema-drift fact requiring a later approved reconciliation decision.
