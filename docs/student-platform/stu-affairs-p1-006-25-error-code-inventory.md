# STU-AFFAIRS-P1-006-25 — Error Code Inventory

## Existing stable codes observed

| Code | Meaning | Source / status |
|---|---|---|
| `VALIDATION_ERROR` | Request or business input is invalid | Central `ValidationError`, HTTP 400 |
| `AUTHENTICATION_ERROR` | Identity/session authentication failed | Central auth error, HTTP 401 |
| `AUTHORIZATION_ERROR` | Permission or trusted-scope access denied | Central authorization error, HTTP 403 |
| `NOT_FOUND_ERROR` | Entity is absent in trusted scope | Central not-found error, HTTP 404 |
| `CONFLICT_ERROR` | Version, uniqueness, idempotency, or state conflict | Central conflict error, HTTP 409 |
| `BUSINESS_RULE_ERROR` | Domain rule rejects operation | Central business error, HTTP 422 |
| `DATABASE_ERROR` | Unexpected persistence/database failure | Central database error, HTTP 500 |
| `EXTERNAL_SERVICE_ERROR` | External provider failure | Central external error, HTTP 502 |
| `GRADUATION_NOT_READY` | Graduation intentionally blocked | Explicit route, HTTP 409 |
| `STU-IDM-001` | Missing registration idempotency key | Registration validation detail, HTTP 400 |
| `STU-GUARD-002` | Guardian update attempted through non-canonical route | Student compatibility route detail, HTTP 400 |

## Contract gaps / proposed future codes

These names are proposed for owner review only; they are not implemented here:

| Proposed code | Use |
|---|---|
| `STU-API-UNKNOWN-OPERATION` | Bulk operation is outside the explicit enum |
| `STU-API-EMPTY-MUTATION` | Request would produce no mutation and must not claim success |
| `STU-API-TENANT-CONTEXT-REQUIRED` | Trusted tenant context missing before endpoint/service execution |
| `STU-API-SCOPE-DENIED` | Student/item is outside the resolved school/branch scope |
| `STU-API-PERMISSION-REQUIRED` | Operation-specific permission missing |
| `STU-API-OUTCOME-UNKNOWN` | Commit outcome cannot be proven after transport/database failure |
| `STU-LIFECYCLE-CANONICAL-REQUIRED` | Legacy lifecycle route is gated pending canonical domain contract |
| `STU-BULK-CANONICAL-REQUIRED` | Bulk operation is blocked pending canonical batch contract |
| `STU-BULK-IDEMPOTENCY-REQUIRED` | Replayable bulk command lacks an idempotency key |
| `STU-VERSION-CONFLICT` | Explicit optimistic concurrency conflict |

## Rule

No proposed code becomes a production contract without owner approval and a separate implementation order.

