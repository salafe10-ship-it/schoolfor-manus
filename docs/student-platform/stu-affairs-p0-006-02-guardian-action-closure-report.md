# STU-AFFAIRS-P0-006-02 — Guardian Action Closure

## Mission status

`CODE FIX COMPLETE / READY FOR CTO REVIEW`

## Scope

Only unavailable Guardian actions in `StudentAffairsPortal` were reviewed and corrected. Student Read, Student Export, Import, database, RLS, authorization, tenant isolation, and production were not changed.

## Corrected actions

| Action | Previous risk | Current behavior |
|---|---|---|
| ربط ولي أمر (قريبًا) | Visually unavailable but still had a click handler | Native `disabled`, `aria-disabled="true"`, clear unavailable title, no notification, no request |
| اتصال | Warning-only click path could still be invoked | Native `disabled`, `aria-disabled="true"`, clear unavailable title, no notification, no request |
| رسالة | Warning-only click path could still be invoked | Native `disabled`, `aria-disabled="true"`, clear unavailable title, no notification, no request |

No real Guardian communication provider or API was created. The actions remain visibly unavailable until an approved provider/API mission exists.

## Files modified

- `src/components/StudentAffairsPortal.tsx`
- `src/__tests__/stuAffairsP006GuardianFalseSuccess.test.ts`

## Verification

- TypeScript: PASS.
- P0-006 focused tests: 2 files, 5 tests, PASS.
- Vite production build: PASS.
- Server production bundle: PASS.
- `git diff --check`: PASS.
- Secret scan of affected files: no findings.

## Full regression baseline

Full Vitest discovered 109 files and 541 tests: 539 passed and 2 failed. Both failures are the same pre-existing UnitOfWork nested-transaction expectation loaded from duplicate artifact paths:

- `.p10603-isolation/src/__tests__/unitOfWork.test.ts`
- `.pnpm-store/v11/projects/bd55c2945068ec2d3717d0e67a8c3967/src/__tests__/unitOfWork.test.ts`

The canonical `src/__tests__/unitOfWork.test.ts` did not produce the failing assertion in that run. No UnitOfWork source, test configuration, isolation artifact, or store artifact was modified or deleted.

Therefore the correct regression label is:

`FULL REGRESSION NOT CLEAN — PRE-EXISTING/ENVIRONMENT DUPLICATION`

## Remaining work

- Obtain Operations/Render observability before reopening Student Read RCA.
- Create a separate approved provider/API mission before enabling Guardian communication actions.
- Resolve duplicate test discovery in a separate maintenance mission; it is outside P0-006-02.
