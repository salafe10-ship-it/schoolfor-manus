# STU-GUARDIAN-001 — Writer Inventory

## Canonical composite writer

| Path | Operation | Boundary | Result |
|---|---|---|---|
| `StudentAdmissionService.createStudent` | Student admission plus guardian creation and relationship | `UnitOfWork.runInTransaction` | Canonical for the admission workflow only |
| `StudentGuardianService.enlistCreateGuardianRelation` | Enlists one Guardian and one StudentGuardian record | Called from the admission UnitOfWork | Delegating writer, legacy field contract |
| `GuardianRepository.enlistCreateGuardian` | SQL enlistment for Guardian creation | UnitOfWork enlistment | Inconsistent column contract with current platform schema |
| `StudentGuardianRepository.enlistCreateStudentGuardian` | SQL enlistment for relationship creation | UnitOfWork enlistment | Uses `relationship` column while current types/migration use `relation_type` / relationship semantics |

## Direct writers

| File | Method | Supabase operation | Scope issue |
|---|---|---|---|
| `GuardianRepository.ts` | `create` | `insert guardians` | Uses fallback path; not explicitly UnitOfWork-bound |
| `GuardianRepository.ts` | `update` | `update guardians` | School-scoped but no tenant/branch context; fallback path |
| `GuardianRepository.ts` | `delete` | `delete guardians` | Hard delete; fallback path |
| `StudentGuardianRepository.ts` | `create` | `insert student_guardians` | No school/tenant fields or predicate |
| `StudentGuardianRepository.ts` | `update` | `update student_guardians where id` | No school/tenant predicate |
| `StudentGuardianRepository.ts` | `delete` | `delete student_guardians where id` | No school/tenant predicate; hard delete |

## Non-database and legacy persistence

- `FallbackStorage` maintains global guardian and student-guardian collections and can persist a local write after a database failure.
- `src/database/migrations/student_affairs_tables.ts` can migrate local fallback collections directly into Supabase.
- `src/database/migrations/student_affairs_tables.sql` is a parallel legacy SQL path with different column names/types and its own RLS statements.
- `App.tsx` and `StudentAffairsPortal.tsx` retain `parentName` / `parentPhone` as a parallel legacy representation.
- `useGuardianInformation.ts` supplies presentation fallbacks that include synthetic values.

## Inventory conclusion

There is not one exclusive Guardian writer. The canonical admission writer coexists with direct repository writers, a fallback persistence writer, a migration writer, and legacy UI models. This is the primary reason for the `BLOCKED + RCA` outcome.

