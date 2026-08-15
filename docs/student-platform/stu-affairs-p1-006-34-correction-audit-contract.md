# STU-AFFAIRS-P1-006-34 — Correction and Audit Contract

## Ownership

- API/domain boundary: validates `correctionReason`, determines whether it is required, and passes the normalized business reason into the trusted canonical write boundary.
- Canonical write boundary: compares the current value under row lock, enforces `expectedVersion`, persists the field, increments version, and creates the audit event in the same transaction.
- Audit layer: supplies trusted actor, tenant, school, branch, request/correlation IDs, and server time; records the validated reason and change classification.

## Required audit event

For a committed change, record:

- entity type: `student`;
- entity ID;
- field: `birthCountryCode`;
- action: `UPDATE`;
- actor user ID from trusted identity;
- tenant, school, and branch from trusted context;
- previous and new value presence/classification (`CONFIDENTIAL`), not raw values by default;
- whether the normalized value changed;
- validated correction reason when required;
- expected version and resulting version;
- server-generated timestamp;
- request ID and correlation ID;
- success result.

Raw country values must not be placed in audit metadata unless a separately approved Data Protection policy permits it. The current contract intentionally records classification and change facts without exposing the raw value.

## Atomicity and failure

The Student update and its audit event share one canonical transaction. If validation, version check, audit insertion, persistence, or response projection fails, no Student change is committed and no successful response is emitted.

## Integrity safeguards

- Client cannot provide actor, tenant, school, branch, timestamp, audit ID, request ID, or correlation ID as trusted identity values.
- A client-provided reason is business input only; it cannot override trusted audit metadata.
- A reason is not accepted for an unrelated field or operation.
- No raw value is echoed into logs or error messages.
