# STU-AFFAIRS-P1-006-33 — Birth Country Read/Edit Implementation

## Mission status

`P1-006-33 = BLOCKED — EXISTING CANONICAL API CONTRACT INSUFFICIENT`

## Root cause

The approved P1-006-32 contract requires `birthCountryCode` to complete the canonical Student Profile Read + Edit path. The current canonical path is not sufficient to implement that contract without introducing new API behavior:

- `CanonicalStudentReadRepository` does not select or project `students.birth_country_code`.
- `StudentWritePatch` does not contain `birthCountryCode`.
- `CanonicalStudentWriteRepository.update` does not validate, write, or return `birth_country_code`.
- `server.ts` does not map `birthCountryCode` into the existing Student update patch.
- The update route supplies a fixed generic audit reason (`Student profile update`); it does not accept or enforce a field-specific correction reason when an existing birth country value changes.

## Supported prerequisites

- `expectedVersion` is already required by the canonical Student update repository.
- The canonical update path already creates server-side audit metadata and returns a persisted Student projection.

These prerequisites do not close the missing Read/Patch/reason contract.

## Safe action taken

No implementation was added. No new mapping, API field, repository path, database change, migration, RLS policy, export/report change, or UI change was invented.

## Required unblock

A separate bounded API/domain decision must approve how a correction reason is supplied and enforced, then a new implementation order must explicitly authorize the canonical Read/Patch changes. Until then, P1-006-33 remains blocked.
