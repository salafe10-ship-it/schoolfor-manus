# STU-AFFAIRS-P1-006-02 — Student Export Contract

## Contract status

**Design proposal only — not authorized for implementation.**

This contract separates three concepts:

1. **Student Data Export** — a bounded machine-readable data artifact.
2. **Official Student Report** — a governed report with approved layout, completeness, and report identity.
3. **Browser Print** — local printing of already visible UI data.

The current `تصدير Excel` action is none of these at enterprise level; it is a page-only browser CSV download and must remain classified as legacy until a contract is approved.

## Proposed request contract

Implementation must define a server endpoint only after approval. The request must carry:

- trusted authenticated identity from the session;
- trusted tenant/school/branch/academic-year context resolved server-side;
- the same approved search, filter, and sort semantics as the Student grid;
- an explicit export scope (`current_page` or `all_matching`) rather than an implicit choice;
- an idempotency key if generation is asynchronous or retried;
- request and correlation identifiers generated or validated by the trusted server context.

Client values must never select a different school, tenant, branch, academic year, actor, or audit identity.

## Required response contract

The final implementation must return a truthful result containing:

- export operation ID;
- artifact type (`csv` or `xlsx`);
- scope used;
- applied filter summary;
- exported row count;
- generated timestamp in UTC;
- expiry/retention information;
- download status or a safe download reference;
- request ID and correlation ID;
- failure code and retry guidance when generation fails.

No success response may be emitted until the artifact is actually generated and validated.

## Fields and data minimization

The default export should use the minimum approved student fields. The following fields require an explicit decision:

| Field | Current inclusion | Decision required |
| --- | --- | --- |
| Student number | Yes | Retain as operational identifier. |
| Student name | Yes | Retain; classification and masking policy required. |
| National ID | Yes | Restricted/sensitive; default should be excluded or masked unless business need and permission are approved. |
| Classroom/section | Yes | Retain if part of approved enrollment projection. |
| Guardian name | Yes | Decide whether required for the export use case. |
| Guardian phone | Yes | Sensitive personal data; default should be excluded or masked unless explicitly authorized. |
| Status | Yes | Retain as operational status. |

The contract must define export profiles if different operational roles need different field sets. A broad `Student.Export` permission alone must not automatically expose restricted identifiers.

## Authorization and tenant isolation

The implementation must use one canonical authorization decision for export. Recommended permission: `Student.Export`, subject to registry and role approval. The endpoint must execute in this order:

`Authentication → Session Validation → Authorization → Tenant Context → Query → Audit → Artifact Delivery`

The school/tenant scope must come from the trusted identity and tenant context. Any client `schoolId`, `tenantId`, `branchId`, or academic-year override must be ignored or rejected. Export queries must use parameterized server-side filters and must not reuse arbitrary client-provided SQL/order fragments.

## Audit requirements

Every accepted and denied export request must produce a trusted audit event containing at least:

- actor/user ID and resolved role;
- tenant, school, branch, and academic-year context;
- permission and decision;
- export operation ID;
- artifact type and scope;
- normalized filter summary without raw sensitive values;
- requested and delivered row count;
- request ID, correlation ID, timestamp, and outcome;
- failure reason when denied or failed.

Payloads and logs must not store raw student rows or guardian phone numbers. Audit retention must follow the platform governance policy.

## Format decision matrix

| Decision | Options | Recommendation before implementation |
| --- | --- | --- |
| Artifact | CSV / true XLSX | Choose one explicitly. CSV is simpler and safer; XLSX is required only if spreadsheet features are a commercial requirement. |
| Scope | Current page / all matching | Default to explicit `all_matching` only with a server row cap; never imply all results from a page export. |
| Delivery | Immediate / asynchronous artifact | Immediate for bounded small exports; asynchronous for larger exports with status and expiry. |
| Maximum rows | Product and capacity decision | Must be finite, documented, and enforced server-side. |
| Permission | Existing Student.View / dedicated Student.Export | Dedicated export permission is recommended. |
| Report identity | Data export / official report | Data export must not be labeled official report. |
| Filename | Arabic / transliterated | Define safe UTF-8 filename and fallback behavior. |
| Retention | Download-only / expiring artifact | Expiring artifact is recommended for asynchronous generation. |

## Failure and empty-state contract

- Zero matching records: return a truthful empty result; do not create a misleading success file unless the product explicitly approves an empty artifact.
- Authorization denial: return 403 and create a denial audit event.
- Invalid filter/sort/scope: return 400 with a stable validation code.
- Tenant mismatch or spoofing: reject before query execution and audit the denial.
- Timeout or artifact failure: return a stable failure code; never show success.
- Expired artifact: return an explicit expiry state and require a new authorized request.

## Acceptance criteria for a future implementation

1. Export includes exactly the approved scope and fields.
2. Cross-tenant and client-selected school access is impossible.
3. Permission, denial, and success audit coverage is testable.
4. Row cap, pagination semantics, and performance budget are enforced.
5. CSV/XLSX encoding and escaping are covered by tests, including Arabic and formula-injection cases.
6. The UI label states the real artifact type and scope.
7. The server returns success only after artifact validation.

