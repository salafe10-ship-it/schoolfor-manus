# STU-AFFAIRS-P0-002A — Design Validation

## Validation Scope

This is a contract/architecture review only. It validates that the proposed design addresses the failure found in `STU-AFFAIRS-P0-002` without authorizing implementation.

## Traceability

| Requirement | Design coverage | Result |
|---|---|---|
| All-or-nothing batch | One command and one approved Unit of Work | Covered; implementation pending |
| No nested transaction leak | Explicit join/composition gate | Covered; implementation must stop if unsupported |
| Authorization | Trusted permission before mutation | Covered; permission choice pending |
| Tenant/school/branch safety | Trusted context and destination validation | Covered; business scope pending |
| Idempotency | Batch key + payload hash + replay matrix | Covered; storage/retry pending |
| Audit | Central audit separated from domain history | Covered; event choice pending |
| Outbox | Same transaction, publish after commit | Covered; event shape pending |
| Enrollment contract | Uses ENROLL-CONTRACT-002 transfer semantics | Covered for first-class transfer |
| Class/section ambiguity | Explicit Placement Edit vs Transfer decision | Covered; owner decision pending |
| Legacy routes | Explicit non-canonical disposition | Covered |

## Future Implementation Test Matrix

1. All-success batch commits every selected item.
2. Failure in the first, middle and last item rolls back the entire batch.
3. Unauthorized request performs no mutation.
4. Cross-tenant or invalid destination scope rejects the complete batch.
5. Same idempotency key and same payload returns the same result without duplicates.
6. Same key and changed payload returns conflict without mutation.
7. Concurrent same-key requests produce one effect.
8. Domain history, audit and outbox counts match the approved event contract.
9. Expected-version conflict rejects the batch according to the approved policy.
10. Browser refresh/retry does not duplicate the transfer.
11. Existing single-student transfer regression remains green.
12. TypeScript, full Vitest, Vite build, server bundle and `git diff --check` pass in implementation phase.

## Stop Conditions

Implementation must stop and return RCA if it requires:

- changing the shared UnitOfWork;
- changing TenantEngine, Authorization or RLS;
- schema/migration changes not already approved;
- inventing transfer business semantics;
- an unapproved new API;
- Operations C–G or live database evidence;
- changes outside Student Affairs Batch Transfer.

## Owner/CTO Decisions Required

- Placement Edit versus Enrollment Transfer for the current UI action.
- Batch aggregate interpretation.
- Cross-branch and cross-school policy.
- Dedicated transfer permission versus existing Student.Write.
- Idempotency storage/retry semantics.
- Audit/outbox event shape and consumers.
- Placement-history requirement.

## Environment Boundary

`PLATFORM-EVIDENCE-002` remains **CLOSED / BLOCKED + RCA**. No live DB/RLS/production certification is claimed or required for this design mission.

## Final Status

**READY FOR CTO REVIEW — DESIGN ONLY**

No source or infrastructure files were modified.
