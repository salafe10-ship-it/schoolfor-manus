# STU-GUARDIAN-001 — Student Guardian / Parent Canonical Integrity Discovery

## Mission status

**BLOCKED + RCA**

This is a code-only discovery mission. No application source, database schema, migration, RLS policy, or production environment was modified.

## Scope and evidence boundary

Reviewed the Guardian and Student–Guardian paths in:

- `src/database/services/StudentAdmissionService.ts`
- `src/database/services/StudentGuardianService.ts`
- `src/database/services/StudentService.ts`
- `src/database/repositories/GuardianRepository.ts`
- `src/database/repositories/StudentGuardianRepository.ts`
- `src/database/repositories/StudentRepository.ts`
- `src/database/repositories/FallbackStorage.ts`
- `src/database/migrations/student_affairs_tables.sql`
- `src/database/migrations/student_affairs_tables.ts`
- `supabase/migrations/202608051500_student_platform_foundation.sql`
- `supabase/migrations/202608051600_guardian_platform.sql`
- `src/components/student-affairs/hooks/useGuardianInformation.ts`
- `src/components/student-affairs/StudentGuardianInformation.tsx`
- `src/App.tsx`
- `src/security/TrustedStudentExecution.ts`
- `src/middleware/tenantValidation.ts`
- `src/tenant/TenantEngine.ts`

Live RLS and live schema evidence remain unavailable under the accepted `PLATFORM-EVIDENCE-002` limitation. Conclusions below are therefore source-level findings, not a production database certification.

## Executive conclusion

The canonical composite admission path is identifiable: `StudentAdmissionService.createStudent` opens one `UnitOfWork` transaction, enlists the student, guardian, relationship, and audit work, and closes the unit of work around the composite operation. That path is not sufficient for production certification because direct repository writers remain callable, the relationship repository ignores its school argument in every Supabase query and fallback lookup, the UI/service contract uses different guardian fields, and the fallback store can persist data outside the canonical transaction.

The mission must stop before hardening or database approval.

## Blocking root causes

| ID | Severity | Finding | Evidence | Impact |
|---|---|---|---|---|
| `SG-P0-001` | P0 | `StudentGuardianRepository` does not apply `schoolId` or tenant context to read/update/delete queries or fallback lookups. | `StudentGuardianRepository.ts:16-20`, `27`, `36-40`, `49-53`, `102`, `127`, `132-134` | A direct caller could read or mutate a relationship outside its school if database policy does not independently block it. Cross-tenant safety is not proven. |
| `SG-P1-002` | P1 | Guardian domain has divergent input models. The form captures father/mother fields, while the canonical writer consumes only legacy `parentName`, `parentPhone`, and `guardianRelation`. | `StudentGuardianInformation.tsx:42-116`; `StudentGuardianService.ts:14-40`; `App.tsx` legacy `parentName` paths | Incorrect guardian assignment, lost parent data, and customer-visible records that do not represent the submitted form. |
| `SG-P1-003` | P1 | Direct Guardian and StudentGuardian CRUD uses `FallbackStorage.performWrite`, which can write outside the canonical Unit of Work and queue a local fallback after DB failure. | `GuardianRepository.ts:74-92`, `99-120`, `127-145`; `StudentGuardianRepository.ts:68-86`, `93-115`, `118-136`; `FallbackStorage.ts` write path | Partial writes, orphan relationships, and divergence between authoritative DB and local fallback state. |
| `SG-P1-004` | P1 | Guardian relationship creation synthesizes identity and contact values and creates exactly one guardian from legacy fields. | `StudentGuardianService.ts:15-26`, `30-40`; `useGuardianInformation.ts:48-55` | Fictitious national ID/email/address values and loss of the second guardian can affect identity, communication, compliance, and trust. |
| `SG-P1-005` | P1 | Audit coverage is present only on the composite admission path; direct Guardian/relationship CRUD has no equivalent domain audit enlistment. | `StudentAdmissionService.ts:110-128`; direct repository methods | Incomplete accountability and inability to reconstruct direct relationship changes. |
| `SG-P1-006` | P1 | No Guardian-specific outbox/domain-event publication was found. | No Guardian/outbox/event call in reviewed paths | Downstream synchronization and retryable integration are not guaranteed. |
| `SG-P2-007` | P2 | Legacy migration/runtime migration paths coexist with versioned Supabase migrations and describe different schemas. | `src/database/migrations/student_affairs_tables.sql`, `.ts`; `supabase/migrations/202608051500_student_platform_foundation.sql`; `202608051600_guardian_platform.sql` | Deployment ambiguity and accidental execution of an obsolete schema path. |
| `SG-P2-008` | P2 | `syncGuardians` reads only `FallbackStorage`, not the authoritative Guardian relationship repository. | `StudentGuardianService.ts:47-66` | Updates may silently miss live relationships. |
| `SG-P3-009` | P3 | Direct Guardian and relationship delete methods are hard deletes, while the approved platform schema models soft deletion. | `GuardianRepository.ts:123-145`; `StudentGuardianRepository.ts:117-136`; platform migration fields | Historical recovery and audit retention are weakened. |

## Required decision

Do not certify Guardian Platform hardening, RLS readiness, or production use until the P0/P1 findings are resolved under a separately approved implementation mission.

