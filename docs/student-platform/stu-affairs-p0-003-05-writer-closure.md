# STU-AFFAIRS-P0-003-05 — Guardian Writer Closure Audit

## Decision

`STU-AFFAIRS-P0-003-05 = PASS — CANONICAL WRITER CLOSED`

The production Guardian write inventory has one approved application boundary:

`CanonicalGuardianUpdateService` for Guardian/relationship updates, and the canonical `StudentRegistrationService` infrastructure boundary for registration-time Guardian and relationship creation.

## Writer inventory

| Location | Operation | Classification | Evidence |
|---|---|---|---|
| `src/modules/student-registration/infrastructure/StudentRegistrationRepositories.ts` | Guardian create during canonical registration | CANONICAL | Parameterized SQL is enqueued inside the registration Unit of Work and requires an active PostgreSQL transaction. |
| `src/modules/student-registration/infrastructure/StudentRegistrationRepositories.ts` | `student_guardians` create during canonical registration | CANONICAL | Parameterized SQL is enqueued inside the registration Unit of Work and requires an active PostgreSQL transaction. |
| `src/modules/student-registration/application/CanonicalGuardianUpdateService.ts` | Guardian update | CANONICAL | Trusted scope, `FOR UPDATE`, optimistic version, parameterized scoped update, audit and outbox in one Unit of Work. |
| `src/modules/student-registration/application/CanonicalGuardianUpdateService.ts` | Relationship update | CANONICAL | Trusted scope, optimistic version, parameterized scoped update, audit and outbox in one Unit of Work. |
| `src/database/repositories/GuardianRepository.ts` | Create/update/delete | LEGACY-BLOCKED | All mutators throw `STU-GUARD-001/002/003`; reads only. |
| `src/database/repositories/StudentGuardianRepository.ts` | Create/update/delete/detach | LEGACY-BLOCKED | All mutators throw `STU-GUARD-003`; reads are scope-filtered. |
| `src/database/services/StudentGuardianService.ts` | Legacy create/synchronization | LEGACY-BLOCKED | Legacy entry points throw on any Guardian mutation attempt. |
| `src/database/migrations/student_affairs_tables.ts` | Legacy Guardian migration | LEGACY-BLOCKED | Guardian and relationship migration writes were removed; detection of legacy records returns failure before any Guardian write. |
| `src/database/migrations/init.ts` | Delegation to legacy Student Affairs migration | DELEGATING-BLOCKED | It can invoke the migration utility only under explicit migration control; the Guardian portion now fails closed. |
| `src/database/UnitOfWork.ts` | Generic fallback collection persistence | INFRASTRUCTURE-ONLY | No production Guardian caller remains outside the two canonical boundaries; canonical services require an active PostgreSQL transaction and do not fall back. |
| `src/database/repositories/GuardianRepository.ts` and `StudentGuardianRepository.ts` | Supabase reads / fallback reads | READ-ONLY | No write method is used; reads require trusted scope where applicable. |

## Negative inventory

No production `supabase.from('guardians').insert/update/upsert/delete` or corresponding `student_guardians` write remains outside the canonical boundary. No production Guardian writer was found in bulk Student operations, Student Affairs UI repositories, or server legacy Student update routes.

## Security result

- Client scope fields remain rejected.
- Legacy Guardian paths fail closed.
- Fallback Guardian migration is blocked.
- Canonical Guardian writes require PostgreSQL transaction context, trusted tenant context, authorization, and optimistic versions.
- No schema, RLS, RPC, or production database object was changed.

## Remaining limitation

This is code-level certification only. Live PostgreSQL/RLS behavior remains a separate infrastructure certification and is not claimed here.

