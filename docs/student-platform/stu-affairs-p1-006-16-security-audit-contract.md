# STU-AFFAIRS-P1-006-16 — Security and Audit Contract

## 1. Security pipeline

Every official server artifact must be designed in this order:

`Authentication → Permission → Trusted Tenant Context → Resource Scope → Canonical Query → Field Profile → Artifact Generation → Audit → Delivery`

The client must not determine tenant, school, branch, actor, role, or audit identity. Client filters may only narrow the trusted scope after validation.

## 2. Required controls by artifact

| Artifact | Permission decision | Tenant/school/branch | Student object scope | Sensitive field policy | Audit requirement |
|---|---|---|---|---|---|
| Student Data Export | Existing `Student.Export` | Trusted context; server query | Approved list filters | Current operational profile | Existing export lifecycle events retained |
| Official Student List | New distinct permission proposed; Security approval required | Trusted context | List filters validated within scope | Official List profile only | Accepted/denied/failed/generated/delivered |
| Browser Print | No official-report permission; must be labeled local print if retained | Not an authority path | Current rendered object only | Must not be called official; sensitive fields require UI policy | No certification based on browser notification |
| Enrollment Certificate | New issuance permission proposed; Owner/Security approval required | Trusted context | Student and enrollment validity | Certificate profile only | Issuance, denial, failure, generation, delivery, revocation if approved |
| Student ID Card | New issuance permission proposed; Owner/Security approval required | Trusted context | Student and school/branch validity | ID-card profile only; no national ID/guardian phone by default | Issuance, denial, failure, generation, delivery, revocation |
| Academic Transcript | Blocked until Results/GPA source approval | Trusted academic context | Student academic scope | Transcript profile after source approval | Required after source approval |
| Financial Statement | Finance-owned permission and scope | Finance trusted context | Finance account/object scope | Finance field profile | Finance-owned lifecycle events |

## 3. Audit event model

For each official artifact, the design must distinguish:

- **Accepted:** request passed authentication, authorization, scope, and input validation.
- **Denied:** request rejected before generation, including missing permission or cross-scope attempt.
- **Failed:** accepted request failed during query, generation, or delivery.
- **Generated:** artifact bytes were successfully created.
- **Delivered:** artifact was returned through the approved delivery mechanism.
- **Downloaded:** only where the delivery mechanism can prove the event.

Audit metadata should include actor, role, trusted tenant/school/branch, artifact code/version, operation ID, request ID, correlation ID, time, result, and reason. It must not contain raw student rows, national IDs, guardian phone numbers, medical data, or financial values.

## 4. Retention and delivery

- Retention is **UNDECIDED** for every new artifact until the Owner/Compliance decision is recorded.
- Delivery mode is **UNDECIDED** for every new artifact except the existing bounded XLSX download path.
- A temporary artifact URL, signed URL, storage bucket, or archive period must not be invented by implementation.
- Generation success must never be reported as delivery success.

## 5. Current security findings carried forward

- `handlePrintList` is not a server-authoritative report path and currently includes guardian phone in browser-generated HTML.
- The active ID-card preview displays restricted identity/contact values, while official printing is disabled.
- Generic `ReportService` is not evidence of a governed Student Affairs pipeline.
- The Authorization hardening path remains blocked by Security approval; this contract does not add permissions or modify authorization code.

## 6. Approval gates

Implementation remains blocked until:

1. Owner approves artifact codes, formats, business meaning, and field profiles.
2. Security approves permissions, trusted scope, sensitive-field exposure, delivery, audit, and retention.
3. Results/GPA owner approves the authoritative source before transcript work.
4. Finance owner approves any financial statement boundary.

