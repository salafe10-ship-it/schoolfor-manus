# ATTEND-SCHEMA-001 — Schema Mapping

## Status

`SCHEMA DESIGNED / MIGRATION PREPARED / LIVE EXECUTION BLOCKED`

The mapping is derived from the approved Attendance contract, the Attendance application ports, and the repository migration definitions. Live equivalence is not certified because the approved evidence channel remains unavailable.

## Application-to-schema mapping

| Application concept | Prepared object/field | Source/contract basis | Live status |
|---|---|---|---|
| Attendance session | `attendance_sessions` | ATTEND-DESIGN-001 | Unverified |
| Session identity | `attendance_sessions.id uuid` | Enterprise migration convention | Unverified |
| Trusted scope | `tenant_id`, `school_id`, `branch_id` | Approved trusted context | Unverified |
| Academic context | `academic_year_id`, `term_id` | Core/Enrollment migrations | Unverified |
| Class context | `class_reference`, `section_reference` | Existing Enrollment text references; no classes schema proven | Unverified |
| Occurrence | `attendance_date`, `period_reference` | Session-based contract | Unverified |
| Session lifecycle | `status IN ('open','locked')` | ATTEND-CONTRACT-002 | Unverified |
| Attendance record | `attendance_records` | ATTEND-DESIGN-001 | Unverified |
| Eligibility | `student_id`, `enrollment_id` | Enrollment contract | Unverified |
| State | `attendance_status` | Approved present/absent/late/excused states | Unverified |
| Uniqueness | `(tenant_id, attendance_session_id, student_id)` | Approved logical invariant | Unverified |
| Correction | corrected fields + central Audit | Approved correction contract | Unverified |
| Audit/outbox | Existing platform services referenced by metadata/event contract | No new audit/outbox objects | Unverified |

## Existing key compatibility used

- `students` exposes `UNIQUE (tenant_id, school_id, id)`.
- `enrollments` exposes `UNIQUE (tenant_id, id)`.
- Core tables expose the tenant/school/branch/year/term scope keys used by the prepared foreign keys.
- No current migration creating `attendance` was reused; the prepared objects are new canonical names.

## Explicit limitations

- `class_reference` and `section_reference` remain references, not foreign keys, because no approved classes/sections tables are present in the repository scope.
- Enrollment school/branch consistency is validated by the application contract; the existing Enrollment migration does not expose a `(tenant_id, school_id, id)` key suitable for a composite FK.
- Lock enforcement across parent and child writes is an application transaction dependency; no trigger/function was introduced.
- `request_id` and `correlation_id` follow the platform UUID convention; the future adapter must reject non-UUID values before persistence.
