# ENROLL-CONTRACT-001 — Enrollment State Model

Date: 2026-08-11  
Mode: extracted evidence; no state implementation

## Vocabulary found in the Enrollment migration

`enrollment_status`:

`draft`, `pending`, `active`, `completed`, `withdrawn`, `transferred`, `cancelled`, `archived`.

`admission_status`:

`pending`, `approved`, `rejected`.

## State facts enforced by the current schema

| State | Evidence from constraints | Terminal/reversible conclusion |
|---|---|---|
| `draft` | Allowed; admission gate permits it | No transition writer found; reversibility is unresolved |
| `pending` | Default state; admission gate permits it | No transition writer found |
| `active` | Allowed; active-per-student-year unique index applies | No transition writer found; it is not automatically tied to Academic Status `active` |
| `completed` | Requires completion reason and `ends_on` | Appears closed by constraints; reversal is not defined |
| `withdrawn` | Requires withdrawal reason and `ends_on` | Appears closed by constraints; reversal is not defined |
| `transferred` | Requires `ends_on` | Transfer semantics and reversal are not defined |
| `cancelled` | Excluded from overlap and active-per-year partial index | Cancellation semantics are not defined |
| `archived` | Permitted for soft-deleted rows and excluded from overlap | Appears terminal for the row; restore policy is not defined |

## State transitions that are NOT present

No canonical service/repository was found for:

- `draft → pending`
- `pending → active`
- `active → completed`
- `active → withdrawn`
- `active → transferred`
- `active → cancelled`
- `completed/withdrawn/transferred → archived`
- any re-enrollment transition
- any academic-year movement transition

The database check constraints validate row shapes, not the full transition workflow.

## Academic Status vocabulary found separately

Academic Status values are:

`applicant`, `admitted`, `active`, `suspended`, `withdrawn`, `graduated`, `archived`.

Its ordinary transition constraints define:

`applicant → admitted → active → suspended → withdrawn → graduated → archived`.

This is not the same state machine as Enrollment. The shared labels `active`, `withdrawn` and `archived` do not establish synchronization semantics.

## Canonical matrix status

The evidence supports a two-aggregate model, but it does not support a complete canonical transition matrix. The following decisions remain open:

- Does an Enrollment become `active` only after Academic Status becomes `active`?
- Is `completed` equivalent to `graduated`, or can an enrollment complete for another reason?
- Is `withdrawn` an Enrollment closure and an Academic Status change, or independent?
- Is `transferred` a terminal state for the old Enrollment only?
- Which state is created by initial SOP-001, given it currently creates `pending/pending`?

## Decision

**The project has a state model conflict, not a safe canonical state machine.** A hardening implementation must wait for explicit business answers.
