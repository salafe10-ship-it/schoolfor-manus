# STU-AFFAIRS-P0-001 — Validation Report

## Validation Scope

This validation covers only the Student Affairs Excel import path changed by `STU-AFFAIRS-P0-001`. It does not certify database, RLS, authentication, authorization, tenant isolation or production infrastructure.

## Acceptance Matrix

| Check | Expected | Result |
|---|---|---|
| No file selected | No success and no mutation | PASS — the modal has no import action |
| Fake success timer | Must not exist | PASS — handler and timer removed |
| Hard-coded imported count | Must not exist | PASS — no count is displayed |
| Fake audit event | Must not be emitted | PASS — `IMPORT_EXCEL` emission removed from this path |
| Canonical import API | Use only if available | NOT AVAILABLE — no safe canonical path was found in scope |
| Safe unavailable state | Explicitly tell the operator no import occurred | PASS |
| Database mutation | Must not occur | PASS — no database call was added |

## Automated Tests

- Focused import regression: **PASS**, 1 test.
- TypeScript (`pnpm run lint`): **PASS**.
- Full Vitest: **PASS**, 34 test files and 177 tests.
- Server esbuild bundle: **PASS**.
- `git diff --check`: **PASS**, no whitespace errors. Git reported existing line-ending warnings only.

## Known Independent Blocker

Vite browser production build remains blocked by the pre-existing import in `src/tenant/TenantContext.ts`:

```text
AsyncLocalStorage is not exported by __vite-browser-external
```

This is outside `STU-AFFAIRS-P0-001`, was not modified, and remains assigned to the separate `STU-AFFAIRS-P0-005` mission.

## Decision

**STU-AFFAIRS-P0-001: PASS — FAIL-CLOSED**

The application no longer claims that Excel import succeeded when no canonical import operation exists.
