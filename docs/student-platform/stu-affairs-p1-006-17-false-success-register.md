# STU-AFFAIRS-P1-006-17 — False-Success Register

| ID | Function | UI/API claim | Proof of real mutation | Finding | Severity |
|---|---|---|---|---|---|
| FS-001 | Graduation | Student graduated; record locked; certificate-like registry returned | Student status update is attempted inside a transaction, but returned GPA/year/Issued registry is hardcoded and not proven persisted | Official-looking false academic evidence | P0 |
| FS-002 | Edit grade/section/status | Student edit success notification | API returns success after patch mapping that omits classroom, section, and most status values | UI success can mask an unchanged academic placement/status | P1 |
| FS-003 | Edit guardian + student | One user action appears to save the whole form | Guardian PATCH and Student POST are separate requests/transactions | Guardian can commit while student update fails | P1 |
| FS-004 | Edit modal secondary tabs | “تم حفظ وتأكيد البيانات...” appears before Save | No persistence request is made by the tab text | Premature local-state success claim | P1 |
| FS-005 | Legacy report execution | Generic report service returns `status: completed` | `saveExecution` is empty and no Student Affairs artifact is generated | Not a certified report pipeline; currently not wired | P2 |
| FS-006 | Legacy admission direct caller | Legacy service creates a complete lifecycle | Contains synthetic IDs/defaults and calls a blocked Guardian legacy path | May fail closed today, but remains dangerous dead code if reactivated | P2 |

## Confirmed non-false-success controls

- Canonical registration success is returned after the UnitOfWork callback completes.
- Canonical document actions notify success only after the request returns successfully.
- Batch transfer and Excel import explicitly communicate that no mutation happened.
- Official ID-card print and certificates are disabled rather than claiming issuance.

## P0 handling rule

`FS-001` is a release-blocking finding. No graduation implementation, certificate work, Results/GPA work, or report implementation may proceed from this audit. A separate isolated P0 fix must first remove fabricated academic evidence and establish an approved source-of-truth decision.

