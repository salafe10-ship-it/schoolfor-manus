# ACC-001-IMPLEMENTATION-002 — Decision Register

Decision items are isolated to the affected accounting capability. They do not authorize inventing financial rules and do not block unrelated technical audit work.

| ID | Decision item | Required owner decision | Blocks |
|---|---|---|---|
| ACC-D01 | Canonical chart-of-accounts ownership and account mapping | Approve account ownership, code hierarchy and mapping source | Posting and integration implementation |
| ACC-D02 | Fiscal-period close/reopen and correction workflow | Approve authority, lock behavior and correction mechanism | Closing, reopening and period protection |
| ACC-D03 | Reversal policy | Approve reversal linkage, authorization and reporting treatment | Reversal implementation |
| ACC-D04 | Revenue, tax and fee recognition | Approve recognition timing and tax rules | Student Fees and invoice posting |
| ACC-D05 | Inventory valuation | Approve valuation method and adjustment policy | Inventory-to-GL integration |
| ACC-D06 | Payroll and asset accounting | Confirm source ownership and posting policy where those modules are present | Payroll/assets integration |
| ACC-D07 | Opening balances | Approve import, approval and audit requirements | Opening-balance migration |

## Non-blocking decisions

UI handler corrections, failure propagation, duplicate suppression where an existing idempotency contract is already proven, and report navigation can be fixed without deciding account mappings. One such safe UI correction was completed in this mission.

## Current decision state

`OPEN — continue safe hardening; owner decisions required only for policy-dependent accounting behavior.`
