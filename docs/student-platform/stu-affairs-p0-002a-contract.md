# STU-AFFAIRS-P0-002A — Batch Transfer Contract

## Status

**DESIGN ONLY — PENDING OWNER/CTO BUSINESS APPROVAL**  
No source, schema, migration, RLS, database or production change is authorized by this document.

## 1. Contract Intent

Define a single approved contract for moving a selected set of students without partial persistence. The contract must be all-or-nothing, authorization-safe, tenant-safe and idempotent.

The contract must not turn the existing UI loop or legacy bulk method into a canonical service by renaming it. The implementation mission must consume this contract only after approval.

## 2. Relationship to ENROLL-CONTRACT-002

The approved Enrollment contract defines:

- Branch, school-within-tenant, academic-year or term ownership changes as first-class Enrollment Transfer operations.
- Same-Enrollment class/section changes as placement edits, not automatically as transfers.
- First-class transfer as: approve request, close source Enrollment as `transferred`, create destination Enrollment, write `enrollment_transfers`, write history for both effects, then audit and outbox atomically.
- `students.status` as a compatibility projection, not a canonical writer-owned state.

Therefore the current Student Affairs button, which currently submits class/section/stage values, cannot be called a first-class Enrollment Transfer without a business decision.

## 3. Proposed Commands

### Command A — Batch Placement Edit

Use when all selected students remain in the same Enrollment ownership and only class, section or approved stage placement changes.

Required intent: `batch_placement_edit`.

Expected result: every selected placement changes or none changes.

No `enrollment_transfers` row is created unless the approved placement-history contract later requires one.

### Command B — Batch Enrollment Transfer

Use when placement ownership changes for one or more students: branch, school within tenant, academic year or term.

Expected result per ENROLL-CONTRACT-002:

1. Approve the transfer request.
2. Close every source Enrollment as `transferred`.
3. Create every destination Enrollment with trusted academic context.
4. Write `enrollment_transfers` for every source/destination pair.
5. Write `enrollment_history` for both effects.
6. Write audit and outbox records in the same Unit of Work.

## 4. Proposed Batch Invariants

- The batch must contain at least one student and no duplicate student IDs.
- All students must be resolved within the trusted tenant context.
- Destination school/branch/year/term must be trusted and valid; client values are requests, not authority.
- All selected items must satisfy the same command type and contract version.
- A single invalid, unauthorized, cross-scope or conflicting item rejects the entire batch.
- No item may be committed before all validation gates pass.
- A batch cannot mix first-class Enrollment Transfer and same-Enrollment Placement Edit semantics.
- Historical records remain immutable.
- The student status projection must not be used as the transfer source of truth.

## 5. Proposed Request Context

The future implementation must receive, from trusted server context:

- tenant ID;
- school ID;
- branch ID;
- academic year and term context where applicable;
- authenticated user ID and role;
- permission decision;
- request ID;
- correlation ID;
- idempotency key;
- contract version.

The browser may submit requested destination data and selected student IDs, but it must never supply trusted actor or tenant authority.

## 6. Proposed Response Semantics

### Success

- One committed batch result.
- Actual processed count equals the validated selected count.
- Per-student result references are returned from the canonical persistence result.
- Audit/outbox identifiers are traceable by correlation ID.
- A replay with the same key and identical payload returns the stored result without duplicate effects.

### Failure

- HTTP/API failure is explicit.
- No student state, Enrollment, history, audit or outbox side effect remains committed.
- Error identifies validation, authorization, scope, conflict, idempotency or persistence category without leaking sensitive data.

## 7. Decisions Required Before Implementation

| Decision | Current status |
|---|---|
| Is the current button a Batch Placement Edit or Batch Enrollment Transfer? | **BUSINESS DECISION REQUIRED** |
| Is a batch one atomic aggregate or a command over multiple aggregates with one Unit of Work? | **BUSINESS/ARCHITECTURE DECISION REQUIRED** |
| Are cross-branch moves allowed? | **BUSINESS DECISION REQUIRED** |
| Are school-within-tenant moves allowed? | **BUSINESS DECISION REQUIRED** |
| Are academic-year/term changes allowed in the same batch? | **BUSINESS DECISION REQUIRED** |
| Is `Student.Write` sufficient or is a dedicated Transfer permission required? | **AUTHORIZATION DECISION REQUIRED; no registry change here** |
| Should audit/outbox use one batch event, per-student events, or both? | **AUDIT/INTEGRATION DECISION REQUIRED** |
| Is placement history required for class/section edits? | **BUSINESS DECISION REQUIRED** |

## 8. Non-Goals

- No implementation.
- No API creation.
- No UnitOfWork change.
- No schema/migration/RLS change.
- No Authorization or TenantEngine change.
- No modification to Enrollment, Academic Status, Guardian, Documents, Finance or Accounting.
- No live database or production certification.

## Decision

**PENDING OWNER/CTO APPROVAL — NOT IMPLEMENTABLE SAFELY UNTIL THE OPEN DECISIONS ARE RESOLVED.**
