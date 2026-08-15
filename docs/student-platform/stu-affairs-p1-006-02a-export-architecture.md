# STU-AFFAIRS-P1-006-02A — Export Architecture Evaluation

## Purpose

Evaluate the safest architecture for a future Student Data Export without implementing it.

## Product boundaries

### Student Data Export

An authorized, bounded, machine-readable extract of student data. It must describe its artifact type, scope, filters, row count, and retention. It is not automatically an official report.

### Official Student Report

A separate governed product with approved layout, report identity, completeness rules, and likely a separate permission and review process.

### Browser Print

Local rendering of visible UI data. It is not complete export and must not be labeled as an official report.

## Recommended future flow

```text
Authentication
  ↓
Session validation
  ↓
Dedicated export authorization
  ↓
Trusted tenant/school/branch/academic-year context
  ↓
Validate allowlisted filters, sort, scope, and row cap
  ↓
Server-side canonical student query
  ↓
Field profile and data-minimization enforcement
  ↓
Generate and validate CSV/XLSX artifact
  ↓
Append trusted audit event
  ↓
Deliver bounded or expiring artifact
```

## Architecture options

| Option | Strengths | Risks | Decision status |
| --- | --- | --- | --- |
| Keep browser CSV | Minimal change, immediate download | Page-only, no independent authorization/audit, sensitive-field exposure, misleading label | Rejected as production export |
| Synchronous server export | Simple user flow, immediate artifact | Query and memory/time pressure for large exports | Candidate for small bounded exports |
| Asynchronous server artifact | Handles large datasets, explicit status, retry and expiry | Requires durable operation/artifact lifecycle and operations support | Candidate if all-results/large exports are required |
| Official report pipeline | Strong governance and repeatability | Larger product scope and template ownership | Separate future mission |

## Tenant isolation model

The export query must not accept client authority fields as selectors. The server must resolve the effective scope from trusted identity and tenant context. A requested branch or academic year may be accepted only as a permitted filter within the trusted school scope and must be validated against the user’s allowed context. Cross-school and cross-tenant attempts must fail before data query.

## Query and performance model

- Reuse canonical Student read semantics for approved filters and sort fields.
- Do not reuse the current page array as the source for all-results export.
- Enforce a maximum row count before expensive artifact generation.
- Use streaming or asynchronous generation when the approved limit could exceed request memory/time budgets.
- Record query duration, row count, and artifact duration in operational telemetry without recording sensitive row payloads.
- Define cancellation, timeout, retry, and duplicate-request behavior before implementation.

## Idempotency and artifact lifecycle

If generation is asynchronous or retryable, the operation needs an idempotency key scoped to the trusted tenant and actor context. The contract must define:

- operation states;
- duplicate request behavior;
- artifact storage location and encryption;
- expiry and deletion;
- failed-generation retry rules;
- access authorization at download time;
- legal hold or compliance exception behavior, if applicable.

No temporary download URL or artifact retention period is approved by this document.

## Authorization architecture

The preferred model is a dedicated canonical permission such as `Student.Export`, subject to owner approval. Field profiles should be evaluated separately from the base export permission so that operational read access does not implicitly expose restricted identity or guardian contact data.

## Audit architecture

The future export service must emit a trusted event for accepted, denied, failed, and completed operations. Audit metadata should include actor, role, tenant scope, operation ID, artifact type, filter summary, row count, request/correlation IDs, time, and result. Raw rows, full national IDs, and guardian phone numbers must not be copied into audit metadata.

## Explicit exclusions

No implementation, API, permission registry update, SQL, migration, RLS, storage bucket, RPC, or production deployment is part of P1-006-02A.

