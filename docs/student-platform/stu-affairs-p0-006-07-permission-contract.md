# STU-AFFAIRS-P0-006-07 — Student Affairs Permission Contract

Status: `PROPOSED — SECURITY APPROVAL REQUIRED`

## Operation contract

| Operation | Proposed permission | Approval | Academic context | Reason | Idempotency/version | Status |
|---|---|---:|---:|---:|---:|---|
| Student view | `Student.View` | No | No | No | Read consistency | Existing/proven |
| Student export | `Student.Export` | Policy-dependent | No | Audit | Request correlation | Existing/proven |
| Student ordinary create/update | `Student.Profile.Write` | Policy-dependent | No | Audit | Yes | Proposed |
| Register student | `Student.Registration.Create` | Policy-dependent | Admission context | Yes | Yes | Existing/proven |
| Guardian link | `Student.Guardian.Link` | Policy-dependent | No | Yes | Yes | Registered, route mismatch found |
| Guardian update | `Student.Guardian.Update` | Policy-dependent | No | Yes | Yes | Proposed |
| Timeline view | `Student.Timeline.View` or `Student.View` | No | No | Audit access | Read consistency | Owner decision |
| Promote | `Student.Promote` | Usually yes | Year/term required | Yes | Yes | Proposed |
| Re-enroll | `Student.ReEnroll` | Usually yes | Year/term required | Yes | Yes | Proposed |
| Suspend | `Student.Suspend` | Yes | Policy-dependent | Yes | Yes | Proposed |
| Dismiss | `Student.Dismiss` | Yes | Policy-dependent | Yes | Yes | Proposed |
| Archive | `Student.Archive` | Yes | No | Yes | Yes | Proposed |
| Restore | `Student.Restore` | Yes | No | Yes | Yes | Proposed |
| Graduate | `Student.Graduate` | Yes, maker/checker | Results/year/term required | Yes | Yes | Withhold/domain gate |
| Transfer | `Student.Transfer` | Yes, cross-scope gate | Year/term required | Yes | Yes | P0 blocked |
| Bulk operation | `Student.BulkOperate` plus operation permission | Yes | Operation-dependent | Yes | Per-item required | Proposed |

## Contract fields for each sensitive operation

The server-side command contract must derive actor and tenant context from trusted identity and require, where applicable:

- target student and related object scope;
- approved school/branch context;
- reason and supporting reference;
- current version;
- idempotency key;
- request and correlation IDs;
- approval record and maker/checker separation;
- audit event and outbox event after commit.

## Important status note

The proposed names are not approved registry entries. They must not be added or used until Security, Product, Academic Affairs, and Operations approve the matrix.
