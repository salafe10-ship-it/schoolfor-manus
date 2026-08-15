# STU-AFFAIRS-P1-006-12 — Lifecycle Domain Contract Validation

## Scope validation

| Check | Result |
|---|---|
| Lifecycle service changes | PASS — none |
| Route changes | PASS — none |
| SQL/migration/database changes | PASS — none |
| RLS/tenant/auth changes | PASS — none |
| Production/Staging mutation | PASS — none |
| State set separated from Transfer | PASS |
| Identity/status/enrollment/placement separated | PASS |
| Baseline transitions documented | PASS |
| Forbidden/undecided transitions documented | PASS |
| Academic year/term requirements documented | PASS |
| History logical contract documented | PASS |
| Correction workflow documented | PASS |
| Outbox marked honestly | PASS — current route publication remains NOT PROVEN |
| Unapproved business policy invented | PASS — unresolved decisions marked UNDECIDED |

## Current implementation gaps carried forward

1. Legacy status vocabulary does not equal the approved state set.
2. Dedicated lifecycle/enrollment/transfer history is not proven in current routes.
3. Graduation registry values are currently mock/fixed in the inspected service.
4. Promotion lacks trusted academic-year/term resolution in the inspected contract.
5. Archive and restore have two divergent route/service paths.
6. Transfer remains a separate P0/security/operations dependency and was not implemented.

## Decision

The domain contract and state-machine design are complete for review. Implementation is blocked until the owner resolves the explicitly listed `UNDECIDED` transitions and approves the schema/API/authorization work.

**STOP + DOMAIN/OWNER DECISION REQUIRED**

