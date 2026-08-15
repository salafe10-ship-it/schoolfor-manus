# STU-AFFAIRS-P1-003-06 — Independent Student Affairs Discovery

## Scope

Discovery only for Student Affairs paths that do not require Student Import or Batch Transfer implementation:

- export and print;
- notification-only actions;
- contact/SMS/card actions;
- visible buttons and screen states;
- permissions attached to those functions;
- canonical, legacy, dead-code, not-implemented, notification-only, and dependency-blocked classification.

No source file, database, migration, RLS, SQL, UnitOfWork, TenantEngine, AuthorizationEngine, Import, Transfer, or production environment was modified.

## Executive Findings

1. The active Student Affairs portal exports a client-generated CSV while labeling it Excel. It exports only the currently loaded server page, has no dedicated server-side export permission check, and has no server audit event for the export.
2. The active list print path opens a browser print window from client-held rows. It is a presentation action, not a server-certified report/export workflow, and is limited to the currently loaded page.
3. The active student-card print button only shows a success notification and closes the profile modal. It does not call `window.print`, a print service, or an API. This is `NOTIFICATION_ONLY` and a false-success defect.
4. Guardian linking, direct calling, and messaging buttons explicitly display warnings that the required API/provider is not enabled. They are `NOTIFICATION_ONLY` / `NOT_IMPLEMENTED`.
5. Excel import is explicitly unavailable and correctly fails closed in the active UI. The generic `/api/students/bulk` route exists but is not a safe canonical import path and remains outside this mission.
6. Batch transfer is visibly disabled and reports that atomic/idempotent approval is pending. It remains dependency-blocked by the approved transfer/operations decisions.
7. Stage and grade filters are disabled in the active canonical portal because their source is not proven. This is correct fail-closed behavior but leaves the function incomplete.
8. `StudentAffairsHeader`, `StudentSearchPanel`, `StudentTimeline`, and several older Student Affairs child components have no active import from the current portal path. They are dead-code candidates or legacy alternate UI, not evidence of active production functionality.
9. The permission registry has Student.View, Student.Write, and Student.Delete, but no canonical `Student.Export` or `Student.Print` entries. Client-local export/print therefore lacks an explicit server authorization contract.

## Active Path Classification

| Capability | Evidence | Classification | Customer-visible result |
|---|---|---|---|
| Student list read | `GET /api/students`, trusted auth/permission/tenant path | CANONICAL | Active, server-authoritative page read |
| Student create/update | `POST /api/students`, canonical registration/update routing | CANONICAL | Active, subject to workflow constraints |
| Guardian canonical update | `PATCH /api/students/:studentId/guardian` | CANONICAL | Active, approved earlier |
| Student document metadata | `/api/student-documents*` and `StudentDocumentsPortal` | CANONICAL | Active metadata workflow; no binary storage |
| List CSV/“Excel” export | `StudentAffairsPortal.handleExportExcel` | LEGACY / INCOMPLETE | Downloads local CSV for current page but claims Excel |
| List print | `StudentAffairsPortal.handlePrintList` | LEGACY / INCOMPLETE | Browser print of current page; no server report contract |
| Student ID card print | profile modal callback only calls notification | NOTIFICATION ONLY | Claims success without printing |
| Guardian link button | explicit “API not enabled” warning | NOT_IMPLEMENTED / NOTIFICATION ONLY | No business operation |
| Guardian call button | explicit provider-not-linked warning | NOTIFICATION ONLY | No call integration |
| Guardian message button | explicit SMS-provider warning | NOTIFICATION ONLY | No message integration |
| Excel import modal | explicit unavailable state; no file accepted | NOT_IMPLEMENTED / BLOCKED BY DEPENDENCY | Safely refuses import |
| Generic bulk route | `POST /api/students/bulk` | BLOCKED BY DEPENDENCY | Not approved as canonical import |
| Batch transfer | disabled button and fail-closed handler | BLOCKED BY DEPENDENCY | No mutation occurs |
| Stage filter | disabled; canonical source not proven | BLOCKED BY DEPENDENCY | User cannot filter by stage |
| Grade filter | disabled; canonical source not proven | BLOCKED BY DEPENDENCY | User cannot filter by grade |
| Legacy search panel bulk delete | direct per-student `Promise.all` path | LEGACY / UNSAFE IF ACTIVATED | Not part of active canonical portal |

## Screen State Review

| Screen/function | Loading | Empty | Error | Classification |
|---|---|---|---|---|
| Main student list | `isLoadingStudents` and request cancellation exist | “No records” / current-page state | load error notification and visible error state | CANONICAL, with export scope limitation |
| Main filters | server request for supported fields; stage/grade disabled | no matching records | request error notification | CANONICAL / dependency-limited |
| Guardian tab | immediate local projection from loaded students | no confirmed guardian links message | no provider/API error path because actions are not implemented | LEGACY / NOTIFICATION ONLY |
| Reports tab | no report-generation state | two cards marked “coming soon” | print popup warning only | MIXED |
| Documents tab | busy spinner and request error state | no documents message | visible error alert | CANONICAL metadata path |
| Import modal | no upload state because unavailable | explicit unavailable message | none; fail-closed notice | BLOCKED BY DEPENDENCY |
| Transfer modal | no processing state; submit disabled | selected target form can be displayed | explicit unavailable warning | BLOCKED BY DEPENDENCY |
| Student profile/card modal | no print progress state | missing field placeholders | no print error because no print action exists | NOTIFICATION ONLY for card print |

## Security and Authorization Findings

- Active student list uses `Student.View`; create/update uses `Student.Write`; delete uses `Student.Delete`.
- The active client export and print handlers do not call a server endpoint with a dedicated export/print permission and do not emit a server audit event.
- `PermissionRegistry` contains no canonical `Student.Export` or `Student.Print` entries. A legacy authorization model contains export/print concepts, but the active server route does not establish a certified report contract from them.
- Guardian contact/SMS actions have no permission-backed API because no operation is executed.
- The documents portal uses dedicated document permissions and trusted tenant middleware; it is a separate canonical path and should not be conflated with the legacy local tabs.
- No live RLS or production permission certification was performed in this discovery mission.

## Customer and Commercial Impact

- A user who clicks “print official card” can receive a success message without a printed artifact; this directly damages trust.
- “Excel export” producing CSV can confuse downstream office workflows and may be rejected by customer expectations.
- Exporting only the current page can silently omit students when a customer expects the full filtered list.
- Disabled/coming-soon cards are honest but reduce perceived completeness; they should remain clearly labeled until an approved backend contract exists.

## Safe Next Decisions

1. Approve a server-certified Student export/report contract with explicit permission, tenant scope, audit, data classification, and full-filter pagination semantics.
2. Approve a print/card contract before enabling the profile card action.
3. Keep guardian call/SMS disabled until provider, consent, audit, and permission contracts exist.
4. Keep import and batch transfer blocked under their existing approved gates.
5. Decide whether unused legacy components will be retired in a separate cleanup mission; do not delete them in this discovery.

## Mission Status

**STU-AFFAIRS-P1-003-06 = DISCOVERY COMPLETE — READY FOR CTO REVIEW.**

