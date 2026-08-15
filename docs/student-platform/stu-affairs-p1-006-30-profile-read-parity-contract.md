# STU-AFFAIRS-P1-006-30 — Canonical Student Profile Read-Parity Contract

Status: `DOMAIN/API DECISION REQUIRED`

## Scope

Architecture and contract discovery only. No API, repository, database, SQL, migration, RLS, Enrollment, Academic Status, Lifecycle, Authorization, TenantEngine, UnitOfWork, staging, or production change was made.

## Canonical read contract

The Student Profile read contract may expose only fields whose source of truth is `public.students` and whose tenant/school/branch scope is validated by the canonical read path.

| Field | Canonical owner | DB source | Create support | Edit support | Read projection | Profile UI | Required? | Nullable? | Validation | Tenant scope | Audit impact | Dependency |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `fullName` | Student | `legal_first_name`, `legal_middle_name`, `legal_last_name` | Yes | Yes | Yes, reconstructed | Yes | first/last required | middle nullable | trimmed legal name | tenant/school/branch | create/update audit | None |
| `studentCode` | Student | `student_number` | Yes; may be generated | Yes with version | Yes | Yes | Create may omit; persisted value required after create | No | canonical uppercase format | tenant/school/branch | create/update audit | numbering policy |
| `birthDate` | Student | `date_of_birth` | Yes | Yes | Yes | Yes | Yes | No | valid `YYYY-MM-DD` calendar date | tenant/school/branch | create/update audit | None |
| `gender` | Student | `gender` | Yes | Yes | Yes | Yes | No | Yes | text contract; UI values require parity review | tenant/school/branch | create/update audit | policy review |
| `nationality` | Student | `nationality` | Yes | Yes | Yes | Yes | No | Yes | trimmed text | tenant/school/branch | create/update audit | None |
| `birthCountryCode` | Student | `birth_country_code` | Yes | No in current profile patch | No | No | No | Yes | two uppercase letters when present | tenant/school/branch | create audit; update policy unresolved | DOMAIN/API decision |
| `preferredName` | Student | `preferred_name` | Yes in canonical command | Patch capability exists | Yes in canonical mapper | No in current Profile form | No | Yes | trimmed non-empty when present | tenant/school/branch | create/update audit if changed | bounded UI parity decision |

## Read/Write sequence

| Field | Create → Persist | Persist → Read | Read → Edit | Edit → Persist | Overall |
|---|---|---|---|---|---|
| fullName | Complete | Complete | Complete | Complete | SUPPORTED |
| studentCode | Complete, with generation path | Complete | Complete | Complete with version requirement | PARTIAL contract difference |
| birthDate | Complete | Complete | Complete | Complete | SUPPORTED |
| gender | Complete | Complete | Complete | Complete | SUPPORTED |
| nationality | Complete | Complete | Complete | Complete | SUPPORTED |
| birthCountryCode | Complete | Missing | Missing | Missing | DOMAIN/API DECISION REQUIRED |
| preferredName | Complete | Complete | Missing in current UI | Backend patch capability | BOUNDED PROFILE UI DECISION |

## Contract decision boundary

No source conflict was found for these fields: `birthCountryCode` and `preferredName` both have `students` as their demonstrated canonical owner. However, the allowed Profile surface is not approved for either missing parity path:

- `birthCountryCode`: decide read-only exposure versus full Edit support before any mapping is added.
- `preferredName`: decide whether the Profile UI should expose the existing canonical capability.

`email`, `phone`, `address`, `religion`, and `nationalId` remain outside this contract. `classroom`, `section`, `status`, and `admissionReference` remain owned by Enrollment/Academic Status and are not moved into Student.

## Result

`P1-006-30 = DOMAIN/API DECISION REQUIRED`
