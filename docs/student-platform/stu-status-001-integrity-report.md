# STU-STATUS-001 — Student Academic Status Integrity Report

## 1. Integrity Matrix

| Area | Result | Evidence | Consequence |
|---|---|---|---|
| Canonical path | FAIL | SOP-001 writes status tables, while general `/api/students` routes use `StudentService`/`StudentRepository` | A status change can bypass academic status tables |
| State machine | FAIL | Migration uses `admitted/active`; `StudentLifecycleManager` uses `accepted/enrolled/re_enrolled/dismissed` | The same student can be interpreted differently by modules |
| Initial status | PARTIAL | SOP-001 sets `applicant`; legacy `StudentAdmissionService`/`StudentRepository` creates `active` | Admission-before-activation rule is not universal |
| Current status | PARTIAL | `student_academic_status` has one-row uniqueness, but legacy flows update `students.status` directly | Two possible sources of current truth |
| History immutability | PARTIAL | Migration revokes history update/delete, but legacy flows do not append history | History is incomplete for old lifecycle operations |
| Transition ledger | PARTIAL | SOP-001 creates initial transition only; no active route completes ordinary transitions | Approval/completion lifecycle is not wired end-to-end |
| Reason and approval | PARTIAL | Migration constrains reasons/approval pairs; legacy dismiss input is stored in notes and generic audit | Required academic transition semantics are not consistent |
| Audit | PARTIAL | SOP-001 queues `audit_events`; legacy flows use legacy `AuditRepository` | Audit shape and source differ by path |
| Outbox | PARTIAL | SOP-001 queues an outbox event; legacy status operations do not use academic-status outbox events | Downstream subscribers cannot rely on one event contract |
| Atomicity | PARTIAL | SOP-001 includes all status tables in one UnitOfWork; legacy status changes include `students/audit_logs` only | Status/history/audit can diverge |
| Tenant isolation | BLOCKED | Code-level trusted context is present in SOP-001; live evidence unavailable | No live cross-tenant certification |
| RLS contract | BLOCKED + RCA | Existing status policies use `current_setting('app.*')` | Requires separate RLS/security remediation |
| Authorization | PARTIAL | General routes use broad `Student.Write`; no dedicated academic-status permission path | Status approval authority is not explicit |
| Academic year | PARTIAL | SOP-001 validates academic context for enrollment; legacy status routes do not carry academic-year context | Status can be changed without an academic-year decision context |

## 2. Actual Transition Comparison

| Transition concept | Academic-status migration | Active legacy manager | Result |
|---|---|---|---|
| Initial | `NULL → applicant` | `create → active` in legacy repository path | Conflict |
| Admission | `applicant → admitted` | `applicant → accepted` | Conflict |
| Activation | `admitted → active` | `accepted → enrolled → active` | Conflict |
| Suspension | `active → suspended` | `active → suspended` | Same label, different surrounding graph |
| Withdrawal | `suspended → withdrawn` | `active → withdrawn` through soft delete | Conflict |
| Graduation | `withdrawn → graduated` | `active → graduated` | Conflict |
| Archive | `graduated → archived` | `dismissed/graduated/withdrawn → archived` | Conflict |
| Transfer | Explicitly excluded from status | Separate student transfer operation | Correct ownership, but no status synchronization contract |

## 3. Security and Trust Findings

- The canonical SOP-001 path derives tenant, school, branch, user, audit, request, and correlation values from trusted context.
- The legacy general routes derive `schoolId` from `req.user.schoolId`, but do not use the academic-status context or status-specific authorization.
- `StudentLifecycleService` is not canonical and contains hard-coded audit context. It must not be activated without a separate trust-context review.
- Existing status RLS policy source uses `current_setting()` rather than the approved trusted JWT claim strategy. No RLS change was attempted.

## 4. Atomicity Findings

The registration path is structurally atomic for initial creation because it enlists the student, academic status, transition, history, audit, and outbox rows in one request-scoped UnitOfWork.

The general lifecycle paths are not equivalent. For example, graduation and dismissal update the legacy `students` row and write a legacy audit record, but do not append `student_status_history` or create a `student_status_transitions` record. Therefore the project cannot claim complete academic-status atomicity.

## 5. Required Hardening Outcomes

Before certification, a later approved implementation mission must:

1. Choose one status vocabulary and state machine.
2. Make one application service authoritative for every status-changing endpoint.
3. Synchronize current status, transition approval/completion, immutable history, audit, and outbox in one transaction.
4. Carry trusted tenant, school, branch, academic year, and actor context through every operation.
5. Define dedicated permission semantics for status request, approval, correction, and archive.
6. Resolve the RLS `current_setting()` conflict in a separate approved security mission.

## Decision

`STU-STATUS-001 = BLOCKED + RCA`
