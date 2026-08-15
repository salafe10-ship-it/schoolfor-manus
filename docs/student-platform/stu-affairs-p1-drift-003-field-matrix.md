# STU-AFFAIRS-P1-DRIFT-003 — Field Matrix

| Field | UI | API | Canonical DTO | Service | Repository / source of truth | Result |
|---|---|---|---|---|---|---|
| classroom | sent as `classroom` | received, not mapped | none | none | Enrollment placement | dependency; no silent loss claim |
| section | sent as `section` | received, not mapped | none | none | Enrollment placement | dependency; no silent loss claim |
| stage | form state exists | not canonicalized | none | none | unproven | dependency; no invented mapping |
| status | form state exists | not used for registration | lifecycle-owned | canonical registration status | Academic Status | lifecycle dependency |
| address | sent in UI payload | received, not mapped | none | none | no Student column | schema/domain dependency |
| email | sent in UI payload | never used as guardian email | none | none | no Student column | not persisted |
| phone | form state exists | not canonicalized | none | none | no Student column | schema/domain dependency |
| nationality | sent in UI payload | mapped | `nationality` | normalized | `students.nationality` | canonical and persisted |
| birthCountryCode | supported when present | mapped | `birthCountryCode` | normalized uppercase | `students.birth_country_code` | canonical and persisted |
| admissionReference | not client-selected | server-generated | `admissionReference` | normalized | `enrollments.admission_reference` | trusted and persisted |
| guardianName | `parentName` | mapped | `guardian.legal*Name` | normalized | guardians identity fields | canonical and persisted |
| guardianPhone | `parentPhone` | mapped | `guardian.phone` | normalized | `guardians.phone` | canonical and persisted |
| guardian email | explicit `parentEmail` only | mapped only when explicit | `guardian.email` | normalized | `guardians.email` | fallback removed |

## Trust boundary

Tenant, school, branch, actor, timestamps, request ID, correlation ID, status, and admission reference remain server/canonical concerns. No client-selected tenant, school, branch, or lifecycle status is introduced by this mission.
