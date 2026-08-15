# STU-AFFAIRS-P0-006-15 — Security/Operations Approval Record

Status: `APPROVAL RECORD READY — WAITING FOR SECURITY/OPERATIONS/ARCHITECTURE SIGN-OFF`

This record is a decision form. Empty approval fields mean `UNDECIDED`; they must not be interpreted as approval.

## Decision scope

| Decision | Proposed baseline for review | Accountable owner | Security approval | Operations approval | Architecture approval | Effective scope | Exceptions | Approval authority | Effective date | Review date | Evidence/reference |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Permission cache | Scoped key: identity + tenant + school + branch + assignment/permission revision; bounded TTL; fail closed | Security + Platform | UNDECIDED | UNDECIDED | UNDECIDED | Student Affairs authorization | None proposed | TBD | TBD | TBD | P0-006-09/10/11 |
| Wildcard roles | Disabled in normal Production; any break-glass mode requires explicit scope, expiry, audit, approval, and revocation | Security + Operations | UNDECIDED | UNDECIDED | UNDECIDED | Authorization role resolution | TBD | TBD | TBD | TBD | P0-006-10 |
| Lifecycle permissions | Operation-specific permissions replace broad `Student.Write` for sensitive lifecycle actions | Security + Academic Affairs | UNDECIDED | UNDECIDED | UNDECIDED | Student Affairs lifecycle routes | TBD | TBD | TBD | TBD | P0-006-07/09/11 |
| Bulk authorization | Separate Bulk capability, operation permission, per-item scope, bounded batch, idempotency | Security + Operations | UNDECIDED | UNDECIDED | UNDECIDED | Bulk Student Affairs route | TBD | TBD | TBD | TBD | P0-006-13 |
| Trusted TenantContext | Trusted context must be carried into service/repository; branch/year required where applicable | Security + Platform | UNDECIDED | UNDECIDED | UNDECIDED | Student Affairs writes | None proposed | TBD | TBD | TBD | P0-006-09/13 |
| Branch scope | Every applicable read/write proves trusted branch ownership and target branch authorization | Security + Academic Affairs | UNDECIDED | UNDECIDED | UNDECIDED | Same-school branch operations | TBD | TBD | TBD | TBD | P0-006-13 |
| Academic-year scope | Every year-sensitive operation uses trusted academic-year context; no hardcoded year | Security + Academic Affairs | UNDECIDED | UNDECIDED | UNDECIDED | Promotion/enrollment/status-sensitive operations | TBD | TBD | TBD | TBD | P0-006-13 |
| Maker/checker | Independent approval for sensitive lifecycle, transfer, and other approved actions | Security + Academic Affairs | UNDECIDED | UNDECIDED | UNDECIDED | Named operations only | TBD | TBD | TBD | TBD | P0-006-07/09/13 |
| Denial audit | Denials and sensitive decisions include trusted actor, scope, operation, target, reason, request, and correlation metadata | Security + Audit | UNDECIDED | UNDECIDED | UNDECIDED | Authorization and Student Affairs | TBD | TBD | TBD | TBD | P0-006-08/13 |
| Transaction/fallback | Sensitive writes cannot report success from local fallback after DB failure; nested transaction policy must be explicit | Operations + Architecture | UNDECIDED | UNDECIDED | UNDECIDED | Student Affairs write paths | TBD | TBD | TBD | TBD | P0-006-13 |

## Required sign-off

The approver must complete the fields above and attach evidence. A chat instruction without named authority, scope, date, and evidence is not sufficient for implementation authorization.

## Final status rule

`Final Status = APPROVED` only when all required owner/security/operations/architecture decisions are recorded. Otherwise:

`Final Status = UNDECIDED`
