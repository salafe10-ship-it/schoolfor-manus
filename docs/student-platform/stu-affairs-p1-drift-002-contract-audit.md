# STU-AFFAIRS-P1-DRIFT-002 — Student Edit Contract Audit

## Scope

This audit covers only the edit path for `classroom`, `section`, and `status`:

`StudentAffairsPortal → StudentRepository → PATCH /api/students/:id → server.ts → toCanonicalStudentPatch → CanonicalStudentWriteRepository`

No schema, migration, authorization, tenant, or lifecycle implementation was added.

## Field Matrix

| Field | UI sends | API receives | Canonical service mapping | Canonical repository persistence | Decision |
|---|---|---|---|---|---|
| `classroom` | Yes: `formData.grade` | Yes: request body | No mapping in `toCanonicalStudentPatch` | No `students` column; enrollment owns `class_reference` | `PARTIAL / DOMAIN DEPENDENCY` |
| `section` | Yes: `formData.classSection` | Yes: request body | No mapping in `toCanonicalStudentPatch` | No `students` column; enrollment owns `section_reference` | `PARTIAL / DOMAIN DEPENDENCY` |
| `status` | Yes: `formData.status` | Yes: request body | No general mapping; `suspended` has a dedicated canonical branch | `students.status` exists, but other transitions are Lifecycle-owned and unresolved | `PARTIAL / LIFECYCLE DEPENDENCY` |

## Evidence

- `StudentAffairsPortal.tsx` includes all three fields in `studentPayload`.
- `server.ts` maps the edit payload through `toCanonicalStudentPatch`.
- `CanonicalStudentWriteRepository.StudentWritePatch` contains identity and demographic fields only; it does not contain `classroom`, `section`, or `status`.
- The Student Platform migration defines no `classroom` or `section` columns on `students`.
- The Enrollment migration defines `class_reference` and `section_reference` on `enrollments`.
- `status` is a lifecycle field. The current canonical edit route has an explicit `suspended` writer, while the remaining status transitions require the approved Academic Status/Lifecycle path.

## Safety Decision

No code mapping was added. Mapping `classroom` or `section` into the Student aggregate would require creating a second source of truth and would violate the Enrollment boundary. Mapping all `status` values here would bypass the unresolved Lifecycle/Academic Status domain.

The current behavior is fail-closed for unsupported fields: fields that do not produce a canonical patch do not return a successful canonical update. The existing `suspended` branch remains unchanged.

## Result

`P1-DRIFT-002 = PARTIAL / DOMAIN OR SCHEMA DEPENDENCY`

The remaining work belongs to the Enrollment and Academic Status decisions, not to this Student Edit contract.
