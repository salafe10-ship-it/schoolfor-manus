# STU-AFFAIRS-P0-002I — Validation Report

| Check | Result |
|---|---|
| Student ID can identify a canonical Enrollment without context | FAIL |
| Legacy classroom → class_reference mapping approved | FAIL |
| Legacy section → section_reference mapping approved | FAIL — Placement vs Transfer still needs contract |
| Legacy stageId has canonical owner | FAIL |
| Academic year supplied by current transfer payload | FAIL |
| Term supplied by current transfer payload | FAIL |
| Source Enrollment ID supplied | FAIL |
| Destination Enrollment contract supplied | FAIL |
| Transfer reason supplied | FAIL |
| Batch idempotency key supplied | FAIL |
| Trusted tenant/scope derivation proven for legacy path | FAIL |
| Source/DB/migration/RLS/Production modified | NONE |

## Static review

Reviewed `StudentAffairsPortal.tsx`, `StudentEnrollmentService.ts`, `StudentRepository.ts`, `types.ts`, the Enrollment migration, and approved Enrollment contracts. `git diff --check` remains PASS with pre-existing CRLF normalization warnings only.

## Decision

`STU-AFFAIRS-P0-002I = STOP + BUSINESS/ARCHITECTURE DECISION REQUIRED`.

No canonical transfer implementation or migration can safely proceed until the mapping and scope decisions are approved. P0-002J remains blocked.
