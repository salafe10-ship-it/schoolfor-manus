# STU-AFFAIRS-P1-006-32 — Birth Country API Contract

## Contract status

Approved for a future bounded implementation. This document does not modify the API.

## Read contract

The canonical Student Profile projection may return:

```text
birthCountryCode: string | null
```

The value must come from `students.birth_country_code` under the existing trusted tenant, school, and branch scope. `null` means not recorded. The API must not derive it from nationality, address, guardian data, browser state, headers, or query parameters.

## Create contract

- Optional input: `birthCountryCode`.
- Normalize by trim and uppercase.
- Validate the exact two-letter syntax and the approved ISO alpha-2 reference.
- Persist only the normalized canonical value or `null`.
- Return the canonical persisted Student projection.

## Edit contract

- Optional patch member: `birthCountryCode`.
- Presence means replace; explicit `null` means clear, subject to policy and audit.
- Apply the same normalization and semantic validation as Create.
- Require `expectedVersion`.
- Require trusted actor/tenant context and server-generated audit metadata.
- Require a correction reason when replacing an existing non-null value.
- Return the canonical persisted Student projection only after successful persistence.

## Error semantics

- Invalid format/reference: validation error; no write.
- Missing or stale expected version: optimistic-concurrency conflict; no success response.
- Unauthorized or cross-tenant target: authorization/tenant denial; no write.
- Persistence failure: failure response; no success message and no fabricated projection.

## Audit semantics

Changes record the Student entity, previous and new normalized values where permitted by audit policy, actor, tenant/school/branch, request ID, correlation ID, server time, and correction reason. Audit metadata is never accepted from the browser.

## Non-contract

This decision does not authorize changes to database schema, SQL, RLS, repository code, export routes, reporting routes, or UI. Those require a separate bounded implementation order.
