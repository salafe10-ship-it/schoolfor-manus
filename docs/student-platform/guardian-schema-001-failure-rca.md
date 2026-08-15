# GUARDIAN-SCHEMA-001 — Failure RCA

## Mission status

`GUARDIAN-SCHEMA-001 = STOP + RCA`

No database migration was created or executed. Existing migrations and production data were not modified.

## Scope

The mission was limited to aligning the Guardian schema with the approved `GUARDIAN-CONTRACT-001` business contract so that the later `GUARDIAN-003` implementation could proceed safely.

## Root cause

The approved contract and the current repository schema are not semantically compatible:

1. The contract defines the canonical relationship types as `father`, `mother`, `legal_guardian`, and `other`.
2. `supabase/migrations/202608051500_student_platform_foundation.sql` currently constrains `student_guardians.relationship_type` to `parent`, `legal_guardian`, `foster_parent`, `sibling`, `relative`, `sponsor`, and `other`; `father` and `mother` are not accepted.
3. The contract defines Financial Liability as an independent capability. The current `student_guardians` table has no `financial_liability` representation.
4. The approved contract forbids inferring Father/Mother from legacy `parentName` data. Therefore an automatic conversion of an existing relationship row cannot be certified without inspecting the real stored values and an approved conversion policy.

## Evidence

### Static repository evidence

- Current relationship check constraint: `ck_student_guardians_relationship` in `202608051500_student_platform_foundation.sql`.
- Current relationship column: `student_guardians.relationship_type`.
- Current schema has no `financial_liability` column or equivalent approved field on `student_guardians`.
- The modern registration writer persists `relationship_type` and the existing relationship flags, but does not persist Financial Liability.
- `docs/student-platform/guardian-contract-001-business-contract.md` requires separate Father/Mother relationships and prohibits automatic legacy inference.

### Missing live evidence

The approved `PLATFORM-EVIDENCE-002` result states that there is no approved live evidence channel for the real Supabase schema and data. The repository therefore does not provide a certifiable answer for:

- whether `student_guardians` exists in the target environment;
- which relationship values are already stored;
- whether any rows use legacy `parent` or other values;
- whether existing data requires conversion;
- whether a financial-liability value exists outside the repository schema.

Static reports are not a substitute for a current, authorized schema/data snapshot.

## Why implementation was stopped

Proceeding with an `ALTER TABLE`, data rewrite, or new representation for Financial Liability would be a blind migration. It could reject existing rows, silently misclassify a parent, lose relationship meaning, or introduce an unapproved domain representation. The mission explicitly requires data preservation, non-destructive migration, and a tested staging path; those prerequisites are not available.

## Safety decision

- No new SQL migration was written.
- No existing migration was edited.
- No SQL was executed.
- No database, RLS, authentication, authorization, Tenant Engine, or production configuration was changed.
- GUARDIAN-003 remains stopped and must not be retried until this schema mission is approved and completed.

## Required unblock conditions

1. Provide an approved read-only live schema/data evidence channel for the target staging database.
2. Capture the actual `student_guardians` table definition, constraints, indexes, row count, and distinct relationship values without exposing sensitive data.
3. Approve a non-destructive mapping policy for every existing relationship value, including legacy `parent`.
4. Approve the exact independent Financial Liability representation and its ownership semantics.
5. Produce and review a forward migration plus a tested rollback/restore plan in isolated staging.
6. Re-run static validation, focused Guardian tests, full tests, build checks, and migration validation before `GUARDIAN-003-R`.

## Validation performed

- TypeScript: PASS (`30` Vitest files / `159` tests were also green on the pre-existing application baseline).
- Focused schema validation: STOPPED before SQL generation because live evidence and conversion approval are missing.
- `git diff --check`: PASS for the report.
- Secret scan: PASS for the report.
- Vite build and server bundle: blocked by pre-existing environment/configuration issues (`__dirname` under the ESM Vite config and the existing esbuild directory-resolution failure); no changes were made to address them in this mission.

## Next CTO decision

Approve or provide the missing read-only staging evidence channel and the Financial Liability representation. Until then, the safest status is `GUARDIAN-SCHEMA-001 = STOP + RCA`.
