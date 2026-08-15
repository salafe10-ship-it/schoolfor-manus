# Guardian Profile Screen Contract

Mission: EWP-002
Scope: Contract only; no UI implementation.

## Purpose

Create, view, verify, and maintain a Guardian profile while preserving tenant isolation, consent history, and controlled contact preferences.

## Actors

- Admissions Officer
- School Administrator
- Authorized Registrar
- Safeguarding or Compliance Officer for verification decisions

The active tenant, school, branch, user, and audit context come from the trusted session. They are never selected from client identity values.

## Permissions

- `Guardian.View`
- `Guardian.Create`
- `Guardian.Edit`
- `Guardian.Verify`
- `Guardian.ContactPreference.Edit`
- `Guardian.Archive`

Verification permissions must be separated from ordinary profile editing where required by policy.

## Workflow

1. Resolve trusted tenant and scope.
2. Search for an existing Guardian before creation.
3. Enter or review profile data.
4. Validate contact formats and duplicate identity rules.
5. Save profile changes using optimistic concurrency.
6. Create or update verification records through the verification workflow.
7. Record contact preferences and consent changes.
8. Write audit metadata and Outbox events atomically.

## Validation Matrix

| Field/Action | Validation | Failure |
|---|---|---|
| Guardian number | Server-generated or authorized override; unique per tenant | `GRD-NUM-001` |
| Legal name | Required, trimmed, valid length | `GRD-VAL-001` |
| Email | Valid normalized format when supplied | `GRD-VAL-002` |
| Phone | Valid normalized contact value when supplied | `GRD-VAL-003` |
| School/branch | Must match trusted scope | `GRD-CTX-001` |
| Verification | Authorized type, source, and state transition | `GRD-VER-001` |
| Contact preference | Valid channel, purpose, and consent state | `GRD-CON-001` |
| Update | Expected version must match | `GRD-CON-002` |
| Archive | No legal hold or active required relationship | `GRD-LIF-001` |

## Business Rules

- A Guardian belongs to one tenant.
- A Guardian may be linked to multiple students within the same tenant.
- Cross-tenant linking is forbidden.
- Verification evidence is represented by hashes or trusted references, never raw secrets.
- Verification status changes require authorization and audit logging.
- Contact preferences are consent records, not notification delivery records.
- A revoked consent must not be silently restored.
- Archived Guardians cannot receive active preferences or new verification attempts without an approved restoration workflow.
- Client-supplied audit fields are ignored.

## Screen States

- Initial
- Loading profile
- Ready
- New Guardian
- Verification pending
- Verification review
- Saving
- Success
- Validation failure
- Authorization failure
- Concurrency conflict
- Server failure

## Loading and Empty States

- Profile loading disables mutation controls.
- Verification history loading shows an independent progress state.
- No verification history displays a clear “not yet verified” state.
- No contact preferences displays a consent setup action.
- No permission displays a read-only profile or an access-denied state.

## Error States

- `401`: session expired; return to trusted login.
- `403`: permission or scope denied; do not retry automatically.
- `404`: Guardian is unavailable within the trusted scope.
- `409`: duplicate profile or version conflict.
- `422`: validation or policy failure.
- `5xx`: show correlation ID and preserve only non-sensitive current-session form state.

Sensitive verification details must not be exposed in generic error messages.

## Performance Budget

- Profile load p95: ≤ 300 ms.
- Guardian search before create p95: ≤ 500 ms.
- Standard profile update p95: ≤ 800 ms.
- Verification history load p95: ≤ 500 ms.
- User-visible save response p99: ≤ 2 seconds.

## Accessibility and Security

- Full keyboard navigation and visible focus states.
- Every field has an accessible label and error association.
- Verification status is not conveyed by color alone.
- Sensitive fields are masked where appropriate.
- Audit and tenant context are never editable.
- Screen output is restricted to authorized tenant and school scope.

