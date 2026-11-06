# Student Affairs browser review fixes — 2026-10-18

The live browser review found a failing Student 360 read, confusing private document registration, duplicated class choices, and silent certificate issuance feedback.

## Changes

- Remove the Student 360 attendance predicate on `attendance_records.deleted_at`. The canonical attendance migration has no such column. Tenant, school, student, and branch predicates remain.
- Place the private file chooser inside the registration dialog/form. Derive filename, media type and size from the chosen file, and leave the server-computed hash empty instead of showing a fabricated hash.
- Explain missing document categories and offer a retry. Categories still require canonical configuration; this change does not invent or seed them.
- Resolve legacy class references through the canonical academic catalog before constructing print choices.
- Show certificate issuance progress and a persistent error, and prevent concurrent duplicate submissions.
- Align the registration settings text with server-assigned student numbers.

## Validation

- `npm run lint`: passed.
- `npm run build:spa`: passed; existing large-chunk warnings remain.
- `studentDocumentsPortal`, `studentAffairsClosureContract`, and `studentAffairsQueryMetaContract`: 48 tests passed, including three new regressions.
- `studentAffairsCanonicalAcademicContext` and `stuAffairsP2StudentListPrint` also passed in the preceding focused run.

## Remaining runtime verification

The fixes have not been deployed or retested against the live database. Certificate issuance additionally requires its signing secret and migration. Document uploads require configured categories and private storage. Live creation, import, deletion, suspension, actual print output and Excel file contents were not certified by this review. A missing download event in browser automation was inconclusive, not proof of an export failure.
