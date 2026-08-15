# STU-AFFAIRS-P1-006-28 — Profile UI Truthfulness Implementation Report

Status: `CODE-LEVEL CLOSED — PROFILE UI TRUTHFULNESS`

## Scope

Only `src/components/StudentAffairsPortal.tsx` and its focused contract tests were changed. No API, repository, domain, authorization, tenant, database, migration, RLS, enrollment, academic-status, staging, or production code was changed.

## Changes

1. Removed unsupported `nationalId` from the canonical Student save payload.
2. Removed unsupported Student placement fields (`classroom` and `section`) from the Student save payload.
3. Stopped projecting Guardian phone into Student phone form state during edit.
4. Marked National ID as unsupported in the current Student Profile contract and made the control non-editable.
5. Marked stage, grade, and section as Enrollment-owned and non-editable in this screen.
6. Replaced broad success wording with a message that states only canonical Student data was saved and unsupported/domain-owned fields were not.
7. Preserved the existing canonical Student fields: name, student number, date of birth, gender, and nationality.
8. Preserved the existing separate Guardian update workflow and its failure warning behavior.

## Security/privacy boundary

- No synthetic Student email was added or displayed by this component.
- No Student contact value was copied into Guardian contact data.
- National ID remains unpersisted in this profile contract rather than being silently dropped as a successful Student field.
- No client identity, school, branch, tenant, role, or authorization behavior was changed.
