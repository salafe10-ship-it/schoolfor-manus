# STU-AFFAIRS-P2-006-67 — Validation

## Contract matrix

| Condition | Result |
|---|---|
| List identity source | `student_id` from the canonical list response |
| Parent `students` name lookup | Not used for row identity |
| Synthetic student name | Not generated |
| Sorting | Existing current-row deterministic sorting preserved |
| Search/filter | Existing canonical refresh and stale-response guards preserved |
| Selection/detail | Existing document-ID binding preserved |
| Mutation semantics | Unchanged |
| API/backend/database changes | None |

## Required checks

| Check | Result |
|---|---|
| F02 identity-source regression | PASS — included in 51/51 suite |
| Student Documents regression suite | PASS — 51/51 across 4 files |
| TypeScript | PASS |
| Vite production build | PASS |
| Server bundle | PASS — 4 existing `import.meta`/CommonJS warnings |
| `git diff --check` | PASS — LF/CRLF normalization warning only |
| Scoped secret scan | PASS |

## Closure gate

If the current canonical list response is insufficient for a human-readable name, this bounded implementation remains valid because it displays the canonical `student_id` explicitly. No API contract is invented inside this mission.

## Closure

`STU-AFFAIRS-P2-006-67 = CODE-LEVEL CLOSED — STUDENT DOCUMENT LIST IDENTITY SOURCE-OF-TRUTH`
