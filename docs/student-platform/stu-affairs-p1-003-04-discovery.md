# STU-AFFAIRS-P1-003-04 — Server-Side Pagination Discovery

## Scope and decision

Discovery only. No application behavior, schema, migration, RLS, RPC, or production database was changed.

The current implementation is not server-side pagination end to end. The API and SQL repository already accept a page contract, but the main Student Affairs screen always requests page 1 with limit 100 and then filters, sorts, and paginates the returned array in the browser.

## Evidence

### API

`server.ts` exposes `GET /api/students` and forwards `search`, `classroom`, `status`, `gender`, `feesOutstanding`, `page`, `limit`, `sortBy`, and `sortOrder` to `StudentService.advancedSearch`. Authentication, permission, tenant resolution, and a transaction boundary are present.

The response already exposes `data` and `meta.totalCount`, `meta.page`, and `meta.limit`.

### Repository and SQL

`CanonicalStudentReadRepository.advancedSearch` performs a PostgreSQL `LIMIT/OFFSET` query and returns `totalCount` using `COUNT(*) OVER()`.

Implemented server predicates:

- trusted tenant, school, and branch;
- soft-delete exclusion;
- quick search over student number and legal/preferred name;
- status;
- gender.

Accepted but currently ineffective parameters:

- `classroom` is accepted by the API but not added to the SQL predicate;
- `feesOutstandingOnly` is accepted but not applied;
- the Guardian fields shown in the UI are not part of the SQL quick-search predicate.

### Student Affairs screen

`StudentAffairsPortal.tsx`:

- requests `page: 1, limit: 100`;
- sends only keyword and status to the API;
- ignores `meta.totalCount`;
- stores the returned page in the shared `students` collection;
- repeats keyword and status filtering in `filteredStudents`;
- applies stage, grade, class, and sorting locally;
- slices the local result using `currentPage` and `rowsPerPage`;
- displays local array length as the total.

The rows-per-page selector (10/20/50) changes only local slicing. Next/previous page changes do not issue a request.

### Request lifecycle

Keyword and status changes use a 250 ms timeout. Cleanup prevents stale responses from mutating React state, but there is no `AbortController`; an already-started request continues on the network. Stage, grade, class, sort, page, and page-size changes do not trigger a server request.

`useStudentSearch.ts` is a separate client-side search/pagination implementation and is not the active data-loading path of `StudentAffairsPortal.tsx`. It is therefore a duplicate search contract that must not be treated as the source of truth during implementation.

## Findings

| ID | Severity | Finding | Customer/scale impact |
|---|---|---|---|
| P1-01 | P1 | Main screen loads only the first 100 records, then paginates locally. | Students after the first 100 can be invisible, and totals are incorrect for large schools. |
| P1-02 | P1 | API `meta.totalCount` is ignored. | The UI cannot report authoritative totals or page counts. |
| P1-03 | P1 | Stage, grade, class, and sort are local-only. | Results are incomplete and inconsistent with server data. |
| P1-04 | P1 | `classroom` and `feesOutstandingOnly` are accepted but not applied in SQL. | A user can receive unfiltered results while believing a filter is active. |
| P1-05 | P2 | Quick search does not include Guardian fields despite the UI searching them locally. | Search behavior differs before and after server migration. |
| P2-01 | P2 | No abort signal for already-running requests. | Unnecessary server/database work during rapid search changes. |
| P2-02 | P2 | Duplicate client-side search implementation exists in `useStudentSearch.ts`. | Future changes can diverge and create inconsistent behavior. |
| P2-03 | P2 | Metrics and exports use the currently loaded page/local array. | Dashboard counts and exports are not global school totals. |

## Existing index evidence

The inspected migrations provide student status, branch/status, and name indexes, plus enrollment current lookup and history indexes. No new index is recommended or created in Discovery. Query implementation must be finalized against the actual active schema before any index decision.

## Discovery conclusion

The safe implementation is a server-authoritative query contract: every search/filter/sort/page change must request only the requested page, and the UI must render `items` plus server metadata. The next step requires a targeted implementation plan and tests; it must not be mixed with Guardian, RLS, migration, or tenant-engine work.

