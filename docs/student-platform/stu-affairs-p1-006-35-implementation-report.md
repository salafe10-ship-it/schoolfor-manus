# STU-AFFAIRS-P1-006-35 — Birth Country Canonical API Implementation

## Mission status

`P1-006-35 = BLOCKED — IMPLEMENTATION CONTRACT GAP`

## Blocking finding

The approved contract requires semantic ISO 3166-1 alpha-2 validation and a focused test that rejects a syntactically valid but invalid ISO code. The repository currently contains no approved ISO country-code reference source.

What exists today:

- `students.birth_country_code` is nullable `char(2)`.
- The database check constraint accepts only two uppercase ASCII letters.
- The registration path normalizes to uppercase and checks two-letter syntax.
- Guardian country validation has the same two-letter syntax boundary.

What does not exist:

- an approved country reference table;
- an approved immutable code list;
- an approved package or service that validates ISO alpha-2 membership.

Using the current two-letter regex would falsely pass values such as `ZZ` and would fail the approved P1-006-35 test. Adding a new list or reference source would create a new source of truth and exceed the bounded implementation order.

## Safe action

No code was changed. No partial Read/Patch implementation was introduced. No schema, migration, RLS, API redesign, UI, export, reporting, or production change was made.

## Required unblock

Security/Data Governance/Domain must approve the ISO alpha-2 reference source and its ownership/lifecycle. After that decision, P1-006-35 can be reissued as a bounded implementation order.
