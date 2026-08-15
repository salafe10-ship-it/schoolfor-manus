# STU-STATUS-001 — Validation Report

## 1. Mission Type

Discovery and integrity baseline only. No implementation, migration execution, database write, RLS change, or Production action was performed.

## 2. Static Validation

| Check | Result | Evidence |
|---|---|---|
| Route discovery | PASS | General Student lifecycle routes and SOP-001 registration route identified in `server.ts` |
| Canonical service discovery | FAIL | Two active lifecycle families exist; `StudentLifecycleService` is unreferenced |
| State vocabulary extraction | FAIL | Migration and application state vocabularies differ |
| Transition graph extraction | FAIL | General lifecycle graph differs from approved academic-status graph |
| Initial-status consistency | FAIL | SOP-001 creates `applicant`; legacy create path creates `active` |
| History write coverage | FAIL | Legacy status-changing routes do not write academic status history |
| Audit/outbox coverage | PARTIAL | SOP-001 uses academic audit/outbox; legacy lifecycle uses legacy audit only |
| Tenant/school/branch code review | PARTIAL | Trusted scope visible in SOP-001; no complete status-operation certification |
| Authorization review | PARTIAL | Broad Student.Write protects legacy routes; no dedicated academic-status approval path |
| RLS policy contract | BLOCKED + RCA | Existing status RLS migration uses `current_setting('app.*')` |
| Database execution | NOT RUN | Forbidden in this mission |
| Staging live tests | EVIDENCE BLOCKED | Operations Evidence capability is closed |
| Production | NOT RUN | Forbidden |

## 3. Existing Automated Test Coverage

Current suite evidence found:

- `studentRegistration.test.ts` covers initial SOP-001 commit, rollback, idempotency, trusted context, and client tenant spoof rejection.
- `studentRlsPolicies.test.ts` covers legacy/static RLS text contracts, not live database behavior.
- `studentAuditMetadata.test.ts` covers trusted audit metadata and server-only execution guard.
- No dedicated `Student Academic Status` transition test suite was found for ordinary transition approval, history immutability, current-status synchronization, or legacy-route parity.

This absence is a readiness gap, not a reason to create a new state machine during the discovery mission.

## 4. Stop Condition Triggered

The mission stop conditions were triggered by:

- client/runtime paths that can change status outside the academic-status tables;
- incompatible state machines;
- missing history/outbox parity;
- an RLS policy source that requires security remediation.

Per order, no out-of-scope fix was attempted.

## 5. Root-Cause Analysis

The academic-status migration and SOP-001 registration were added after an older Student Affairs lifecycle already existed. The older route/service family remained callable and continued to update `students.status` directly. The result is schema preparation without full application cutover.

The RLS implementation was produced under a separate security migration using `current_setting()` session variables, while the trusted-JWT policy standard requires identity from JWT app metadata. This is an independent security gate and cannot be repaired inside a status discovery mission.

## 6. Decision

`STU-STATUS-001 = BLOCKED + RCA`

Recommended next step: issue one narrowly scoped hardening mission for the application status cutover and a separately approved RLS/security remediation mission. Do not certify Student Academic Status or proceed to a status UI implementation before those gates are resolved.
