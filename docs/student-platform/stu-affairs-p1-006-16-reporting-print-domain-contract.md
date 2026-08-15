# STU-AFFAIRS-P1-006-16 — Reporting & Print Domain Contract

## 1. Contract status

Architecture, product, and security design only. No API, source implementation, permission change, database, SQL, RLS, migration, staging, or production change is authorized by this document.

## 2. Objective

Define one governed contract before any new Student Affairs reporting or printing service is implemented. The following artifacts are separate products and must not be collapsed into one generic report function:

1. Student Data Export
2. Official Student List Report
3. Browser Print
4. Enrollment Certificate
5. Student ID Card
6. Academic Report / Transcript
7. Student Financial Statement

## 3. Global report pipeline

Every server-owned artifact must be designed around this order:

`Authentication → Permission → Trusted Tenant Context → Resource Scope → Canonical Query → Field Profile → Artifact Generation → Audit → Delivery`

The artifact generator must not use client `tenantId`, `schoolId`, `branchId`, actor identity, current-page arrays, local fallback values, or UI labels as authority. A requested branch, academic year, or student filter may only narrow an already trusted scope and must be validated against that scope.

## 4. Browser Print versus Official Report

### Browser Print

`UI → window.print()` is a presentation convenience only. It may print the current rendered view when explicitly labeled as a local print view. It must not be called an official report, certificate, card, transcript, or certified extract. No new server artifact or approval claim is implied.

### Official Report

An official report is a server-generated artifact with a report code, version, approved field profile, trusted scope, generation result, audit trail, and governed delivery. It must be reproducible from a canonical source of truth and must not serialize the current browser page.

## 5. Artifact contracts

### 5.1 Student Data Export

- **Current status:** Canonical path already proven by P1-006-03.
- **Source of truth:** Canonical Student read repository.
- **Mode:** Synchronous bounded server generation.
- **Format:** XLSX.
- **Permission:** Existing `Student.Export`; no new permission is added here.
- **Scope:** Trusted tenant, school, branch, and authenticated resource scope.
- **Field profile:** Operational export only; excludes national ID and guardian phone.
- **Retention:** UNDECIDED; current bounded download is not a long-lived archive.
- **Audit:** Accepted, rejected, failed, successful/generated, and delivered/downloaded semantics must remain distinguishable.

### 5.2 Official Student List Report

- **Status:** Design required; current `handlePrintList` is not this artifact.
- **Source:** Canonical Student read repository, not `filteredStudents`.
- **Mode:** Server-generated artifact; synchronous or asynchronous mode requires owner decision after volume testing.
- **Format:** PDF or approved printable format — UNDECIDED.
- **Report code/version:** UNDECIDED and requires owner approval.
- **Permission:** Proposed distinct Student Affairs report permission; exact registry name requires Security/Owner approval.
- **Scope:** Trusted tenant/school/branch context; filters only narrow trusted scope.
- **Fields:** Use the approved Official List profile in the field matrix.
- **Retention/delivery:** UNDECIDED.

### 5.3 Browser Print

- **Status:** Existing convenience behavior is PARTIAL.
- **Source:** Current rendered view only.
- **Mode:** Browser presentation.
- **Officiality:** Must be labeled local print/preview if retained; it is not a certified report.
- **Permission/scope/audit:** The current component does not establish a dedicated print contract. No implementation change is authorized by this document.

### 5.4 Enrollment Certificate

- **Status:** Not implemented; visible UI is a disabled placeholder.
- **Source:** Enrollment aggregate and approved academic context; exact source contract requires Enrollment/Academic owner approval.
- **Mode/format:** Server artifact with verification identity; format and delivery UNDECIDED.
- **Permission:** Proposed distinct issuance permission; exact name requires approval.
- **Scope:** Trusted student object within trusted tenant/school/branch scope.
- **Dependencies:** Admission/enrollment validity, current academic context, approval authority, and certificate numbering.
- **Retention:** UNDECIDED.

### 5.5 Student ID Card

- **Status:** Not implemented; preview only, official print disabled.
- **Source:** Canonical student identity and approved school identity data.
- **Mode/format:** Server-issued card artifact; physical/digital delivery UNDECIDED.
- **Permission:** Proposed distinct issuance permission; exact name requires approval.
- **Scope:** Trusted student object and school/branch context.
- **Sensitive content:** Never copy national ID or guardian phone by default; use the ID-card field profile.
- **Retention/revocation:** UNDECIDED.

### 5.6 Academic Report / Transcript

- **Status:** Not implementable from the current Student Affairs evidence.
- **Source dependency:** Authoritative Results/GPA source required (`P0-006-05/06`).
- **Mode/format/permission:** UNDECIDED pending Results owner decision.
- **Scope:** Trusted student and academic context.
- **Blocking rule:** No current Results or GPA fallback may be used as a certified transcript source.

### 5.7 Student Financial Statement

- **Status:** Not a Student Affairs source-of-truth artifact.
- **Source:** Finance domain must own balances, invoices, payments, and statement lines.
- **Mode/format/permission/scope:** Requires Finance owner and Security decisions.
- **Boundary:** Student Affairs may request or link to an approved Finance artifact later; it must not calculate or certify financial values.

## 6. Artifact lifecycle

Each server artifact contract must distinguish these events:

- `accepted` — request passed authentication, permission, scope, and input validation.
- `denied` — request rejected before artifact generation.
- `failed` — generation or delivery failed after acceptance.
- `generated` — artifact bytes were created successfully.
- `delivered` — artifact was returned or a governed delivery completed.
- `downloaded` — only where the delivery mechanism can prove download initiation/completion.

The current browser print notification is not evidence of any of these server lifecycle events.

## 7. Approval gates

- Owner approval is required for report codes, artifact names, formats, field profiles, retention, and business meaning.
- Security approval is required for new permissions, sensitive fields, delivery, audit, and tenant/resource scope.
- Results/GPA owner decision is required before Academic Transcript design can become executable.
- Finance owner decision is required before any financial statement integration.

## 8. Final contract decision

`REPORTING/PRINT CONTRACT READY — OWNER/SECURITY APPROVAL REQUIRED`

