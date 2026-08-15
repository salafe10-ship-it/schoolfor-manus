# STU-AFFAIRS-P0-006-05 — Academic Results and GPA Source Discovery

Status: `DISCOVERY COMPLETE — GPA SOURCE NOT PROVEN`

## Scope

Read-only discovery of existing Exams, Results, Marks, Subjects, GPA, calculations, repositories, APIs, and academic-context relationships. No implementation, SQL, migration, schema, RLS, UI, or database changes were made.

## Trace matrix

| Layer | Evidence found | Classification |
|---|---|---|
| Exams UI | `src/components/ExamsResultsModule.tsx` | `LEGACY / PARTIAL` |
| Subjects | `INITIAL_SUBJECTS` and component state | `SEED / MOCK` |
| Students in results | `INITIAL_STUDENTS_MOCK` plus component `studentList` | `SEED / PARTIAL` |
| Marks | `INITIAL_GRADES_MOCK`, `gradesMatrix`, local state and JSON payload | `MOCK / PARTIAL` |
| Result calculation | `computeStudentResults` calculates totals, percentage, pass/fail and symbols in React | `LEGACY / NOT CANONICAL` |
| GPA | No authoritative GPA service or repository found; previous-year GPA and attendance warnings include simulated values | `NOT PROVEN / MOCK` |
| API | `GET/POST /api/exams/database` | `PROVEN — JSON DOCUMENT PATH` |
| Repository | `ExamsRepository.getExams/saveExams` | `PARTIAL / LEGACY` |
| Persistence | `exams_database` JSON field by `school_id`, with fallback storage path | `NOT PROVEN AS ACADEMIC SOURCE` |
| Academic year | Exams default settings include text `2025/2026`; no FK to `academic_years` | `MOCK / NOT PROVEN` |
| Term | Exams default settings include display text `الفصل الدراسي الثاني`; no FK to `terms` | `MOCK / NOT PROVEN` |
| Enrollment | No `enrollment_id` relationship in the reviewed results payload or calculation path | `NOT PROVEN` |
| Calculation validator | `ExamValidator` validates basic exam shape, not academic result integrity or GPA | `PARTIAL` |
| Result history/locking | UI has local snapshots/audit-like state; canonical result history is not proven | `NOT PROVEN` |

## Key evidence

- `ExamsResultsModule.tsx` seeds subjects, students, and grades in memory.
- `computeStudentResults` uses UI state and subject definitions to calculate percentages and status.
- `previousYearGPA` and attendance values are explicitly simulated for warnings.
- `/api/exams/database` reads/writes a JSON document; it does not expose student-result rows keyed by enrollment, academic year, and term.
- `ExamValidator.validateDatabase` does not validate student marks, academic context, result locking, GPA provenance, or calculation version.

## Discovery decision

`GPA SOURCE NOT PROVEN`

The current Exams/Results path cannot be used as the authoritative source for Graduation without an owner-approved Results domain and academic-context contract.
