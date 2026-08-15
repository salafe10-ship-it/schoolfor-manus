# STU-AFFAIRS-P1-006-23 — Owner and Security Decision Handoff

## Purpose

This document transfers the Lifecycle/Bulk containment decisions to the Domain/Academic, Security, Operations, and Architecture owners. It is a decision handoff, not an implementation authorization.

## Official status

`P1-006-23 = DECISION HANDOFF COMPLETE — IMPLEMENTATION BLOCKED UNTIL APPROVAL`

## Current evidence baseline

- Legacy lifecycle writers are reachable from active Promote, Re-enroll, Dismiss, Archive, and Bulk routes.
- DELETE soft-delete/restore has a canonical route; POST Archive with `archive=false` remains a separate Legacy restore-like path.
- Bulk uses broad `Student.Write`, lacks visible `resolveStudentTenantMiddleware`, lacks proven per-item branch authorization, and has an unknown-operation generic-success risk.
- Bulk Transfer is a P0 dependency because a canonical atomic TransferOperation is not proven.
- Graduation remains fail-closed with `GRADUATION_NOT_READY`.
- No runtime cross-tenant or unauthorized mutation was proven in the discovery work.

## Decisions requiring owners

| Decision | Domain / Academic | Security | Operations | Architecture | Final |
|---|---|---|---|---|---|
| Promote may remain reachable temporarily | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED |
| Re-enroll may remain reachable temporarily | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED |
| Dismiss and temporary Suspend semantics | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED |
| Archive semantics and terminal-state rule | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED |
| Restore versus correction workflow | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED |
| Legacy lifecycle routes fail-closed until canonical writer | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED |
| Bulk operations allowed before canonical batch contract | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED |
| Bulk Transfer remains P0-blocked | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED |
| Bulk requires operation-specific permission | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED |
| Bulk requires resolved TenantContext and branch scope | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED |
| Unknown Bulk operation must return HTTP 4xx | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED |
| Future Bulk permission name and policy | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED |
| Owner authorized to reopen each operation | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED |

## Proposed containment defaults for review

These are proposals only and must not be treated as approved values:

- Promote, Re-enroll, Dismiss, Suspend, Archive, and Legacy Restore: `BLOCKED / GATED` until canonical domain contracts are approved.
- Canonical DELETE Restore: retain as the only candidate restore route, subject to correction/restore approval.
- Bulk Promote and Bulk Archive: `BLOCKED` until a canonical batch contract exists.
- Bulk Transfer: `P0 BLOCKED` until `TransferOperation` exists and is transactionally validated.
- Unknown Bulk operation: fail closed with a specific 4xx contract.
- Bulk permissions: replace broad `Student.Write` with operation-specific permissions after Authorization owner approval.

## Approval protocol

1. Domain/Academic owner approves lifecycle meaning and canonical aggregate ownership.
2. Security owner approves tenant context, item scope, branch scope, permissions, and fail-closed behavior.
3. Operations owner approves availability, rollback, retry, idempotency, and support handling.
4. Architecture owner resolves conflicts and records the final decision.
5. Only after all required approvals may a separate implementation order be issued.

## Implementation lock

Until the approval matrix is populated, do not modify or disable routes, Legacy writers, Bulk, Authorization, TenantEngine, UnitOfWork, Enrollment, Lifecycle, DB, SQL, migrations, RLS, staging, or production.

