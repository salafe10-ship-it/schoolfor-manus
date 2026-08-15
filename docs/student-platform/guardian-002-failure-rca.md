# GUARDIAN-002 — Code-Level Guardian Hardening Failure RCA

## Mission status

**GUARDIAN-002 = STOP + RCA**

No source code, database schema, migration, RLS policy, or production environment was modified in this mission.

## Exact stop condition

The approved implementation order requires an immediate stop when the `father/mother` relationship semantics are not settled by an existing business contract. That condition is present.

The current UI contract exposes separate `fatherName`, `fatherPhone`, `fatherNationalId`, `motherName`, and `motherPhone` fields. The legacy Guardian writer instead consumes only `parentName`, `parentPhone`, and `guardianRelation`, then creates exactly one Guardian and one StudentGuardian row. The code does not establish whether:

- father or mother is the canonical primary guardian;
- both parents must be persisted as separate Guardian relationships;
- the selected relationship is legally responsible, financially liable, an emergency contact, or merely a communication contact;
- the hard-coded `isPrimary`, `financialLiability`, and `smsNotifications` values are valid business rules;
- the Arabic `relationshipType` value maps to the enterprise relationship enum.

Choosing any of these meanings in code would create a business decision and could corrupt parent/guardian records.

## Evidence

- `src/components/student-affairs/StudentGuardianInformation.tsx` captures separate father and mother fields.
- `src/components/student-affairs/hooks/useGuardianInformation.ts` supplies synthetic fallback identity/contact values.
- `src/database/services/StudentGuardianService.ts` reads only `parentName`, `parentPhone`, and `guardianRelation`, creates one guardian, and hard-codes relationship flags.
- `src/database/repositories/GuardianRepository.ts` and `src/database/repositories/StudentGuardianRepository.ts` remain direct writer paths.
- `src/modules/student-registration/application/StudentRegistrationService.ts` has a newer trusted `GuardianInput` contract, but no approved mapping exists from the legacy father/mother UI contract to that input.
- `PLATFORM-EVIDENCE-002` still blocks live RLS and live schema evidence; this mission cannot use that unavailable evidence to infer business semantics.

## Why implementation is unsafe now

The P0 tenant-scope defect in `StudentGuardianRepository` is real, but changing the legacy writer and relationship mapping together without a business decision could cause one of two unsafe outcomes: silently dropping one parent or assigning legal/financial/contact authority to the wrong person. A workaround, fallback, or guessed mapping would violate the CTO order.

## Required CTO/business decision

Before GUARDIAN-002 can resume, approve a precise mapping contract that states:

1. Whether father and mother are separate Guardian entities and relationships.
2. Which relationship, if any, is primary by default.
3. Whether custody, collection authority, financial liability, emergency contact, and notification consent are independent flags.
4. The allowed relationship enum and its source-of-truth language values.
5. Whether legacy `parentName`/`parentPhone` records may be migrated, rejected, or read-only.
6. Whether a missing second parent is valid or requires an explicit reason.

After that decision, a new hardening attempt can safely consolidate the writer, enforce trusted tenant/school/branch scope, remove unsafe fallback writes, and add focused regression tests.

## Validation at stop

- Existing TypeScript baseline: PASS before this stop; no source was changed.
- Existing STU-GUARDIAN-001 static evidence and reports: available in `docs/student-platform/`.
- No implementation tests were added because implementation was correctly blocked before source mutation.
- Production/database mutation: NONE.

## Final decision

**BLOCKED + RCA — wait for the explicit Guardian relationship/business mapping contract.**

