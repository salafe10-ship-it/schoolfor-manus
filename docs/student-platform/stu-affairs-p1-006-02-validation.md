# STU-AFFAIRS-P1-006-02 — Discovery Validation

## Validation performed

- Inspected the active Student Affairs portal export handler.
- Inspected the Student repository list contract and current pagination behavior.
- Inspected the Student list API route and its trusted tenant/session flow.
- Inspected the permission registry for canonical export permission coverage.
- Searched for active Student Export routes, server artifact generation, audit hooks, and XLSX generation.
- Confirmed that no implementation, migration, RLS, RPC, or database mutation was performed.

## Evidence result

| Check | Result | Evidence |
| --- | --- | --- |
| Current export exists | PASS | `handleExportExcel` exists in `StudentAffairsPortal.tsx`. |
| Current export is server-generated | FAIL / absent | No Student Export route or artifact service found. |
| Current export is true XLSX | FAIL / absent | Browser data URI and `.csv` filename are used. |
| Current export covers all matching records | FAIL | It serializes `filteredStudents`, which is the current server page after P1-003-04A. |
| Dedicated canonical export permission | FAIL / absent | `Student.Export` is not in the canonical registry. |
| Trusted export audit | FAIL / absent | No server export audit path exists for this action. |
| Tenant-safe dedicated export query | FAIL / absent | No dedicated endpoint exists; current action relies on already loaded UI rows. |
| Database/RLS changes | PASS — none | Discovery-only scope preserved. |

## Required decisions before implementation

1. CSV or true XLSX.
2. Current page or all matching records.
3. Maximum rows and synchronous/asynchronous threshold.
4. Dedicated permission name and role assignment.
5. Export field profiles, especially national ID and guardian phone.
6. Audit retention and artifact retention.
7. Data export versus official report classification.
8. Filename, Arabic encoding, escaping, and formula-injection policy.

## Verification status

Discovery is complete and implementation is intentionally blocked pending contract approval. No runtime export test is appropriate because the mission forbids implementation and there is no server export service to exercise.

## Next decision requested

Review and approve or revise the Export Contract. After approval, issue a separate implementation mission with an explicit file boundary and test matrix. Do not patch the current browser CSV handler opportunistically.

