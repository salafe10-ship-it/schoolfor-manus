# STU-AFFAIRS-P1-006-36 — ISO Validation Contract

## Conceptual pipeline

```text
Input
  → trim
  → uppercase
  → exact two ASCII letters
  → lookup in the approved ISO alpha-2 reference version
  → accept or reject
```

## Required behavior

- `null` is allowed when the Student field is not recorded.
- A non-null value must be exactly two ASCII letters after normalization.
- A syntactically valid value is accepted only if present in the approved reference version.
- `ZZ` is rejected when absent from that approved reference.
- Validation must be deterministic and local to the platform boundary.
- The validator must expose the reference version in diagnostics or audit metadata without exposing Student data externally.

## Historical data policy

The owner decision must define whether validation uses:

- the current reference only; or
- a versioned snapshot that preserves historical validity.

No cleanup, migration, or automatic rewrite of existing Student values is permitted before that policy is approved.

## Privacy boundary

Only the country code is sent to the local reference validator. No name, student ID, tenant ID, birth date, or other Student data may be sent to an external reference service.
