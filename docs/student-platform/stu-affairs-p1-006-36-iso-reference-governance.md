# STU-AFFAIRS-P1-006-36 — ISO Country Reference Governance

## Decision

`P1-006-36 = ISO REFERENCE OWNER/SECURITY/DATA GOVERNANCE DECISION REQUIRED`

## Reference source review

No existing, approved ISO 3166-1 alpha-2 reference was identified in the project.

The repository contains only:

- `students.birth_country_code char(2)`;
- a two-uppercase-letter database check constraint;
- registration and guardian normalization that checks syntax only.

No country reference table, immutable application catalog, approved package/library, external reference service, or institutional reference document is present in the inspected project files.

The syntax check is not an ISO membership source and must not be treated as one.

## Ownership decision still required

The following owners are not assigned by the current architecture evidence:

- Reference Owner: unassigned.
- Security Owner: unassigned.
- Data Governance Owner: unassigned.
- Technical Owner: unassigned.

No owner may be inferred from the Student domain merely because Student stores the field.

## Safe governance constraints

- The chosen source must be local or preloaded; it must not send confidential Student data to an external service.
- The source must have a version and provenance.
- Reference updates must be reviewed and auditable.
- Historical Student values must not become invalid merely because a reference version changes; existing records require an explicit compatibility policy.
- No database, package, list, service, migration, or data cleanup is authorized by this decision package.

## Existing-data boundary

This repository inspection did not execute SQL or inspect live records. No seed data containing birth-country values was found in the inspected project files. Current counts, NULL counts, and invalid-value counts remain unknown and require a separately authorized read-only environment check.
