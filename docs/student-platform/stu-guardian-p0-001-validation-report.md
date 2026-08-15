# STU-GUARDIAN-P0-001 — Validation Report

## Focused Acceptance Tests

| Check | Result |
|---|---|
| Missing trusted context fails closed | PASS |
| Same tenant, school, and branch read | PASS |
| Foreign school read | PASS — blocked |
| Foreign tenant read | PASS — blocked |
| Caller-selected school on create | PASS — rejected |
| Foreign relationship update | PASS — rejected |
| Foreign relationship delete | PASS — no write, returns false |
| Supabase scope predicates | PASS |
| Client scope fields cannot override trusted scope | PASS |

## Automated Results

```text
Guardian focused suite: 6 passed / 6
Related Guardian, Student Registration, Tenant Isolation, and RLS suites: 36 passed / 36
Full Vitest suite: 176 passed / 176 across 33 files
TypeScript --noEmit: PASS
Server bundle: PASS
git diff --check: PASS for changed source and test files
```

## Build Note

The Vite browser build remains blocked by a pre-existing out-of-scope issue in
`src/tenant/TenantContext.ts`: the browser bundle imports `AsyncLocalStorage`
from `node:async_hooks`. Fixing it would require changing the shared tenant
infrastructure, which is explicitly outside STU-GUARDIAN-P0-001. It was not
changed in this mission.

The server bundle completed with four pre-existing `import.meta`/CommonJS
warnings in financial closing modules; no Guardian-related warning occurred.

## Final Boundary

These tests are static/in-memory and code-level. They do not prove live RLS or
live cross-tenant behavior. `PLATFORM-EVIDENCE-002` remains closed as
`BLOCKED + RCA` and is not reopened or bypassed.
