# Document Verification Screen Contract

Mission: EWP-005

## Purpose

Allow an authorized verifier to process a bounded queue of student document metadata, record a verification outcome, and preserve a complete access trail without modifying immutable versions or exposing binary content.

## Actors and Permissions

- Document verifier: inspect metadata and approve or reject.
- School manager: review exceptions and archive eligible records.
- Auditor: read-only access to decisions and access history.

Required permissions: `StudentDocument.Verify`, `StudentDocument.View`, `StudentDocument.AccessLog.View`, and `StudentDocument.Archive` for archive actions.

## Workflow

1. Resolve trusted session, tenant, school, branch, and academic context.
2. Load a paginated verification queue.
3. Open one document metadata record and its current version summary.
4. Review classification, retention, legal hold, version, and prior decisions.
5. Approve or reject with a mandatory reason where required.
6. Commit status, approval metadata, audit event, access event, and outbox event atomically.
7. Refresh the queue using the returned version token.

## Decision Rules

| Action | Required condition |
| --- | --- |
| Verify | Authorized verifier, eligible lifecycle, current version exists, no stale version. |
| Reject | Authorized verifier and non-empty reason code. |
| Expire | Retention/expiry condition met and no legal hold. |
| Archive | Archive eligible, no legal hold, authorized archive permission. |
| Restore | Authorized restore permission and documented reason. |
| Reopen | Explicit correction workflow; never mutate an immutable version. |

## Screen States

- Loading queue: show bounded skeleton rows.
- Ready queue: show status, category, classification, current version, and retention indicators.
- Empty queue: state that no records are awaiting verification.
- Legal hold: show a clear non-destructive hold indicator and disable archive.
- Stale record: require reload and preserve no untrusted decision.
- Forbidden: return 403 semantics without cross-tenant disclosure.
- Mutation failure: show correlation ID; no optimistic status change is treated as committed.
- Success: announce the decision and move focus to the next queue item.

## Performance Budget

- Verification queue p95 ≤ 300 ms.
- Decision command p95 ≤ 800 ms.
- Access history p95 ≤ 500 ms.
- Queue pagination is mandatory; no unbounded fetch.

## Accessibility Requirements

- Queue is navigable as a semantic table/list with stable row labels.
- Decision buttons have explicit action names and confirmation text.
- Reason errors are announced and focus is moved to the first invalid field.
- Legal hold and classification are communicated in text, not color alone.
- Keyboard focus remains visible and returns to the next record after success.
- Screen-reader users receive status changes through an accessible live region.
