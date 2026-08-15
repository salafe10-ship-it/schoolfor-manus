# STU-AFFAIRS-P1-006-39 — Student Affairs Remaining Contract Gap Inventory

## Scope and decision boundary

This is a discovery-only inventory for the approved surfaces: Student Create, Student Edit, Guardian Update, Student Timeline, Student Document metadata, Student Export, Student List/Profile UI, Lifecycle UI containment, and current Reporting/Print behavior.

The audit does not reopen the ISO/birth-country decision, canonical Student Read work, lifecycle/bulk containment, or any SQL/RLS/migration/staging/production work.

## Finding SA-P1-006-39-01 — Student timeline reads a legacy audit source

- **Severity:** P1 — broken user-visible functionality and traceability drift.
- **Surface:** Student Timeline.
- **Current behavior:** `GET /api/students/:id/timeline` calls `AuditRepository.getAll(schoolId)` and filters the returned legacy `AuditLog` objects by `affectedRecord` or by searching the free-text `details` field for the student ID.
- **Canonical behavior required:** The timeline must read the canonical append-only `public.audit_events` stream for `entity_type = 'student'` and `entity_id = :studentId`, scoped by the trusted tenant/school/branch context, then map structured fields to timeline events.
- **Evidence:** `server.ts:1312-1321` uses `AuditRepository.getAll` and free-text filtering. `src/database/repositories/AuditRepository.ts` reads `audit_logs`. `src/database/repositories/CanonicalStudentWriteRepository.ts:105-123` writes Student audit events to `public.audit_events` with structured `entity_type` and `entity_id`.
- **User impact:** A successful canonical Student create, update, lifecycle, or related operation can produce no timeline event or an incomplete timeline. The profile may therefore appear unchanged even though the operation succeeded.
- **Data integrity impact:** No mutation or cross-tenant exposure was proven by this discovery. The defect is a canonical persistence/read mismatch that weakens traceability and historical completeness.
- **Security impact:** The route still requires authentication, `STUDENT_READ`, and `resolveStudentTenantMiddleware`. No direct cross-tenant disclosure was proven. The legacy free-text matching is nevertheless imprecise and should not remain the canonical selection rule.
- **False-success risk:** The endpoint can return HTTP success with an empty `data` array when canonical events exist in `audit_events` but are absent from `audit_logs`.
- **Dependencies:** Canonical audit-event read contract, trusted tenant context, and a bounded timeline mapping decision. No ISO reference decision is required.
- **Safe bounded fix?:** Yes, as a separate order limited to the Student Timeline reader and its tests. Do not redesign the audit framework in that order.
- **Approval required?:** Owner/security review of the canonical event projection is recommended before implementation because the timeline exposes audit-derived history.
- **Recommended next order:** `STU-AFFAIRS-P1-006-40 — CANONICAL STUDENT TIMELINE SOURCE FIX`.

## Finding SA-P2-006-39-01 — Print is a client snapshot, not an authoritative report

- **Severity:** P2 — reporting/operational quality gap.
- **Surface:** Student Affairs list and Reports tab print actions.
- **Current behavior:** `StudentAffairsPortal.tsx:625-692` builds HTML in the browser from the currently loaded `filteredStudents` page and calls `window.print()`.
- **Canonical behavior required:** An official print report should be generated from a server-authoritative, tenant-scoped query using the active filters, with a bounded result contract and an auditable report request.
- **Evidence:** `src/components/StudentAffairsPortal.tsx:625-642` constructs rows from the current client page; `:644-690` writes a browser document and invokes `window.print()`. The XLSX export is a separate server-side flow at `:600-615` and is not part of this finding.
- **User impact:** Users may print only the currently loaded page rather than the complete filtered result set and may mistake the snapshot for an official complete report.
- **Data integrity impact:** No database mutation is performed.
- **Security impact:** No new cross-tenant path was proven in this discovery. The print path should still be reviewed against the report permission and privacy policy before being called official.
- **False-success risk:** The print dialog can succeed while silently omitting rows outside the current client page.
- **Dependencies:** Reporting/print ownership, expected pagination semantics, and report permission/audit policy.
- **Safe bounded fix?:** Yes, but it is lower priority than the timeline source mismatch.
- **Approval required?:** Product/Operations approval is recommended for the meaning of an official printed list.
- **Recommended next order:** Defer until the P1 timeline source fix is accepted, then issue a bounded print-report contract and implementation order.

## Surfaces with no new material gap proven in this pass

- Student Create: canonical request/response path and explicit response checking were found; no new P0 false-success finding was proven.
- Student Edit: canonical response checking and the previously closed profile truthfulness/persistence parity work were not reopened.
- Guardian Update: response failure is checked by the repository; no new material gap was proven.
- Student Document metadata: protected tenant-scoped routes and idempotent metadata/version operations are present; no new material gap was proven.
- Student Export: server-side, bounded, tenant-scoped, permission-gated, and audit-recorded flow is present.
- Student List/Profile UI: server-authoritative list aliases and explicit loading/error states are present; no new P0 was proven.
- Lifecycle UI containment: existing bounded lifecycle work was not reopened.

## Final discovery decision

**NEXT BOUNDED FIX IDENTIFIED** — SA-P1-006-39-01 is a new P1 contract gap suitable for a separate bounded implementation order. SA-P2-006-39-01 remains deferred. No P0 finding was proven.
