# STU-AFFAIRS-P1-006-02A — Student Export Decision Package

## Decision status

**BUSINESS/SECURITY DECISION REQUIRED.**

This package converts the discovery findings into explicit decisions. No value is treated as approved merely because it is recommended. Any row marked `UNDECIDED` blocks implementation.

## Decision matrix

| # | Decision | Options | Engineering assessment | Proposed direction | Status | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Artifact format | CSV / XLSX | CSV is simpler, streamable, and easier to validate. XLSX is a commercial requirement only if users need workbook features. | Use one explicit artifact type and label it truthfully. | **UNDECIDED** | Product + CTO |
| 2 | Scope | Current page / all matching results | Current page is cheap but easy to misunderstand. All matching results is more useful but needs a server row cap and possibly async generation. | Prefer explicit `all_matching` with a bounded cap if the business needs complete exports. | **UNDECIDED** | Product |
| 3 | Maximum rows | Fixed product limit | An unbounded export is unsafe for 5,000+ schools and large student populations. | Set a finite maximum and publish it in the UI and API contract. | **UNDECIDED** | Product + Operations |
| 4 | Execution | Synchronous / asynchronous artifact | Synchronous is appropriate only for small bounded exports. Large exports need a durable status and expiring artifact. | Define a threshold and support async only if the product requires large exports. | **UNDECIDED** | CTO + Operations |
| 5 | Permission | Student.View / dedicated Student.Export / profile permissions | Read access does not automatically imply permission to extract data. | Use dedicated export permission, with field profiles if sensitive data is allowed. | **UNDECIDED** | Security + CTO |
| 6 | Sensitive fields | Exclude / mask / role-approved inclusion | `nationalId` and `guardianPhone` are not safe defaults for broad exports. | Exclude by default; approve explicit masked or role-scoped profiles if required. | **UNDECIDED** | Data Protection + Product |
| 7 | Audit and retention | No audit / audit event / artifact retention | A formal export is a disclosure event and requires actor, scope, result, and retention evidence. | Audit every decision and retain only according to approved governance policy. | **UNDECIDED** | Security + Compliance |
| 8 | Filename and encoding | Arabic filename / ASCII fallback / UTF-8 BOM | Arabic users need readable names and reliable spreadsheet opening; unsafe filenames must be prevented. | Define UTF-8 content rules, safe filename normalization, and fallback behavior. | **UNDECIDED** | Product + Engineering |
| 9 | Product classification | Data Export / Official Student Report | A data export does not guarantee reporting completeness or approved layout. | Treat this mission as Data Export; open a separate Report contract if needed. | **UNDECIDED** | Product + CTO |

## Non-negotiable security decisions

Regardless of the business choices above, the future implementation must:

- derive tenant, school, branch, academic year, actor, and role from trusted server context;
- reject or ignore client attempts to select another tenant or school;
- enforce authorization before querying export rows;
- apply field-level minimization for national IDs, guardian contacts, and other restricted data;
- avoid storing raw student rows in audit logs;
- use parameterized queries and an allowlist for filters and sort fields;
- emit success only after the artifact is generated and validated;
- audit both denials and successful export operations.

## Scope boundary

This package does not authorize:

- changing `handleExportExcel`;
- adding an export endpoint or service;
- adding permissions;
- creating CSV/XLSX files;
- migrations, schema, RLS, RPC, or database writes;
- changing Student Import, Batch Transfer, Print, Reports, or Tenant/Authorization foundations.

## Exit conditions

The package can become `CONTRACT READY` only after the owner of every row records a final decision, rationale, effective date, and any exception. Otherwise the status remains `BUSINESS/SECURITY DECISION REQUIRED` and implementation is blocked.

