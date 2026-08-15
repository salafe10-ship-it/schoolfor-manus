# STU-AFFAIRS-P1-006-37 — ISO Reference Owner Decision Handoff

## Status

`P1-006-37 = APPROVAL PENDING — P1-006-35 REMAINS BLOCKED`

This is a formal decision handoff. The engineering team must not select the reference, assign owners, or implement a validator.

## Decision required

The owning authority must select exactly one official source:

1. an existing institutional reference;
2. a locally maintained versioned reference approved for this platform;
3. an institutionally approved package/library;
4. another source explicitly approved by Data Governance.

No option is selected in the current project evidence.

## Required named owners

The approval must name an accountable organization or role for each:

- Reference Owner: not provided;
- Security Owner: not provided;
- Data Governance Owner: not provided;
- Technical Owner: not provided.

“TBD” is not an approval and cannot unblock implementation.

## Runtime boundary

The approved runtime policy must be local validation only, or explicitly document another approved runtime policy. Student data must not be sent to an external service merely to validate a country code.

## Existing-data follow-up

After the source and version are approved, a separate read-only inspection may report NULL count, distinct values, invalid values, and distribution. No cleanup or migration is included in this handoff.
