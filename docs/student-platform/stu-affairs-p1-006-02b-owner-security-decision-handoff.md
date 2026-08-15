# STU-AFFAIRS-P1-006-02B — Student Export Owner/Security Decision Handoff

## Purpose

This is the single approval table requested by the CTO for the Student Export contract. It records the CTO recommendation separately from owner and security approval. It is not an implementation authorization.

## Current gate

**P1-006-02B = OWNER APPROVED / SECURITY DECISION REQUIRED**

Implementation remains blocked until every row has a final decision and evidence.

## Approval matrix

| # | Decision | CTO Recommendation | Owner Decision | Security Decision | Final Status | Evidence / Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Artifact format | True XLSX Excel artifact | **APPROVED — OWNER** | **PENDING — SECURITY** | **SECURITY UNDECIDED** | Must be a real XLSX, not a CSV renamed as Excel. |
| 2 | Data scope | All results matching the approved filters/search/sort, not the current page | **APPROVED — OWNER** | **PENDING — SECURITY** | **SECURITY UNDECIDED** | Must be server-side and bounded. |
| 3 | Synchronous maximum | 5,000 records per synchronous request | **APPROVED — OWNER** | **PENDING — SECURITY** | **SECURITY UNDECIDED** | Any value must be a finite server-enforced cap. |
| 4 | Execution model | Synchronous up to 5,000; no async implementation in this mission | **APPROVED — OWNER** | **PENDING — SECURITY** | **SECURITY UNDECIDED** | Larger exports require a later async decision; no silent fallback. |
| 5 | Permission | Dedicated `Student.Export`, separate from `Student.View` | **APPROVED — OWNER** | **PENDING — SECURITY** | **SECURITY UNDECIDED** | Role assignment and denial behavior require approval. |
| 6 | Sensitive fields | Exclude `nationalId` and `guardianPhone` by default | **APPROVED — OWNER** | **PENDING — SECURITY** | **SECURITY UNDECIDED** | No field-level exception without explicit profile and audit requirements. |
| 7 | Audit | Server-side audit for every accepted, denied, failed, and completed export | **APPROVED — OWNER** | **PENDING — SECURITY** | **SECURITY UNDECIDED** | Audit must contain scope/result metadata but not raw sensitive rows. |
| 8 | Filename and encoding | Safe Arabic/English XLSX filename policy | **APPROVED — OWNER** | **PENDING — SECURITY** | **SECURITY UNDECIDED** | Must prevent unsafe names and preserve Arabic display. |
| 9 | Product classification | Student Data Export, not Official Student Report | **APPROVED — OWNER** | **PENDING — SECURITY** | **SECURITY UNDECIDED** | Official report requires a separate contract and approval. |

## Required approval evidence

For each row, the approver must provide:

- decision: approve recommendation / modify recommendation / reject;
- owner or security authority;
- effective date;
- rationale for any modification;
- exception and expiry, if applicable;
- link or reference to the governing product/security decision.

Blank cells are not approvals. Silence must remain `UNDECIDED`.

## Owner decision recorded

On 2026-08-12, the project owner approved the CTO recommendations for all nine rows exactly as proposed. This records owner approval only; it does not constitute security approval and does not authorize implementation.

## Implementation gate

The future implementation mission may start only when:

1. all nine rows have non-pending Owner and Security decisions;
2. no row is contradictory;
3. sensitive field treatment is explicit;
4. the export is confirmed as Data Export rather than Official Report;
5. the CTO changes the status to `CONTRACT APPROVED` and issues a separate implementation scope.

## Prohibited before approval

- modifying `handleExportExcel`;
- changing `PermissionRegistry`;
- adding an XLSX dependency or generator;
- creating an export API or service;
- changing schema, migrations, RLS, RPC, or storage;
- changing Import, Transfer, Print, or Reports.

## Validation

This handoff is documentation only. `git diff --check` passed when created, with existing line-ending normalization warnings only. No runtime tests are applicable because no executable behavior changed.
