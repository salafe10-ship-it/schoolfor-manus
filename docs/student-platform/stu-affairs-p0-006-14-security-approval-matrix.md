# STU-AFFAIRS-P0-006-14 — Security Approval Matrix

Status: `OPEN — NO SECURITY APPROVAL EVIDENCED`

| Decision | Recommended secure baseline | Current status | Blocking effect |
|---|---|---|---|
| Authoritative role/permission source | Tenant-scoped database assignments; static definitions are not production authority | Open | Role hardening cannot start |
| Wildcard roles | Disabled in normal production; break-glass only with explicit scope, expiry, approval, and audit | Open | No wildcard behavior may be inferred |
| Permission cache | Identity + tenant + school + branch + assignment revision; bounded TTL; fail closed | Open | Shared role-only cache is not acceptable |
| Permission revision | Owned by one approved source and invalidated on assignment, permission, scope, user, and session changes | Open | Cache freshness cannot be certified |
| Sensitive lifecycle operations | Dedicated operation permissions plus maker/checker where required | Open | Broad `Student.Write` is insufficient as final policy |
| Bulk | Separate bulk capability, operation capability, per-item scope, bounded batch, idempotency | Open | Bulk mutation remains blocked |
| Tenant context | Trusted server context required by service/repository, including branch and academic year when applicable | Open | Same-school cross-branch/year safety not proven |
| Transfer | Separate approved TransferOperation contract | Open/blocked by prior decisions | No Bulk Transfer implementation |
| Persistence | One canonical transaction writer; no fallback success after DB failure | Open | Atomicity and integrity risk remains |
| Audit | Denials and sensitive decisions include trusted actor/scope/operation/target/reason | Partial | Coverage must be approved and verified |
| Runtime evidence | Isolated staging fixture and permitted hostile allow/deny tests | Open | No production claim or live security certification |

## Approval record

No signed or repository-recorded Security/Operations approval for these decisions was found during P0-006-14 reconciliation. This status is not a refusal; it is a fail-closed evidence result.

## Required approval statement

The approver must name the exact decisions approved, the permitted files, the permitted environment, and the tests that may run. A generic approval to “harden authorization” is insufficient.
