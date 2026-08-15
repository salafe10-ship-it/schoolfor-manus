# STU-AFFAIRS-P0-006-09 — Sensitive Operation Matrix

Status: `UNDECIDED — SECURITY/OWNER APPROVAL REQUIRED`

| Operation | Operation permission | Object scope | Approval | Required evidence |
|---|---|---|---|---|
| Profile write | Profile-specific permission | Student scope | Policy-dependent | Version, audit |
| Guardian link/update | Guardian-specific permission | Student + guardian relationship | Policy-dependent | Reason, version, audit |
| Promote | Promote permission | Student + current enrollment + academic context | Usually maker/checker | Reason, version, idempotency, audit |
| Re-enroll | ReEnroll permission | Student + new academic context | Usually maker/checker | Reason, version, idempotency, audit |
| Suspend/dismiss | Dedicated lifecycle permission | Student scope | Required by policy | Reason, approval, audit |
| Archive/restore | Dedicated lifecycle permission | Student scope | Required by policy | Reason, version, audit |
| Graduate | Graduate permission/domain gate | Student + enrollment + results + academic context | Maker/checker | Approved results, reason, version, idempotency, audit/outbox |
| Transfer | Transfer permission | Source + destination scope | Maker/checker/security gate | Approved transfer, source closure, destination, audit/outbox |
| Bulk | Bulk plus operation permission | Per-item target scope | Required for sensitive operations | Batch limit, per-item decisions, idempotency, audit |

No permission names or approval requirements are implemented by this matrix.
