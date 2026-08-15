# STU-AFFAIRS-P0-002H — Owner Approval

## Approval status

**OWNER-APPROVED — Conservative Transfer Scope Baseline**

## Approved policy

| Policy | Approved decision |
|---|---|
| Branch to Branch | Allowed only within the same school |
| School to School | Not allowed in the current transfer operation |
| Academic Year to Year | Not allowed |
| Term to Term | Not allowed |
| Multiple scope changes in one transfer | Not allowed |
| Mixed destinations in one batch | Not allowed |
| Single source context per batch | Required |
| Single destination context per batch | Required |
| `stageId` | Excluded from the Transfer contract until formally mapped |
| Idempotency | Dedicated durable Transfer Batch Store (Option A) |

## Safety interpretation

The policy is a conservative release baseline. It prevents cross-school movement, mixed-scope batches, ambiguous stage changes, and duplicate execution. Any exception requires a separately approved business decision and must not be inferred by implementation.

## Remaining CTO gates

This owner decision does not authorize database changes or Batch Transfer implementation by itself. The consultant must confirm the decision, define the approved canonical command, and issue the next implementation order. A durable idempotency store requires its own schema/migration approval before creation.
