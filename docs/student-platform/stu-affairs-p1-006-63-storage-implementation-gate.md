# STU-AFFAIRS-P1-006-63 — Storage Implementation Gate

## Mission boundary

This is a documentation-only decision gate for the Student Affairs binary-storage capability. It does not create or change a bucket, policy, SQL, migration, RLS rule, API, service, repository, upload flow, download flow, scanner, UI, authorization rule, tenant model, staging environment, or production environment.

## Current decision

`P1-006-63 = BLOCKED — STORAGE OWNER APPROVALS UNAVAILABLE`

The existing engineering proposals are not approvals. No implementation may begin until the required owner decisions below are recorded and internally consistent.

## Approval evidence matrix

| Decision gate | Required evidence | Owner(s) | Status | Implementation consequence |
|---|---|---|---|---|
| Private provider and bucket | Named provider, private bucket name, provisioning owner, and environment scope | Architecture, Security, Operations | UNAVAILABLE | No bucket or policy |
| Trusted object-key construction | Approved server-derived tenant/school/branch/student/document/version key contract | Security, Architecture | UNAVAILABLE | No upload capability |
| Quarantine, scan, finalize | Approved state machine, scanner owner, pass/fail rules, and finalization authority | Security, Operations, API | UNAVAILABLE | No object can become verified |
| MIME and magic bytes | Approved detected-content allow-list and rejection rules | Security, Data Protection | UNAVAILABLE | No binary acceptance |
| Maximum size | Approved global limit and document-class overrides | Product, Data Protection | UNAVAILABLE | No upload limit can be selected |
| Delivery | Approved signed-URL or server-delivery contract, exact-object binding, and expiry | Security, API | UNAVAILABLE | No download or preview |
| Encryption | Approved provider and application-layer encryption requirements by classification | Security, Data Protection | UNAVAILABLE | No storage security configuration |
| Retention and legal hold | Retention schedule, archive rules, legal-hold semantics, and release authority | Compliance, Product | UNAVAILABLE | No archive or purge |
| Purge and reconciliation | Approved purge authority, orphan workflow, retry/dead-letter, alerts, and recovery evidence | Operations, Security | UNAVAILABLE | No destructive cleanup |
| Storage-object relationship | Approved `storage_object` relationship to immutable document version, cardinality, uniqueness, and deletion rules | Schema, Architecture | UNAVAILABLE | No schema or migration |
| Idempotency and versioning | Approved prepare/finalize/retry keys, fingerprint rules, and immutable version behavior | API, Domain, Operations | UNAVAILABLE | No command implementation |

## Required evidence form

Each decision must identify the approver, role, decision date, exact decision, affected environment, and any exception expiry. A recommendation or prior design document is not sufficient evidence.

## Gate result

The gate is not passed. The correct next action is owner approval collection, not implementation. P1-006-63 contains no runtime mutation.

