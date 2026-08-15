# LEGACY-STATUS-001 — Conversion Report

## Objective

Design the safe application-layer conversion of legacy Student Status writers to the canonical Academic Status contract without changing schema, migrations, RLS, authorization infrastructure, tenant infrastructure, or the general UnitOfWork.

## Existing canonical path

`POST /api/student-registration` is already aligned with the intended sequence:

`Request → trusted authentication/tenant context → validation → UnitOfWork → students → academic status → transition → history → audit → outbox → commit`.

Its idempotency and rollback behavior are covered by the existing Student Registration test suite and must remain unchanged.

## Legacy conversion design

The required adapter shape is an application-level operation adapter, not a status-string mapper. Each adapter must:

1. Receive only trusted identity and tenant context.
2. Load the current canonical status and the student projection in one transaction.
3. Verify parity before mutation.
4. Validate an operation-specific canonical transition.
5. Update the canonical status row and `students.status` projection in the same UnitOfWork.
6. Insert exactly one transition and one immutable history row.
7. Insert audit and outbox records before commit.
8. Reject missing canonical rows, ambiguous legacy values, unsupported reverse transitions, and projection mismatch.

No adapter may call the existing legacy `StudentRepository.update` or `updateStatus` for the status mutation, because those methods can write outside the active PostgreSQL transaction and do not create the canonical chain.

## Conversion decisions

| Area | Decision |
|---|---|
| SOP-001 | Preserve unchanged; it is the reference canonical path. |
| Legacy create | Do not force into SOP-001 until its request contract can be translated to the canonical registration command without losing business fields. Requires a separate create-contract decision. |
| Legacy update with `status` | Must not remain an independent status writer. It requires a dedicated status operation or must reject status mutation while allowing non-status profile updates. |
| Re-enroll / restore | No approved reverse transition exists in the current state machine. Do not map to `active` by string replacement. Requires Enrollment or correction workflow contract. |
| Dismiss | Temporary suspension can be a candidate for `active → suspended`; permanent dismissal has no proven canonical meaning and must not be guessed. |
| Graduate | Requires an explicit graduation transition contract and eligibility evidence; the current legacy path is not canonical. |
| Archive | Candidate for `graduated → archived`; restore is not an ordinary transition and requires correction workflow. |
| Transfer | Must remain in Enrollment; it is not an Academic Status. |
| Bulk | Must be redesigned at the operation adapter level before status mutations are allowed; current nested-UoW behavior is unsafe. |
| Unreferenced lifecycle service | Keep unchanged in this mission; mark as a dead-code candidate until call-site and removal approval are complete. |

## Blockers and risks

### BLOCKER-01 — Legacy data contract mismatch

Legacy services use fields and identifiers from a different model (`name`, `classroom`, `academicId`, legacy IDs) while the canonical tables require UUID-based Student Platform fields. A blind adapter would either drop fields or issue invalid writes.

### BLOCKER-02 — Missing business semantics

`accepted`, `enrolled`, `dismissed`, `inactive`, `frozen`, `on_leave`, `re_enrolled`, and `transferred` do not have a proven one-to-one canonical meaning. Mapping them without a business contract would corrupt history.

### BLOCKER-03 — Transaction boundary mismatch

The legacy `StudentRepository.update` / `updateStatus` methods use the Supabase client or fallback storage instead of the active `TransactionSession`. Calling them after a canonical update would permit partial commits.

### BLOCKER-04 — Permission granularity

Legacy routes use broad `Student.Write`; the specific permissions for admission, suspension, withdrawal, graduation, archive, and correction are not proven in this mission. Permission infrastructure is out of scope and must not be changed here.

### BLOCKER-05 — Bulk nesting

`StudentService.executeBulkOperation` opens a UoW and delegates to methods that open UoWs, conflicting with the existing nested-UoW prohibition. This requires a separate bulk operation contract before canonical status mutations are enabled.

## Safe next implementation contract

The next mission should approve operation-specific canonical adapters in this order:

1. Admission approval (`applicant → admitted`).
2. Activation/enrollment (`admitted → active`) with Enrollment integration.
3. Temporary suspension (`active → suspended`).
4. Withdrawal (`suspended → withdrawn`) after Enrollment closure rules.
5. Graduation and archive after their business approvals.

Reverse transitions, transfer status, and ambiguous legacy values remain blocked until their owning domain supplies a contract.

## Mission decision

`LEGACY-STATUS-001 = PARTIALLY CONVERTED` is **not** claimed. No conversion code was written because the required mappings and transaction-safe adapter boundary are not yet proven. The correct current decision is:

`LEGACY-STATUS-001 = BLOCKED + RCA`

This is a controlled blocker, not a database or security bypass. The canonical SOP-001 path remains intact and no existing business function was silently disabled.
