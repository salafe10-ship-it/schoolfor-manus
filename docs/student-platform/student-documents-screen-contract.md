# Student Documents Screen Contract

Mission: EWP-005

## Purpose

Provide an authorized school user with a clear, tenant-scoped inventory of a student's document metadata, lifecycle, verification state, classification, retention status, and current version. Binary storage and file transport are outside this screen.

## Actors and Permissions

- Student affairs staff: view and register metadata according to assigned scope.
- Document verifier: view, verify, reject, expire, and archive within authorized school/branch scope.
- School manager: view reports and approve governed lifecycle actions.
- Auditor: read document metadata and access history without mutation.

Required permission checks are centralized: `StudentDocument.View`, `StudentDocument.Create`, `StudentDocument.Verify`, `StudentDocument.Archive`, and `StudentDocument.AccessLog.View`. The client never supplies tenant, school, branch, actor, or audit identity.

## Workflow

1. Resolve trusted session and tenant context.
2. Load categories and the student's document metadata.
3. Filter by category, lifecycle, verification, classification, and retention state.
4. Open a metadata record and its immutable version timeline.
5. Register a new document or start a new version through the approved wizard.
6. Record every view and protected action in the access log.

## Validation Matrix

| Operation | Validation | Audit/event requirement |
| --- | --- | --- |
| List | Trusted student and tenant scope; bounded pagination | View access event |
| Open | Document belongs to the trusted student/school scope | View access event |
| Register | Category active; title/reference non-empty; classification valid | Create audit and domain event |
| Add version | Parent document active; positive revision; hash and file metadata present | Version audit and event |
| Verify | Pending or eligible lifecycle; verifier permission; approval reason | Verification audit and event |
| Archive | Retention/legal-hold rules; archive permission | Archive audit and event |
| Restore | Archived record eligible; restore permission; reason required | Restore audit and event |

## Screen States

- Loading: show scoped skeleton rows and disable mutation actions.
- Ready: show paginated metadata list and current-version indicator.
- Empty: explain that no document metadata exists and provide the authorized registration action.
- No permission: show a neutral forbidden state without revealing another student's records.
- Validation error: keep entered metadata and identify the field-level correction.
- Conflict: report stale version and require reload before retry.
- Server error: show a correlation reference and preserve retry-safe filters.

## Performance Budget

- Initial list p95 ≤ 300 ms after tenant context is ready.
- Filter changes p95 ≤ 300 ms.
- Version summary p95 ≤ 250 ms.
- Use server pagination; never load complete document histories by default.

## Accessibility Requirements

- Every filter and action has a programmatic label.
- Status and classification use text plus visual styling, never color alone.
- Keyboard order follows search, filters, results, then actions.
- Focus returns to the initiating row after dialogs close.
- Errors are announced through an accessible live region.
- Tables expose headers and row context to assistive technology.
