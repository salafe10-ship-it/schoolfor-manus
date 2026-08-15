# STU-AFFAIRS-P2-006-67 — Identity Source Decision

| Decision | Evidence |
|---|---|
| Canonical list identity field | `student_id` in the current Student Documents list response |
| Approved display name in list response | Not present in the current contract |
| Parent `students` prop as list source | Not approved; it is UI context and may not contain the row's canonical identity |
| List display | Explicit `معرّف الطالب: <student_id>` |
| New API/JOIN/DB field | Not introduced |

This decision is bounded to the Student Documents list presentation. A future product/API decision may add an approved display-name field, but that is outside this mission.
