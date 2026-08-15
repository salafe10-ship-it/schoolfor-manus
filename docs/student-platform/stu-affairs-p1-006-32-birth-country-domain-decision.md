# STU-AFFAIRS-P1-006-32 — Birth Country Domain Decision

## Decision

`P1-006-32 = BIRTH COUNTRY CONTRACT APPROVED FOR IMPLEMENTATION`

This is an architecture decision only. No code, API, repository, database, migration, RLS, export, report, or UI implementation is included in this mission.

## Canonical ownership

`birthCountryCode` is an official Student Profile field owned by the Student domain and sourced only from `public.students.birth_country_code`. Its ownership does not create a dependency on Enrollment, Academic Status, Guardian, or Admission.

## Profile contract

The approved contract is **Read + Edit**:

- Create accepts the value when supplied.
- Read exposes the canonical value under the trusted Student Profile projection.
- Edit permits correction of the Student record after registration.
- An empty value is represented as `null`/not recorded; no synthetic value is allowed.
- The field does not control lifecycle, enrollment placement, admission, or authorization.

## Validation and normalization

- Nullable: yes.
- Normalization: trim, then uppercase.
- Syntax: exactly two ASCII letters when non-null.
- Semantic contract: the two-letter value must be an approved ISO 3166-1 alpha-2 country code. The implementation must use the platform's approved country reference/validation source; the existing database shape alone is not evidence of a complete country registry.
- Invalid, unsupported, or whitespace-only values are rejected rather than silently persisted.

Create and Edit use the same field validation semantics. The Edit operation must additionally use optimistic concurrency and return the canonical persisted projection.

## Change policy

The value may be corrected after registration. A correction is a normal Student Profile data correction, not a status or enrollment transition. Edit requires:

- trusted authenticated actor and tenant context;
- expected Student `version`;
- server-generated audit metadata;
- a non-empty correction reason when changing an existing non-null value;
- canonical response after persistence.

Conflicts return the platform's standard optimistic-concurrency error and must not report success.

## Presentation and downstream use

- Student Profile UI: yes, after the bounded implementation order is issued.
- Authorized detailed Student Profile export: yes.
- Official detailed Student Profile report: yes.
- Summary rosters and bulk exports: not by default; inclusion requires the existing export/report permission and classification policy.

## Privacy classification

Classify as `CONFIDENTIAL` personal data. It is not public directory data. Access is tenant/school/branch scoped and must follow existing Student Profile authorization and audit controls. No separate encryption design is introduced by this decision; existing transport, database, backup, and access-control protections remain required.

## Scope boundary

No new source of truth is created. `email`, `phone`, `address`, `religion`, and `nationalId` remain outside the EWP-001 Student contract. `classroom`, `section`, `status`, and `admissionReference` remain owned by their existing domains.
