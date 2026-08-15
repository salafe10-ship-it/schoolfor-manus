# DB-SEC-001 — RLS Test Matrix

## Environment

- Target: Supabase Staging only.
- Production: not accessed and not modified.
- Observed application identity: `postgres` with `rolbypassrls = true`.
- Target tables: `students`, `guardians`, `student_guardians`, `enrollments`, `enrollment_history`, `enrollment_transfers`, `student_academic_status`, `student_status_transitions`, `student_status_history`, `student_documents`, `student_document_versions`, `student_document_categories`, `student_document_access_log`, `audit_events`, `outbox_events`.

## Matrix

| ID | Scenario | Expected result | Status | Reason |
|---|---|---|---|---|
| RLS-01 | School A selects School B rows | Denied/empty | BLOCKED | RLS is disabled and observed role bypasses RLS |
| RLS-02 | School A inserts a School B row | Denied | BLOCKED | No enforceable policy exists |
| RLS-03 | School A updates a School B row | Denied | BLOCKED | No enforceable policy exists |
| RLS-04 | School A deletes a School B row | Denied | BLOCKED | No enforceable policy exists |
| RLS-05 | Cross-tenant guardian link | Denied | BLOCKED | Relationship policy not installed |
| RLS-06 | Cross-tenant enrollment link | Denied | BLOCKED | Relationship policy not installed |
| RLS-07 | Cross-tenant academic status link | Denied | BLOCKED | Relationship policy not installed |
| RLS-08 | Cross-tenant document/version link | Denied | BLOCKED | Relationship policy not installed |
| RLS-09 | Cross-tenant audit read | Denied | BLOCKED | Audit policy not installed |
| RLS-10 | Audit update/delete | Denied | BLOCKED | Append-only policy not installed |
| RLS-11 | Cross-tenant outbox read/write | Denied | BLOCKED | Outbox policy not installed |
| RLS-12 | Tenant reassignment on update | Denied | BLOCKED | Ownership `WITH CHECK` not installed |
| RLS-13 | School/branch reassignment | Denied | BLOCKED | Ownership `WITH CHECK` not installed |
| RLS-14 | Missing tenant context | Denied | BLOCKED | No trusted-context policy is installed |
| RLS-15 | Spoofed request/body/header tenant | Denied | BLOCKED | No trusted-context policy is installed |
| RLS-16 | Same-tenant authorized read/write | Allowed | BLOCKED | Must be rerun under restricted role |
| RLS-17 | Normal application role privilege check | No BYPASSRLS | FAILED GATE | Actual role has `rolbypassrls = true` |
| RLS-18 | Owner/superuser bypass check | Never used as certification evidence | OBSERVED | Current application role is database owner and bypass-capable |

## Observed database state

For every target table, the direct catalog check returned:

- `relrowsecurity = false`
- `relforcerowsecurity = false`
- owner `postgres`
- policy count `0`

## Test execution rule

The matrix must not be marked passed using the current connection. After the restricted role and trusted context exist, rerun the full matrix with hostile tenant fixtures, then rerun the authenticated Student Registration, idempotency, duplicate, guardian, enrollment, academic-status, audit and outbox regressions.

**Current certification result: NOT CERTIFIED.**
