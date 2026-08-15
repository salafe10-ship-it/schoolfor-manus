# STU-AFFAIRS-P0-006-07 — Approval Matrix

Status: `UNDECIDED — OWNER AND SECURITY APPROVAL REQUIRED`

| Decision | Recommendation | Owner | Security review | Status |
|---|---|---|---|---|
| Replace broad lifecycle use of `Student.Write` | Separate sensitive operation capabilities | Security + Product | Required | `UNDECIDED` |
| Guardian link vs update | Separate capabilities | Student Affairs + Security | Required | `UNDECIDED` |
| Timeline permission | Use dedicated capability if timeline contains sensitive events | Security + Product | Required | `UNDECIDED` |
| Lifecycle maker/checker | Separate execution and approval for high-impact actions | Security + Academic Affairs | Required | `UNDECIDED` |
| Graduation availability | Withhold/disable until canonical academic source and domain contract | Academic Affairs + Security | Required | `UNDECIDED` |
| Transfer | Preserve P0 security/operations block | Security + Operations | Required | `BLOCKED` |
| Bulk commands | Per-operation and per-item authorization | Security + Operations | Required | `UNDECIDED` |
| Tenant/school/branch target rules | Server-derived trusted scope plus object checks | Platform Security | Required | `UNDECIDED` |
| Reason and evidence | Required for sensitive lifecycle commands | Student Affairs + Compliance | Required | `UNDECIDED` |
| Version/idempotency | Required for mutation and retry safety | Platform Engineering | Required | `UNDECIDED` |
| Audit/outbox | Record denial and successful state change appropriately | Governance + Security | Required | `UNDECIDED` |

## Approval rule

No implementation begins while a required row is `UNDECIDED`. This document intentionally does not grant authorization to change the registry, roles, middleware, APIs, or UI.

## Final status

`AUTHORIZATION CONTRACT READY — IMPLEMENTATION REQUIRES SECURITY APPROVAL`.
