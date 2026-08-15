# ENROLL-SCHEMA-ALIGN-001 — Validation Report

Date: 2026-08-11

## Static validation

| Check | Result |
|---|---|
| Migration file created | PASS |
| Existing migration modified | PASS — no |
| Exact transition added | PASS — `active → withdrawn` |
| Existing transitions preserved | PASS — static test |
| Extra transitions added | PASS — none in the replacement contract |
| Tables/functions/triggers/policies created | PASS — none |
| Transactional DDL wrapper | PASS |
| Source scope | PASS — only focused migration and focused test |
| `git diff --check` | PASS |

## Test status

- Focused static migration tests: PASS — 1 file, 3 tests in `src/__tests__/enrollSchemaAlign.test.ts`.
- Live PostgreSQL execution: not performed in this workspace.
- Live rollback and constraint acceptance tests: not claimed; require isolated staging database execution.
- TypeScript: PASS — `tsc --noEmit --project tsconfig.json`.
- Full Vitest: PASS — 30 files, 159 tests.
- Vite production build: PASS — 3,049 modules transformed.
- Server bundle: PASS — `dist/server.cjs` generated successfully.
- `git diff --check`: PASS for the focused migration, test and reports.

Known non-blocking existing warnings:

- Vite reports the existing PostingEngine dynamic/static import overlap and large chunks.
- The server bundle reports the existing `import.meta`/CommonJS warnings.

## Decision

The artifact is ready for static validation and staging review. It is not a production certification and does not authorize execution against production.
