# STU-AFFAIRS-P2-006-66 — Student List Print Truthfulness

## Scope

Only `handlePrintList` and the current browser-print path in `src/components/StudentAffairsPortal.tsx` were changed. No Reporting API, report service, database, SQL, migration, RLS, authorization, tenant, Student Read, Timeline, Export, Lifecycle, Bulk, Graduation, ISO, Storage, Binary, staging, or production surface was changed.

## Root cause

The browser print path used the currently loaded `filteredStudents` snapshot but labeled it as an approved student list. It also allowed print attempts while the list was loading, failed, or empty, which could create a misleading blank print window.

## Fix

- Loading blocks printing and asks the user to wait.
- A list-loading error blocks printing and asks the user to retry.
- An empty current result blocks printing and reports that no rows are displayed.
- The print dataset remains the current `filteredStudents` result, which is the server-filtered current page already held by the UI.
- The document title and heading now explicitly describe a browser print of currently loaded/filtered rows.
- The output explicitly states that it is not a complete official report.
- Guardian phone and National ID remain absent from the printed HTML.
- No mutation or API write was added.

## Validation outcome

All required checks passed:

- Focused Student Affairs suite: 37/37 tests passed across 10 test files.
- TypeScript: passed.
- Vite production build: passed.
- Server bundle: passed; existing `import.meta`/CommonJS warnings are non-blocking.
- `git diff --check`: passed; Git reported only the existing LF/CRLF normalization warning.
- Scoped secret scan: passed.

## Decision

`STU-AFFAIRS-P2-006-66 = CODE-LEVEL CLOSED — STUDENT LIST PRINT TRUTHFULNESS`.

This closes the browser-print truthfulness defect only. An official complete report remains outside this bounded mission and requires a separately approved Reporting contract and endpoint.
