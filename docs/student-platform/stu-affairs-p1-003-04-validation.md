# STU-AFFAIRS-P1-003-04 — Discovery Validation

## Validation status

`DISCOVERY PASS — IMPLEMENTATION NOT STARTED`

No source code, SQL, migration, RLS policy, or production environment was changed for this Discovery step.

## Verified evidence

- `GET /api/students` accepts page/limit/search/filter/sort inputs and returns `meta.totalCount`, page, and limit.
- `CanonicalStudentReadRepository` executes a parameterized `LIMIT/OFFSET` query under trusted tenant context.
- The active Student Affairs screen requests page 1 with limit 100 and performs the remaining filtering, sorting, and pagination locally.
- The active screen ignores `meta.totalCount`.
- Stage/grade/class/sort/page/page-size changes do not trigger a server query.
- `classroom` and `feesOutstandingOnly` are currently accepted by the API but are not applied by the canonical SQL query.
- Existing migration indexes were inspected for discovery only; no index was added or changed.

## Required implementation tests (next phase)

### API contract

- page 1 and page N return only the requested rows;
- totalCount remains correct when a page is empty;
- all accepted filters change the SQL predicate;
- invalid page, limit, sort field, and enum values are rejected or bounded;
- client school/tenant spoofing is ignored or rejected;
- trusted branch scope remains enforced.

### UI contract

- search, filter, sort, page, and page-size each issue the expected request;
- rapid search cannot display an older response over a newer one;
- total and page count come from response metadata;
- empty, loading, error, and no-result states remain correct;
- no local `slice`, local global filtering, or local global sort remains in the server-authoritative grid path.

### Performance

- measure p95 for first page, filtered page, and deep page;
- measure request count during debounced typing;
- measure count query cost at representative school sizes;
- verify no query returns more than the requested limit.

## Exit gate

Do not implement until the open decisions in the Query Contract are approved or mapped to existing canonical fields. After approval, implement the smallest API/client change and rerun the complete regression suite.

