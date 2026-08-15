# STU-AFFAIRS-P1-UI-007 — Validation

## Required behavior

- No success claim before the save request: PASS by focused contract test.
- Success only after awaited canonical response: PASS by focused contract test.
- No success on validation failure, exception, non-2xx, timeout, or unknown outcome: PASS by existing failure branches and focused contract test.

## Engineering checks

- Focused tests: PASS (12/12 across the UI containment and related Student Affairs contracts).
- TypeScript `--noEmit`: PASS.
- Vite production build: PASS; existing large-chunk warnings remain.
- Server bundle: PASS; four pre-existing `import.meta`/CJS warnings remain in FinancialClosing files.
- Full Vitest: 557 PASS, 2 FAIL in duplicated pre-existing UnitOfWork tests under `.pnpm-store/v11/projects/...` and `.p10603-isolation/...`; both fail with `Nested UnitOfWork is prohibited` and are outside this mission.
- Scoped `git diff --check`: PASS.
- Scoped secret scan: PASS; no literal secret patterns found.

## Mission status

`STU-AFFAIRS-P1-UI-007 = CODE-LEVEL CLOSED / CONSULTANT REVIEW PENDING`
