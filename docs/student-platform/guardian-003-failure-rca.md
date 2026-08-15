# GUARDIAN-003 — Canonical Guardian Writer Consolidation & P0 Tenant-Scope Hardening

## Mission status

**GUARDIAN-003 = STOP + RCA**

No source code, database schema, migration, RLS policy, authorization core, TenantEngine, UnitOfWork, or production environment was modified by this mission. The implementation attempt was reverted before handoff so no partial hardening remains.

## Exact blocking evidence

The approved Guardian contract requires the canonical relationship enum:

`father`, `mother`, `legal_guardian`, `other`

The approved migration currently defines `student_guardians.relationship_type` with a check constraint that allows:

`parent`, `legal_guardian`, `foster_parent`, `sibling`, `relative`, `sponsor`, `other`

It does not allow `father` or `mother`.

The approved contract also treats Financial Liability as an independent relationship capability. The current `student_guardians` table definition has no `financial_liability` column. Therefore the existing schema cannot represent the approved contract without a migration/schema change.

## Why GUARDIAN-003 must stop

The CTO order explicitly forbids schema and migration changes in GUARDIAN-003. Implementing the approved contract only in application code would cause one of these unsafe outcomes:

- PostgreSQL rejects valid Father/Mother relationship writes;
- the application silently maps Father/Mother to the incompatible legacy `parent` value;
- Financial Liability is discarded or incorrectly conflated with Primary status;
- the application invents a side-channel or fallback representation outside the approved schema.

None of these is acceptable. No workaround was used.

## Additional unresolved implementation gate

The P0 source finding remains valid and unmodified: `StudentGuardianRepository` direct reads/updates/deletes do not apply trusted tenant/school/branch scope. Fixing that alone is technically possible, but it cannot complete GUARDIAN-003 because the same mission also requires the approved Guardian relationship contract to be representable without schema change.

## Evidence paths

- `supabase/migrations/202608051500_student_platform_foundation.sql:155-224`
- `src/modules/student-registration/application/StudentRegistrationService.ts`
- `src/modules/student-registration/infrastructure/StudentRegistrationRepositories.ts`
- `src/database/repositories/StudentGuardianRepository.ts`
- `docs/student-platform/guardian-contract-001-business-contract.md`
- `docs/student-platform/guardian-contract-001-validation-report.md`

## Validation at stop

- Source rollback after the blocked implementation attempt: PASS.
- TypeScript baseline on the unchanged source: PASS.
- Full Vitest baseline on the unchanged source: PASS.
- Database/production mutation: NONE.
- RLS live evidence: BLOCKED by `PLATFORM-EVIDENCE-002`.

## Required CTO decision

Choose one explicitly before implementation resumes:

1. Approve a schema/migration mission to align `relationship_type` and add the approved independent Financial Liability representation; or
2. Amend the Guardian business contract to fit the existing schema, with an explicit decision about Father/Mother and Financial Liability.

GUARDIAN-003 cannot continue until that decision is approved.

## Final decision

**GUARDIAN-003 = STOP + RCA**

