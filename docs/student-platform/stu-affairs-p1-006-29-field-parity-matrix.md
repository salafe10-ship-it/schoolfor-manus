# STU-AFFAIRS-P1-006-29 — Student Field Parity Matrix

| Field | Create request | Create persistence | Edit request | Edit persistence | Read projection | Parity |
|---|---|---|---|---|---|---|
| `fullName` | `name` split into legal names | `students.legal_*` | `name` split into legal names | Same columns | Reassembled as `name` | SUPPORTED |
| `studentCode` | `studentCode`/`studentNumber` | `students.student_number` | `studentCode`/`studentNumber` | `students.student_number` with version | `studentNumber`/`studentCode` | PARTIAL: Create can omit for generation; Edit validates supplied value |
| `birthDate` | `birthDate` → `dateOfBirth` | `students.date_of_birth` | `birthDate` → `dateOfBirth` | Same column | `birthDate` | SUPPORTED |
| `gender` | `gender` | `students.gender` | `gender` | `students.gender` | `gender` | SUPPORTED; allowed-value policy differs by UI/server contract |
| `nationality` | `nationality` | `students.nationality` | `nationality` | `students.nationality` | `nationality` | SUPPORTED |
| `birthCountryCode` | Command supports it | `students.birth_country_code` | Not sent by profile edit; patch type does not support it | Not editable | Not projected by profile read | PARTIAL / DOMAIN CONTRACT REQUIRED |
| `preferredName` | Command supports it | `students.preferred_name` | Not sent by this profile form; patch supports it | Canonical patch-capable | Not exposed by this form, mapper supports it | PARTIAL |
| `Guardian` | Required nested guardian; phone/email/address supported by registration command | `guardians` + `student_guardians` | Separate canonical Guardian update with expected versions | Guardian + relationship tables | Name/phone/relation projected; email not projected | SEPARATE WORKFLOW |
| `admissionReference` | Server compatibility route supplies a registration reference; canonical command accepts it | `enrollments.admission_reference` | Not a Student Profile edit field | Not applicable | Not projected by Student read | ENROLLMENT-OWNED |
| `classroom` / `section` | Profile UI previously submitted them; P1-006-28 removed them | Enrollment owns placement | Not sent after P1-006-28 | Not Student-owned | Read via active Enrollment lateral join | ENROLLMENT-OWNED |
| `status` | Registration starts `applicant`; profile compatibility route has suspended special path | Student/Academic Status chain | General status is not a canonical profile patch | Lifecycle-specific path only | Current status projected | LIFECYCLE-OWNED |
| `email` / `phone` / `address` / `religion` / `nationalId` | Not canonical Student command fields | Not in EWP-001 Student table | Not canonical Student patch fields | Not persisted | Absent or empty | SCHEMA/DOMAIN DEPENDENCY |

## Validation parity

| Validation | Create | Edit | Result |
|---|---|---|---|
| Required legal name | Yes | Yes through name split | SUPPORTED |
| Date format/calendar | Yes | Yes | SUPPORTED |
| Student number format | Optional with canonical generation path | Required if patch includes field | PARTIAL |
| Guardian | Required nested input | Separate Guardian workflow and version IDs | INTENTIONAL WORKFLOW DIFFERENCE |
| Term/academic context | Required for registration | Not used by profile patch | DOMAIN WORKFLOW DIFFERENCE |
| Idempotency | Required | Not present in profile update contract | DIFFERENT SEMANTICS |
| Optimistic version | Initial version 1 | Required and incremented | SUPPORTED, different lifecycle |
