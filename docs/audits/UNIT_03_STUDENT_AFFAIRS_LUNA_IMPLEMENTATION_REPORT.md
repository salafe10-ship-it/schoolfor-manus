# UNIT 03 — Student Affairs — LUNA 5.6 Implementation Report

الحالة: `LUNA IMPLEMENTED / TARGETED TEST PASS / SOL FINAL REVIEW BLOCKED FOR FULL UAT`

## Implemented fixes

| SOL finding | LUNA result | Evidence |
|---|---|---|
| STU-SOL-001 | `FIXED` | Dashboard quick actions now use server-derived permission hints; missing hints fail closed for tenant modules. |
| STU-SOL-002 | `FIXED` | `App` renders the access-denied surface before mounting Student Affairs when `Student.View` is absent. |
| STU-SOL-003 | `FIXED` | Shared student hydration runs only for active Student Affairs with a trusted token and `Student.View`. |
| STU-SOL-005 | `PRESERVED` | Server `authenticateRequest` + `requirePermissionOnly(Student.View)` and tenant/RLS controls were not weakened. |
| STU-SOL-006 | `FIXED` | Batch delete now calls `StudentRepository.softDeleteStudent` per selected ID, checks each result, removes only confirmed successes, and reports partial failure. |
| STU-SOL-007 | `FIXED` | Student.Write/Delete/Export hints now gate the relevant Student Affairs controls and handlers; server authorization remains the final authority. |
| STU-SOL-008 | `FIXED` | Guardian-required validation is limited to new registrations; edits to existing students no longer require unrelated guardian fields. |
| STU-SOL-009 | `FIXED` | Existing birth dates are normalized to `YYYY-MM-DD` before the edit request. |
| STU-SOL-010 | `IMPLEMENTED / RUNTIME RETEST REQUIRED` | Removed the legacy `AuditRepository.create` fallback call from the XLSX generation service. The export route now writes the canonical `public.audit_events` row in its PostgreSQL transaction after successful generation, and failure-audit errors cannot crash the process. |
| STU-SOL-011 | `FIXED / RUNTIME RETEST REQUIRED` | Added the missing canonical registration-status select to the Add Student form. A Browser attempt with a new non-sensitive test row could not complete because the browser harness changed the native date DOM value without updating the controlled React state; no create request or record was claimed. |
| STU-SOL-012 | `FIXED / LIVE UAT PASS` | Replaced the unreliable Supabase count metrics path with a tenant-scoped canonical PostgreSQL metrics query covering students and active documents. Visible UAT showed 10 total, 10 active, 10 new, 0 suspended/withdrawn, and 10 pending documents; the false zero/empty state disappeared. |
| STU-SOL-013 | `FIXED / LIVE UAT PASS` | Student Affairs pagination/empty-state text now uses the current server query metadata. Searching `TEST-UI-03` visibly showed `عرض 1 إلى 1 من إجمالي 1 طالب`, and after reload the baseline showed 10 of 10. |
| STU-SOL-014 | `FIXED / LIVE UAT PASS` | Replaced the unobservable popup print path with an in-module visible preview. Browser UAT showed the 10-row preview, student number/name/status, and no guardian phone or national ID; the preview exposes the print command. |
| STU-SOL-015 | `IMPLEMENTED / REGRESSION PASS / LIVE UAT PENDING` | New registrations now use `/api/student-registration` with `Student.Registration.Create`, a stable client idempotency key, and server-side normalization through `toCanonicalRegistrationCommand`; edits remain on the separate update path. |

## Verification

- Targeted Student Affairs/permission/session/registration regression: `PASS — 5 files / 18 tests` for the latest registration boundary slice; the broader prior regression remains recorded below.
- TypeScript: `PASS — npm run lint`.
- SPA build: `PASS — npm run build:spa`.
- Server bundle: `PASS via direct esbuild invocation`; existing six `import.meta`/CommonJS warnings remain.
- Browser UAT: authorized `Student.View` session visibly completed Dashboard → Student Affairs → canonical read; after the latest rebuild/restart, the unit displayed 10 rows and consistent metrics.
- Browser dev logs: no new `Shared student hydration failed` entry after the repaired reload.
- Live Student Affairs read/edit UAT previously passed for `TEST-UI-01`: the edit persisted in PostgreSQL (version advanced), survived browser reload, and was restored to the original value.
- A real export click exposed STU-SOL-010: the UI remained in `جاري التصدير...` and the legacy audit fallback raised a canonical-persistence error. After the fix, a visible click reported successful XLSX generation and canonical `audit_events` aggregation confirmed two successful entries.
- Latest export contract tests after the fix: `PASS — 2 files / 8 tests` using Vitest `--configLoader runner`.
- Latest full targeted regression after the export fix: `PASS — 12 files / 53 tests`; TypeScript lint remained `PASS` after adding the registration-status field.
- API method/status trace: route success was observed through the live UI and server logs; no secret-bearing values were inspected. Print acceptance is represented by the visible in-module preview; the operating-system print dialog is not used as the sole evidence.

## Runtime boundary

The authorized UAT account is currently active again and the following are now evidenced after the latest rebuild/restart:

- reopening the authorized Student Affairs portal;
- canonical read showing 10 rows and consistent metrics;
- search result count of 1 and baseline reload count of 10;
- final reload and persistence sweep after the server restart.

Still not accepted for closure:

- Add → reload → Delete → reload for a disposable student; the canonical route fix is implemented, but the live mutation/persistence cycle has not yet been executed.

This remains `🔴 RUNTIME UAT BLOCKED` only for the final mutation gate, not because of missing authorization. The authorized `Student.View` UAT account is active; the remaining evidence is the visible Add → PostgreSQL → Reload → confirmed Delete → Reload cycle.

## Checkpoint

No Git commit was created because the worktree contains unrelated user changes. Source changes are saved in the worktree, the server bundle was rebuilt, and the implementation/evidence are recorded in the SOL plan, this report, and the closure ledger.
