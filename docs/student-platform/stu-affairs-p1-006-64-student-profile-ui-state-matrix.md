# STU-AFFAIRS-P1-006-64 — Student List/Profile UI State Matrix

| Surface | State | User-visible behavior | Integrity rule |
|---|---|---|---|
| Student List | Loading | Shows a live loading row while the canonical request is pending | Older responses are cancelled/ignored |
| Student List | Error | Shows a recoverable alert message | Error is never represented as an empty success state |
| Student List | Empty | Shows no persisted records for the active trusted scope | No synthetic rows or counts are created |
| Student List | No match | Shows a distinct filtered no-match message | Search result is not presented as a database failure |
| Student List | Page/filter change | Clears previous row selection | Batch actions cannot retain hidden-page IDs |
| Student Profile | Canonical data | Shows full name, preferred name when present, student number, birth date, gender, and nationality | Values come from the canonical Student response |
| Student Profile | Missing optional value | Shows `غير متوفر` | No invented value is displayed |
| Student Profile | Guardian boundary | Does not display Guardian phone or Guardian identity as Student fields | Guardian data remains outside the Student Profile canonical field set |
| Student Profile | Unsupported sensitive fields | National ID is not rendered | No sensitive field is exposed by this surface |

## Explicit exclusions

Placement, status, admission reference, email, phone, address, religion, classroom, section, birth-country code, documents, storage, timeline, export, print, lifecycle, bulk actions, authorization, and tenant redesign are not part of this contract.

