# Student Registration Screen Contract

Mission: EWP-001
Scope: Contract only; no UI implementation.

## Purpose

Register a new student in a selected trusted school context, prevent duplicate identity creation, collect required guardian information, and submit a controlled registration request.

## Actors

- Admissions Officer
- School Administrator
- Authorized Registrar
- System Service Account for controlled imports

The active user, tenant, school, and branch come from the trusted session and tenant context. They are not selected from client-provided identity fields.

## Permissions

- `Student.Create`
- `Student.DuplicateReview` for duplicate overrides
- `Guardian.Create`
- `Student.Guardian.Link`
- `Student.Number.Override` for manual numbering only

Permission checks are server-side and must return `403` when denied.

## Workflow

1. Resolve trusted tenant, school, and branch context.
2. Load numbering and guardian policies.
3. Enter required student identity data.
4. Generate the canonical student number server-side.
5. Run exact duplicate validation.
6. Run fuzzy duplicate detection when required.
7. Create or match guardian records.
8. Validate primary guardian and consent rules.
9. Submit the registration command with an idempotency key.
10. Persist the student, guardian links, audit event, and Outbox event atomically.
11. Display the created student number and registration result.

## Validation Matrix

| Field/Action | Validation | Failure |
|---|---|---|
| Student name | Required, trimmed, valid length | `STU-VAL-001` / `STU-VAL-002` |
| Date of birth | Required, valid date, policy-compliant | `STU-VAL-002` |
| Student number | Server-generated; manual override requires permission | `STU-NUM-002` |
| School/branch | Must match trusted tenant context | `STU-CTX-001` / `STU-CTX-002` |
| Duplicate identity | Exact and policy-based fuzzy matching | `STU-DUP-001` |
| Guardian | Valid relationship and tenant scope | `STU-GRD-002` |
| Primary guardian | One active primary guardian where required | `STU-GRD-001` |
| Consent | Required for applicable relationships | `STU-GRD-001` |
| Submission | Idempotency key required for command | `STU-IDM-001` |
| Concurrent update | Expected version validated | `STU-CON-001` |

## Business Rules

- The client cannot choose tenant, school, branch, actor, or audit metadata.
- Student numbers are unique within the school and are never reused.
- A possible duplicate pauses registration for authorized review.
- Automatic numbering is the default.
- Manual numbering requires an explicit reason, permission, and audit entry.
- A guardian may be linked to multiple students within the same tenant.
- A student cannot have multiple active primary guardians.
- Cross-tenant guardian linking is forbidden.
- Registration is atomic; partial student or guardian records are not acceptable.
- Cancelled or failed submissions must not create persistent domain records.

## Screen States

- Initial
- Loading policy
- Ready
- Duplicate review required
- Saving
- Success
- Validation failure
- Authorization failure
- Conflict
- Server failure

## Loading States

- Initial context loading: disable form submission.
- Policy loading: show a non-blocking progress indicator and keep fields read-only.
- Duplicate search: show progress and prevent duplicate submission.
- Save operation: disable all mutation controls and preserve entered values.

## Empty States

- No guardian selected: show the required guardian action.
- No duplicate matches: show confirmation that registration may continue.
- No available branch policy: block submission and request administrator configuration.

## Error States

- `401`: session missing or expired; redirect to trusted login.
- `403`: permission or tenant context denied; do not retry automatically.
- `409`: duplicate number, existing relationship, or concurrency conflict.
- `422`: business validation or policy failure.
- `429`: rate limit; allow controlled retry.
- `5xx`: show correlation ID and preserve unsaved form data locally only for the current session.

Client error messages must not expose sensitive duplicate-match details or internal database information.

## Performance Budget

- Initial context and policy load: p95 ≤ 300 ms.
- Exact validation: p95 ≤ 300 ms.
- Duplicate detection: p95 ≤ 1.5 seconds.
- Successful registration command: p95 ≤ 800 ms.
- User-visible response after submit: ≤ 2 seconds at p99.
- Form must remain responsive during asynchronous duplicate detection.

## Accessibility Requirements

- Full keyboard navigation.
- Correct label and error association for every field.
- Visible focus indicators.
- WCAG 2.2 AA contrast targets.
- Errors announced through an accessible live region.
- No color-only status indication.
- Dialogs trap focus and return focus on close.
- Duplicate-review decisions are operable without a mouse.
- Loading and disabled states are announced to assistive technology.
