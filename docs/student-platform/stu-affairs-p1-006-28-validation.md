# STU-AFFAIRS-P1-006-28 — Validation Report

Status: `PASS — CODE-LEVEL CLOSED — PROFILE UI TRUTHFULNESS`

## Tests and checks

| Check | Result |
|---|---|
| Focused profile truthfulness tests | PASS — 4/4 |
| Affected P1-DRIFT-002 contract tests | PASS — 3/3 |
| TypeScript `tsc --noEmit` | PASS |
| Vite production build | PASS |
| Full Vitest regression suite | 573 passed; 2 known failures in duplicated UnitOfWork fixtures |
| `git diff --check` | PASS |
| Scoped secret scan | PASS |
| Server bundle | Not run — server source was not changed |
| Database/SQL/RLS/migration | None run or changed |
| Staging/Production | Not accessed or changed |

## Known unrelated regression baseline

The only full-suite failures are the previously known duplicate fixtures:

- `.pnpm-store/v11/projects/bd55c2945068ec2d3717d0e67a8c3967/src/__tests__/unitOfWork.test.ts`
- `.p10603-isolation/src/__tests__/unitOfWork.test.ts`

Both fail on the existing `Nested UnitOfWork is prohibited.` expectation. They are outside this mission and were not modified.

## Final result

`P1-006-28 = CODE-LEVEL CLOSED — PROFILE UI TRUTHFULNESS`
