# Guardian Search Screen Contract

Mission: EWP-002
Scope: Contract only; no UI implementation.

## Purpose

Find Guardians within the trusted tenant and permitted school scope for profile review, relationship linking, verification, or contact-preference management.

## Actors

- Admissions Officer
- School Administrator
- Authorized Registrar
- Safeguarding or Compliance Officer

## Permissions

- `Guardian.View`
- `Guardian.Search`
- `Student.Guardian.Link` for link actions
- `Guardian.Verify` for verification actions

Search results and actions must use the centralized authorization engine.

## Search Inputs

- Guardian number
- Exact or normalized name
- Phone number
- Email address
- Verification status
- Profile status
- School and branch filters allowed by trusted scope

Search must not accept tenant identity from the request as an authority source.

## Search Rules

- Tenant filtering is mandatory.
- School and branch filters can only reduce the trusted scope.
- Exact guardian number search is preferred.
- Name search uses normalized fields and bounded pagination.
- Sensitive identity matches must not reveal full data to unauthorized users.
- Results are limited to the minimum fields required for the current workflow.
- Fuzzy matching is reserved for duplicate review and requires elevated permission.
- Search terms and access decisions are audit-relevant where policy requires it.

## Result Contract

Each result may expose:

- Guardian ID
- Guardian number
- Display name
- Masked primary contact
- Verification status
- Profile status
- Permitted school or branch context
- Last updated timestamp

Raw identity evidence, custody information, and unrestricted contact data are excluded from standard search results.

## Workflow

1. Resolve trusted session and tenant context.
2. Validate search permission.
3. Validate and normalize search input.
4. Apply mandatory tenant and scope predicates.
5. Execute bounded, paginated search.
6. Display only authorized result fields.
7. Allow profile or link actions only after a second permission check.

## Validation Matrix

| Input/Action | Validation | Failure |
|---|---|---|
| Search term | Trimmed, bounded length | `GRD-SRCH-001` |
| Guardian number | Exact normalized format | `GRD-SRCH-002` |
| School/branch filter | Must belong to trusted scope | `GRD-CTX-001` |
| Page size | Maximum 100 records | `GRD-SRCH-003` |
| Fuzzy search | Elevated duplicate-review permission | `GRD-AUTH-001` |
| Profile action | Separate view/edit/link permission | `GRD-AUTH-002` |

## Screen States

- Initial
- Loading
- Ready
- Results found
- No results
- Invalid search
- Scope denied
- Rate limited
- Server failure

## Empty and Error States

- No query: explain available search methods.
- No results: confirm that no Guardian was found within the authorized scope.
- Scope denied: do not disclose whether a record exists elsewhere.
- Rate limit: provide controlled retry guidance.
- Server error: show correlation ID without database details.

## Performance Budget

- Exact number search p95: ≤ 250 ms.
- Normalized name search p95: ≤ 500 ms.
- Filtered search p95: ≤ 700 ms.
- p99 response target: ≤ 1.5 seconds.
- First page maximum: 50 records.
- Hard maximum page size: 100 records.

## Accessibility and Security

- Search fields and filters are keyboard accessible.
- Result tables provide accessible headers and row actions.
- Loading, empty, and error states are announced to assistive technology.
- No sensitive data is exposed through URLs, client storage, or unmasked bulk results.
- Results are tenant-aware and cache keys must include tenant, school, and branch scope.

