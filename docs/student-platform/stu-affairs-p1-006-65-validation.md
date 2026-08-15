# STU-AFFAIRS-P1-006-65 — Validation

## Release-state matrix

| Canonical state | List | Detail | Verify | Reject | Expire | Archive | Restore | Add Version |
|---|---|---|---|---|---|---|---|---|
| Loading | loading | loading | unavailable | unavailable | unavailable | unavailable | unavailable | unavailable |
| Draft | visible | available | unavailable | unavailable | due/hold guarded | due/hold guarded | unavailable | current-version/hold guarded |
| Pending Verification | visible | available | available | available | due/hold guarded | due/hold guarded | unavailable | current-version/hold guarded |
| Verified | visible | available | unavailable | unavailable | due/hold guarded | due/hold guarded | unavailable | current-version/hold guarded |
| Rejected | visible | available | unavailable | unavailable | due/hold guarded | due/hold guarded | unavailable | current-version/hold guarded |
| Expired | visible | available | unavailable | unavailable | unavailable | unavailable by UI gate | unavailable | unavailable |
| Archived | visible | available | unavailable | unavailable | unavailable | unavailable | available | unavailable |
| Legal Hold | visible | available | unavailable for guarded mutation | unavailable for guarded mutation | unavailable | unavailable | unavailable | unavailable |
| Mutation In Flight | visible | available | disabled | disabled | disabled | disabled | disabled | disabled |
| Unknown Outcome | visible | available with warning | unavailable until refresh | unavailable until refresh | unavailable until refresh | unavailable until refresh | unavailable until refresh | unavailable until refresh |

## Checks

| Check | Result |
|---|---|
| Existing Student Documents suite | PASS — 49 tests |
| Release-gate test | PASS — 3 tests |
| TypeScript | PASS — `tsc --noEmit` |
| Vite production build | PASS |
| Server bundle | PASS |
| `git diff --check` | PASS for scoped files |
| Scoped secret scan | PASS — no literal secret patterns found |

## Stop condition

All required checks passed. Non-blocking warnings remain for existing large Vite chunks and existing `import.meta` usage in the CommonJS server bundle. Any requirement for an API contract, permission, database field, Storage capability, security decision, or owner approval must result in `P1-006-65 = BLOCKED — DEPENDENCY OUTSIDE APPROVED UI BOUNDARY`.

## Decision

`P1-006-65 = CODE-LEVEL CLOSED — DOCUMENTS METADATA RELEASE-GATE HARDENING`
