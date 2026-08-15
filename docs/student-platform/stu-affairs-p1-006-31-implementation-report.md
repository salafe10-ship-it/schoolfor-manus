# STU-AFFAIRS-P1-006-31 — Preferred Name UI Parity

## Scope

This bounded change closes the approved preferred-name UI parity gap. It does not redesign the Student domain or modify database, RLS, authorization, tenant isolation, enrollment, lifecycle, or API contracts.

## Implementation

- Added `preferredName` to the Student Affairs profile form state.
- Bound the field to the existing canonical Create/Edit payload.
- Restored the value from the existing canonical Student read projection when editing.
- Added the optional profile input with an explicit empty-state behavior.
- Preserved canonical response gating: success messaging is emitted only after a persisted canonical Student response exists.
- Kept the existing optimistic `version` field and all unrelated canonical fields unchanged.

## Existing canonical support used

- `server.ts` already maps `preferredName` into the canonical patch/registration command.
- `CanonicalStudentReadRepository` already projects `students.preferred_name`.
- `CanonicalStudentWriteRepository` already persists `preferredName` when supplied.

## Explicit non-scope

`birthCountryCode` remains deferred pending the domain/API decision recorded by P1-006-30. No Student schema, migration, RPC, RLS, or service redesign was introduced.

## Result

The preferred name can now be entered, edited, displayed from the canonical projection, and left empty without a synthetic fallback.
