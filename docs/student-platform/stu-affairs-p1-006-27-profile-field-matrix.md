# STU-AFFAIRS-P1-006-27 — Student Profile Field Matrix

| Group | Fields | Canonical source of truth | Current read behavior | Current write behavior | Safe profile-only action |
|---|---|---|---|---|---|
| Student identity | fullName, studentCode, birthDate, gender, nationality | `students` | Returned from canonical student row | Canonical create/update | Keep editable with persisted-field confirmation |
| Student birth detail | birthCountryCode | `students.birth_country_code` | Not returned by `mapCanonicalStudentRow` | Create command supports it; update patch does not | Requires read/edit parity before exposing |
| Student contact | email, phone, address | No canonical EWP-001 Student columns | Email/address absent; phone is guardian phone projection | Ignored by canonical Student writer | Hide/mark unsupported; do not remap to Guardian |
| Student sensitive identity | nationalId | No canonical EWP-001 Student column; document domain may own evidence | Always returned as empty string in canonical read mapper | Ignored by canonical writer | Hide or route to approved identity/document contract |
| Student social data | religion | No canonical EWP-001 Student column | Not returned | Ignored | Hide or await approved schema/domain contract |
| Guardian identity/contact | parentName, parentPhone, parentEmail, relation | Guardian + student_guardians | Name/phone/relation projected; email not projected | Create via registration; edit via canonical Guardian workflow; email absent from form | Use Guardian contract and explicit separate field; no fallback |
| Enrollment/placement | admissionReference, grade, classSection, academic year | Enrollment | Not a Student Profile projection | Admission reference generated server-side; grade/section ignored by Student writer | Do not fix in Profile mission |
| Academic lifecycle | status | Academic Status | Status is mapped from canonical state | Sensitive changes use lifecycle path; not ordinary profile patch | Keep out of profile writer |

## Contract rule

The screen must not present a field as saved unless the response contains a canonical persisted representation for that field or the field is explicitly labeled as a separate workflow.
