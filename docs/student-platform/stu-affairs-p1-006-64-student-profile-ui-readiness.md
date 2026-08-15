# STU-AFFAIRS-P1-006-64 — Student Profile UI Readiness

## Scope

This bounded task covers only the Student List and Student Profile surfaces in `src/components/StudentAffairsPortal.tsx`, directly related tests, and this documentation. Student Documents, Binary/Storage, F02, Timeline, Export/Print, Lifecycle, Bulk, Graduation, Authorization, Tenant Engine, API, Service, Repository, DB, SQL, Migration, RLS, Staging, and Production are outside the scope.

## Findings and actions

| Area | Result | Action |
|---|---|---|
| Loading state | Ready | Existing database loading state retained with `role=status` and live announcement |
| Error state | Improved | Server error is rendered as `role=alert`, distinct from an empty result |
| Empty state | Improved | No persisted records has a different message from a filtered no-match result |
| Server pagination | Ready | Existing canonical metadata and server-owned page request retained |
| Search/filter | Ready | Existing keyword, status, and section query contract retained |
| Selection consistency | Improved | Page, school, filter, sort, and page-size changes clear stale row selection |
| Stale list response | Ready | Existing AbortController and cancellation guard prevent an older response from replacing a newer context |
| Profile fields | Improved | Profile now presents canonical name, preferred name when persisted, student number, birth date, gender, and nationality |
| Student/Guardian separation | Improved | Guardian name, classroom, and section are removed from the canonical Student Profile detail surface |
| Sensitive exposure | Ready | National ID and Guardian phone are not rendered in the Profile surface |
| Synthetic values | Ready | Missing values are shown as unavailable; no preferred-name fallback is manufactured |

## Deliberate non-changes

No new fields, API calls, domain source, persistence behavior, authorization behavior, tenant behavior, database object, or storage behavior was introduced.

## Decision

`P1-006-64 = CODE-LEVEL CLOSED — STUDENT PROFILE UI READY`

