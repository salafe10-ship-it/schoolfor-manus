# STU-AFFAIRS-P1-006-27 — Safe Fix Boundary

Status: `READINESS REVIEW — NO IMPLEMENTATION AUTHORIZED`

## Potentially safe profile-only fixes

These are candidates for a later bounded implementation order, subject to CTO approval:

1. Remove or mark read-only the profile controls whose values are not persisted by the canonical Student contract.
2. Remove synthetic display defaults such as generated student email addresses; show an explicit “not recorded” state instead.
3. Separate Guardian phone/name display from Student contact fields so the UI cannot imply that `parentPhone` is the Student phone.
4. Make the success state report canonical persistence scope rather than claiming all submitted form fields were saved.
5. Add a persisted-field parity test covering create, read, edit, and response mapping for the existing canonical Student fields.

## Not safe in this mission

- Adding `email`, `phone`, `address`, `religion`, or `national_id` columns.
- Mapping Student email/phone/address into Guardian fields.
- Treating `admissionReference` as a Student field.
- Editing `grade`, `classSection`, academic year, or branch in the profile writer.
- Changing academic status through profile save.
- Changing Authorization, TenantEngine, UnitOfWork, RLS, migrations, or database schema.

## Required owner decisions before unsupported fields can be enabled

| Field group | Required owner |
|---|---|
| Student contact/address/social/national ID | Student domain + schema/security |
| Guardian email/contact | Guardian domain |
| Admission reference and placement | Enrollment/Admissions |
| Status | Academic Status |

## Boundary result

`P1-006-27 = DOMAIN/SCHEMA DEPENDENCY — IMPLEMENTATION BLOCKED`
