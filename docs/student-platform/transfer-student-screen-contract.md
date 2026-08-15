# Transfer Student Screen Contract

Mission: EWP-003
Scope: Contract only; no UI implementation.

## Purpose

Request, approve, and complete a controlled transfer between authorized school or branch scopes while preserving enrollment history.

## Actors

- Source School Registrar
- Destination School Registrar
- School Administrator
- Authorized Transfer Approver

## Permissions

- `Enrollment.Transfer.Request`
- `Enrollment.Transfer.Approve`
- `Enrollment.Transfer.Complete`
- `Enrollment.View`

Approval and completion permissions must be separated where policy requires separation of duties.

## Workflow

1. Resolve trusted tenant and source scope.
2. Select the active source enrollment.
3. Validate destination school and branch within the tenant.
4. Validate no destination overlap.
5. Enter reason, effective date, and idempotency key.
6. Submit transfer request.
7. Obtain independent approval.
8. Create destination enrollment and close source enrollment atomically.
9. Append transfer and enrollment history.
10. Publish the transfer event through Outbox.

## Validation Matrix

| Field/Action | Validation | Failure |
|---|---|---|
| Source enrollment | Exists, active, and tenant-scoped | `TRF-SRC-001` |
| Destination | Valid school and branch in same tenant | `TRF-DST-001` |
| Destination difference | Source and destination cannot be identical | `TRF-DST-002` |
| Admission | Destination activation requires approved admission reference | `TRF-ADM-001` |
| Effective date | Valid period and no overlap | `TRF-PER-001` |
| Approval | Independent authorized approval required | `TRF-AUTH-001` |
| Completion | Destination enrollment must exist | `TRF-CMP-001` |
| Repeated request | Idempotency key must match original payload | `TRF-IDM-001` |
| Concurrency | Source enrollment version must match | `TRF-CON-001` |

## Business Rules

- Cross-tenant transfers are forbidden.
- Source enrollment is not closed until destination creation succeeds.
- Transfer is atomic; partial source closure is not acceptable.
- A completed transfer closes the source enrollment with status `transferred` and an end date.
- Destination enrollment cannot overlap another enrollment for the same student.
- Transfer history is immutable and retained for reporting.
- Rejected or cancelled transfers do not close the source enrollment.
- Client-supplied actor, tenant, school, branch, and audit metadata are ignored.

## Screen States

- Initial
- Loading source enrollment
- Ready
- Validating destination
- Awaiting approval
- Completing transfer
- Success
- Validation failure
- Authorization failure
- Conflict
- Rejected
- Server failure

## Loading and Empty States

- No active source enrollment blocks transfer creation.
- No authorized destination displays an access-denied state without revealing other tenants.
- Destination validation shows progress and disables completion.
- Awaiting approval is read-only for requestors.

## Error States

- `401`: session expired.
- `403`: request, approval, or completion permission denied.
- `409`: overlap, stale source version, duplicate idempotency key, or completed transfer.
- `422`: invalid destination, admission, period, or lifecycle rule.
- `5xx`: show correlation ID and preserve only current-session non-sensitive state.

## Performance Budget

- Source enrollment lookup p95: ≤ 300 ms.
- Destination validation p95: ≤ 500 ms.
- Transfer completion p95: ≤ 1 second.
- User-visible completion response p99: ≤ 2 seconds.

## Accessibility and Security

- Full keyboard operation and accessible step progression.
- Approval state is announced to assistive technology.
- Destructive or irreversible completion requires explicit confirmation.
- Source and destination scope are visibly distinct.
- Sensitive student data is minimized in transfer results.
- All request, approval, rejection, and completion actions are auditable.

