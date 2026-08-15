# STU-AFFAIRS-P1-003-04 — Student Query Contract

## Endpoint

`GET /api/students`

Execution order remains:

`Authentication → Permission → Trusted Tenant Context → Canonical PostgreSQL Read → Response`

The client may provide query intent only. Tenant, school, branch, academic year, and identity remain server-derived.

## Request query

| Parameter | Type | Required | Contract |
|---|---|---:|---|
| `page` | positive integer | no | 1-based; default 1; bounded by server. |
| `limit` | positive integer | no | default 25 or existing approved default; bounded by server. |
| `search` | string | no | normalized quick search over the explicitly approved searchable fields. |
| `status` | enum | no | canonical Student status only. |
| `gender` | enum | no | canonical gender only. |
| `classroom` | string/reference | no | exact canonical class filter; must be applied server-side or removed from the public contract. |
| `section` | string/reference | no | exact canonical section filter; must be applied server-side or removed from the public contract. |
| `stage` | string/reference | no | canonical stage filter when the active schema supports it. |
| `academicYear` | UUID/reference | no | trusted academic-year context or an explicitly authorized filter; never a client tenant selector. |
| `feesOutstanding` | boolean | no | only if a canonical finance read contract exists; otherwise do not expose as an effective filter. |
| `sortBy` | enum | no | server whitelist only. |
| `sortOrder` | `asc\|desc` | no | default desc. |

## Server rules

- Ignore compatibility `schoolId` as an identity source; validate any supplied value against trusted context or reject a mismatch.
- Reject unknown sort fields rather than interpolating them into SQL.
- Use parameterized values for all filters.
- Apply every accepted filter in the SQL predicate. An accepted-but-ignored filter is a contract defect.
- Return only the requested page.
- Keep deterministic tie-breaking with `id ASC` after the selected sort.
- Preserve tenant/school/branch predicates and soft-delete behavior.
- Use an authoritative count strategy; `COUNT(*) OVER()` is acceptable if latency is measured at target scale.
- Normalize empty search strings to no search.

## Response

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 25,
    "totalCount": 0,
    "totalPages": 1,
    "hasNext": false,
    "hasPrevious": false,
    "sortBy": "registrationDate",
    "sortOrder": "desc"
  }
}
```

The UI must not derive global totals, page counts, or filter results from the current page array.

## Client behavior contract

- Keep one active server query state for the Student Affairs grid.
- Debounce text search at approximately 250–300 ms.
- Abort or logically supersede the previous request when a new query starts.
- Reset `page` to 1 when search, filter, sort, or page size changes.
- Request the selected `page` and `limit`; do not request page 1 and slice locally.
- Render loading, empty, error, and stale-response states from the query state.
- Use `meta.totalCount` for the dashboard/grid total and `meta.totalPages` for navigation.
- Decide explicitly whether export/print is current-page or server-export; never imply a full export from a partial page.

## Open decisions before implementation

1. Canonical source for stage/grade/class: enrollment references or another approved table.
2. Whether Guardian fields are searchable in the Student grid or belong to a separate Guardian search.
3. Whether finance outstanding filtering is in scope for this endpoint.
4. Approved default/max page size after performance testing.
5. Whether counts are exact on every request or eventually consistent for very large tenants.

