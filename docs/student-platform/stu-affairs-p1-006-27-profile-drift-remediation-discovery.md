# STU-AFFAIRS-P1-006-27 — Student Profile Contract Drift Remediation Discovery

Status: `DISCOVERY COMPLETE — DOMAIN/SCHEMA DEPENDENCIES IDENTIFIED`

## Scope

Static tracing only for the Student Profile create/edit path:

`StudentAffairsPortal → StudentRepository → POST /api/students → canonical mapping → StudentRegistrationService / CanonicalStudentWriteRepository → PostgreSQL`

No UI, API, repository, schema, lifecycle, authorization, tenant, or persistence code was changed.

## Executive result

The profile form exposes more fields than the canonical Student contract persists. Some fields are safely persisted, some are ignored by the canonical mapper, and some belong to Guardian or Enrollment domains. A success response can therefore leave the user believing that unsupported profile values were saved.

The main proven drift is not an authentication or tenant defect. It is a contract mismatch between the legacy-shaped profile form and the canonical Student/Guardian/Enrollment writers.

## Field findings

| Field | UI source | Request field | Server mapping | Canonical owner/column | Persistence result | Create/Edit parity | False-success risk | Classification |
|---|---|---|---|---|---|---|---|---|
| `nationality` | `StudentAffairsPortal.formData.nationality` | `nationality` | Registration command and Student patch | `students.nationality` | Persisted on create and canonical update | Yes | Low | PROVEN SAFE |
| `birthCountryCode` | No field in the inspected profile form | Supported by registration command | Passed only when supplied | `students.birth_country_code` | Persistable by canonical registration; not user-editable in this screen | No UI source | Medium if added without edit/read parity | SAFE CAPABILITY, UI CONTRACT NEEDED |
| `admissionReference` | No profile field | Not supplied by form | Server sets `STUDENT-AFFAIRS-REGISTRATION` | `enrollments.admission_reference` | Generated during registration/enrollment, not a Student Profile field | N/A | Low | ENROLLMENT-OWNED |
| `guardianName` / `parentName` | Profile form | `parentName` | Registration creates guardian; edit uses canonical guardian endpoint | `guardians.legal_*` and `student_guardians` | Persisted through the Guardian workflow when required versions/IDs exist | Create and edit use different paths | Medium if guardian operation fails after local UI state changes | GUARDIAN-OWNED |
| `guardianPhone` / `parentPhone` | Profile form | `parentPhone` | Registration guardian input; edit canonical guardian update | `guardians.phone` | Persisted through Guardian workflow | Yes, with separate update call on edit | Medium | GUARDIAN-OWNED |
| `guardianEmail` / `parentEmail` | No matching field in inspected form state | Server accepts `parentEmail` only if supplied | Registration passes explicit guardian email; edit form never supplies it | `guardians.email` | Create-capable; edit is not exposed by this screen | No | High if UI implies editable guardian email | GUARDIAN-OWNED / PARITY GAP |
| `email` | Profile form | `email` | `toCanonicalRegistrationCommand` and `toCanonicalStudentPatch` do not map it | No canonical `students.email` column in EWP-001 schema | Ignored by canonical create/update path | No | High | PROVEN DRIFT / SCHEMA DEPENDENCY |
| `phone` | Profile state exists, but edit display is populated from `student.parentPhone` | No canonical Student phone mapping | Not mapped by canonical Student writer | No canonical `students.phone` column in EWP-001 schema | Not persisted as Student phone; may be confused with Guardian phone | No | High | PROVEN DRIFT / GUARDIAN CONFUSION |
| `address` | Profile form | `address` | Not mapped by canonical Student registration or patch | No canonical `students.address` column in EWP-001 schema | Ignored by canonical create/update path | No | High | PROVEN DRIFT / SCHEMA DEPENDENCY |
| `religion` | Profile form | `religion` | Not mapped by canonical Student registration or patch | No canonical `students.religion` column in EWP-001 schema | Ignored by canonical create/update path | No | High | PROVEN DRIFT / SCHEMA DEPENDENCY |
| `nationalId` | Profile form | `nationalId` | Not mapped by canonical Student registration or patch | No canonical `students.national_id` column in EWP-001 schema | Ignored by canonical create/update path | No | High | PROVEN DRIFT / SCHEMA DEPENDENCY |
| `fullName` | Profile form | `name` | Split into legal first/middle/last | `students.legal_*` | Persisted after canonical name validation | Yes | Low | PROVEN SAFE |
| `studentCode` | Profile form | `studentCode` | Maps to `studentNumber` | `students.student_number` | Persisted with canonical format validation | Yes | Low | PROVEN SAFE |
| `birthDate` | Profile form | `birthDate` | Maps to `dateOfBirth` | `students.date_of_birth` | Persisted with date validation | Yes | Low | PROVEN SAFE |
| `gender` | Profile form | `gender` | Maps to canonical `gender` | `students.gender` | Persisted | Yes | Low | PROVEN SAFE |
| `status` | Profile form | `status` | Only the special suspended path is handled; ordinary status values are not a profile patch field | Academic Status domain | Partially handled; not a safe profile field | No | High | LIFECYCLE-OWNED / OUT OF SCOPE |
| `grade` / `classSection` | Profile form | `classroom` / `section` | Not mapped in canonical Student patch | Enrollment placement references | Ignored by canonical profile update | No | High | ENROLLMENT-OWNED |

## False-success and fallback observations

- The API returns a successful canonical Student response after the canonical mapper ignores unsupported request fields; the response does not prove that every UI field was persisted.
- `useStudentProfile` can display a synthetic fallback email (`<student-id>@school-erp.edu`) when the read model has no email. This is display-only data and must never be treated as persisted identity or contact data.
- The canonical read mapper returns `nationalId: ''`, omits Student email/address/religion, and maps guardian phone into `parentPhone`. This can make an edit form appear to lose or overwrite values even when the underlying canonical record was unchanged.
- The inspected path contains no `student.email → guardian.email` fallback. Guardian email is only passed when an explicit guardian email input exists.

## Boundary decision

`P1-006-27 = DOMAIN/SCHEMA DEPENDENCY — IMPLEMENTATION BLOCKED`

The safe next implementation cannot add database columns or redefine ownership under this discovery order. Profile-only remediation may proceed later only for explicit UI/contract alignment (hide or mark unsupported fields, remove synthetic defaults, and show persisted-field status) after CTO approval. Email, phone, address, religion, national ID, placement, status, and admission reference require their owning domain/schema contracts.
