# STU-AFFAIRS-P0-003-03 — Authority Matrix

## Canonical authority matrix

| Artifact | Role | Evidence | Conflict | Decision |
|---|---|---|---|---|
| `supabase/migrations/202608051500_student_platform_foundation.sql` | Student, Guardian, Student–Guardian schema | UUID IDs, composite scope FKs, canonical fields, audit/version/soft-delete metadata | None found in the enterprise migration family | **Canonical** |
| `supabase/migrations/202608051600_guardian_platform.sql` | Guardian verification and contact preferences | Tenant-scoped FKs to `guardians` | Does not replace Guardian aggregate | **Canonical extension** |
| `supabase/migrations/202608081700_db_sec_003_rls.sql` | Database security policy layer | Policies target canonical `students`, `guardians`, and `student_guardians` | Requires live deployment verification | **Approved security layer; environment pending** |
| `StudentRegistrationService` | Student registration application boundary | Uses trusted context, UnitOfWork, canonical Guardian resolution and relationship enlistment | None in reviewed flow | **Canonical application writer** |
| `CanonicalStudentReadRepository` | Student read model | Joins canonical tables with tenant/school/branch predicates | `parent_*` values are aliases, not physical columns | **Canonical read boundary** |
| `src/database/migrations/student_affairs_tables.sql` | Historical legacy schema artifact | Text IDs, reduced fields, legacy RLS and cascade behavior | Incompatible with enterprise UUID/scope model | **Non-authoritative; do not activate** |
| `src/database/migrations/student_affairs_tables.ts` | Historical FallbackStorage copy adapter | Reads local fallback and inserts into legacy-shaped targets | Can bypass canonical lifecycle if invoked | **Non-authoritative; blocked from Guardian writes** |
| `StudentGuardianService`, `GuardianRepository`, `StudentGuardianRepository` legacy mutators | Historical mutation paths | Previously allowed synthetic/fallback/unscoped writes | Conflicts with canonical boundary | **Fail-closed after 02A** |

## Field authority matrix

| Application concept | Canonical physical source | Legacy representation | Decision |
|---|---|---|---|
| Student legal name | `students.legal_first_name`, `legal_middle_name`, `legal_last_name` | `students.name`/legacy DTO values | Canonical fields are authoritative |
| Student number | `students.student_number` | `studentCode`/legacy DTO | Canonical field is authoritative |
| Guardian name | `guardians.legal_first_name`, `legal_middle_name`, `legal_last_name` | Synthetic or flattened legacy Guardian values | Canonical Guardian fields only |
| Guardian phone | `guardians.phone` | `parent_phone` DTO/result alias | Canonical column; alias only at read boundary |
| Guardian display name | Derived `concat_ws(...)` read alias `parent_name` | Historical `students.parent_name` query | Derived canonical read value; legacy physical query is not authoritative |
| Guardian relation | `student_guardians.relationship_type` | `guardian_relation` DTO/result alias | Canonical relationship table |
| Tenant/school/branch ownership | Canonical scope columns and composite FKs | School-only legacy filters | Trusted canonical context only |
| Guardian identity | `guardians.id` UUID and `guardian_number` | `guard_*` synthetic IDs | UUID canonical identity only |

## Decision gates

1. No schema redesign is required merely to support the canonical Student read aliases.
2. No legacy migration or fallback adapter may write authoritative Guardian data.
3. Canonical Guardian Update may be implemented as an application-only boundary, provided it reuses trusted scope and the existing request-scoped UnitOfWork.
4. Live Supabase migration history and catalog checks remain required before production certification.
5. The older SQL artifact must not be executed against the enterprise project as a substitute for the approved migrations.
