# STU-AFFAIRS-P2-006-66 — Validation

## Contract matrix

| Condition | Print behavior |
|---|---|
| Loading | Blocked with warning; no window opened |
| Error | Blocked with warning; no blank successful report |
| Empty/no-match | Blocked with warning; no empty successful report |
| Search/filter changed | Uses the current server-filtered `filteredStudents` snapshot |
| Current page | Prints only rows currently loaded and visible to the list |
| Guardian phone | Not rendered |
| National ID | Not rendered |
| Browser print | Explicitly labeled as current-view print, not official full report |
| Mutation/API write | None added |
| RTL | Existing RTL document and styles retained |

## Required checks

| Check | Result |
|---|---|
| Print contract tests | PASS — 3/3 |
| Student Affairs regression tests | PASS — focused suite 37/37 across 10 files |
| TypeScript | PASS |
| Vite production build | PASS |
| Server bundle | PASS — 4 existing `import.meta`/CommonJS warnings |
| `git diff --check` | PASS — LF/CRLF normalization warning only |
| Scoped secret scan | PASS |

## Stop condition

If a complete official report is required, this task remains bounded: a separate canonical Reporting contract and endpoint must be approved. No such endpoint is created here.

## Closure

`STU-AFFAIRS-P2-006-66 = CODE-LEVEL CLOSED — STUDENT LIST PRINT TRUTHFULNESS`
