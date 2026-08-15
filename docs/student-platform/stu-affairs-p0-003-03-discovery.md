# STU-AFFAIRS-P0-003-03 — Schema Authority Discovery

Status: **Discovery complete — no implementation performed**  
Date: 2026-08-12  
Scope: Student and Guardian canonical model only

## Executive finding

The repository contains one enterprise schema family and one older incompatible Student Affairs SQL artifact.

The enterprise schema authority in source control is:

1. `supabase/migrations/202608051500_student_platform_foundation.sql`
2. `supabase/migrations/202608051600_guardian_platform.sql` for Guardian verification and contact-preference extensions
3. `supabase/migrations/202608081700_db_sec_003_rls.sql` for the later database security layer

The older file `src/database/migrations/student_affairs_tables.sql` is not compatible with the enterprise model: it uses text identifiers, a reduced column model, legacy cascade rules, and its own RLS policy names. It must not be treated as the source of truth for the canonical Student/Guardian model.

The deployed Supabase schema was not queried in this discovery. Therefore, source authority is resolved, but live-environment authority remains an operational verification dependency before any production certification.

## Evidence

### Enterprise Student/Guardian foundation

`supabase/migrations/202608051500_student_platform_foundation.sql` defines:

- `students`, `guardians`, and `student_guardians`
- UUID primary keys
- tenant/school/branch scope columns
- composite foreign keys enforcing scope consistency
- audit, version, soft-delete, request, and correlation metadata
- canonical relationship constraints and indexes

The `students` table uses canonical fields such as `legal_first_name`, `legal_middle_name`, `legal_last_name`, `preferred_name`, `date_of_birth`, `student_number`, and lifecycle `status`.

The `guardians` table uses canonical fields such as `guardian_number`, legal-name fields, `phone`, `email`, address fields, verification status, lifecycle status, and scope metadata.

The `student_guardians` table stores the relationship and its business state: `relationship_type`, primary/emergency flags, custody, consent, effective dates, lifecycle status, and audit metadata.

### Guardian extensions

`supabase/migrations/202608051600_guardian_platform.sql` adds only Guardian-domain extension tables:

- `guardian_verifications`
- `guardian_contact_preferences`

Both reference `guardians` using tenant-scoped foreign keys. They do not redefine the Guardian aggregate.

### Canonical application write path

`src/modules/student-registration/application/StudentRegistrationService.ts` calls:

- `resolveGuardian`
- canonical Student persistence
- `enqueueStudentGuardian`
- the request-scoped UnitOfWork

`src/modules/student-registration/infrastructure/StudentRegistrationRepositories.ts` resolves an existing Guardian inside trusted tenant/school/branch scope and creates a new Guardian using the canonical UUID and `guardian_number` model.

### Canonical application read path

`src/database/repositories/CanonicalStudentReadRepository.ts` joins `students`, `student_guardians`, and `guardians` using tenant and school scope predicates.

Important clarification: `parent_name`, `parent_phone`, and `guardian_relation` in this repository are result aliases generated from canonical Guardian and relationship columns. They are not physical columns required on `students` or `guardians`.

The separate legacy `src/database/repositories/StudentRepository.ts` still contains historical queries against `parent_name`; that path is not the canonical read boundary and remains technical debt for a later, separately authorized cleanup.

### Legacy SQL artifact

`src/database/migrations/student_affairs_tables.sql` defines a separate legacy shape:

- text IDs instead of UUIDs
- reduced Guardian fields
- `student_guardians` without enterprise tenant/school/branch composite ownership
- legacy `ON DELETE CASCADE` relationships
- a separate RLS policy set
- additional auxiliary tables unrelated to the P0-003-03 authority decision

This artifact conflicts with the enterprise migration contract and is not approved as a second active schema.

### Legacy data-copy adapter

`src/database/migrations/student_affairs_tables.ts` copies `FallbackStorage` records into `guardians` and `student_guardians`. It is a historical migration adapter, not the canonical application write boundary. It must not be used as an authoritative Guardian mutation path.

## Authority decision

| Concern | Resolved authority |
|---|---|
| Student table | `202608051500_student_platform_foundation.sql` |
| Guardian table | `202608051500_student_platform_foundation.sql` |
| Student–Guardian relationship | `202608051500_student_platform_foundation.sql` |
| Guardian verification/preferences | `202608051600_guardian_platform.sql` |
| Database tenant enforcement | `202608081700_db_sec_003_rls.sql` when deployed and certified |
| Student/Guardian create/link application boundary | `StudentRegistrationService` + canonical repositories + UnitOfWork |
| Legacy SQL/JSON migration artifacts | Historical/non-authoritative; blocked from canonical writes |

## Discovery conclusion

The canonical model is sufficiently defined in source control for an application-only Guardian Update design. The `parent_*` values in the canonical read query are derived aliases, not a requirement for a schema redesign.

No migration, RLS, SQL execution, database mutation, or code change was performed by this discovery.

The remaining environment dependency is live verification that the deployed Supabase project has the enterprise migrations applied in the approved order. Until that evidence exists, the result is source-authoritative but not production-certified.
