# STU-AFFAIRS-P0-002M — RLS Analysis

## Existing evidence

- `202608081700_db_sec_003_rls.sql` enables RLS for current Student, Enrollment, Audit, and Outbox tables.
- It contains no `TransferOperation` policy because the table does not yet exist.
- Existing policies use `current_setting('app.tenant_id')`, `app.school_id`, `app.branch_id`, and `app.user_id`.
- No approved proof currently demonstrates that the settings cannot be spoofed through a pooled connection or an application role.

## Gap

Copying an existing policy would create a false security closure. A new table requires a policy contract that proves:

1. trusted identity origin;
2. transaction/request lifetime;
3. role restrictions on context injection;
4. tenant, school, and branch matching;
5. fail-closed behavior;
6. read/write/claim/reconcile/purge separation;
7. cross-tenant and spoofing tests.

## Design recommendation

Use JWT `app_metadata` as the authoritative identity input at the authentication boundary, derive server context from it, and permit database-local derived context only when the transaction driver and roles prove it cannot be client-controlled. The exact SQL/RLS form requires a separate security approval.

## Decision

`RLS CONTRACT NOT YET APPROVED`. No policy or migration is written in P0-002M.
