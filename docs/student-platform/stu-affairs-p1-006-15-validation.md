# STU-AFFAIRS-P1-006-15 — Discovery Validation

## 1. Validation scope

This validation covers repository evidence for Student Affairs reporting, print, preview, export, download, certificate, ID-card, timeline, and generic report paths. It is not a live staging or production certification.

## 2. Checks

| Check | Result | Evidence |
|---|---|---|
| Active Student Affairs portal inventory | PASS | `src/components/StudentAffairsPortal.tsx` active tabs, modal, export, and print handlers reviewed. |
| All `window.print` references in Student Affairs reviewed | PASS | Active list print and legacy `StudentTimeline.tsx` identified; no other Student Affairs print implementation proven. |
| XLSX export path traced end-to-end | PASS | Portal → repository → `/api/students/export` → canonical repository → XLSX service → audit. |
| Student-specific PDF path | NOT PROVEN | `generatePDFReport` exists as an unused local utility; no active Student Affairs import or server PDF route found. |
| Student ID-card artifact | NOT_IMPLEMENTED | Preview exists; official print button disabled and report tile is “قريبًا”. |
| Enrollment certificate artifact | NOT_IMPLEMENTED | Report tile is “قريبًا”; no route/service/artifact found. |
| Student transcript/academic report artifact | NOT PROVEN | No Student Affairs-specific route or active artifact pipeline found. |
| Student-linked financial report artifact | NOT PROVEN | No Student Affairs-specific route found; Finance reporting is separate. |
| Print-time authorization | FAIL for PRN-01 | Browser print handler has no dedicated permission check. |
| Print-time tenant validation | FAIL for PRN-01 | Handler serializes client page state and selected school label. |
| Print audit | NOT PROVEN for PRN-01/PRN-02 | No dedicated print event is emitted by the active print paths. |
| Sensitive-field profile | FAIL for PRN-01 | Guardian name and phone are placed into the browser print HTML. |
| False-success risk | PARTIAL | Print calls `window.print` but immediately reports “جاري إرسال...” without durable completion evidence. |
| Legacy/dead-code separation | PASS | Legacy timeline, toolbar, and local utilities have no active Student Affairs import evidence. |
| Database/RLS/production changes | PASS | No changes made or required by this discovery mission. |
| Code/build tests | NOT RUN | Discovery-only documentation; no source code changed. |

## 3. Security decision

Do not certify browser print as an official Student Affairs report. The current path can expose guardian contact data outside a server-approved artifact profile and does not provide dedicated print authorization, tenant validation at print time, or a durable audit event.

## 4. Performance decision

The canonical XLSX path has the existing 5,000-row synchronous bound documented by P1-006-03. Browser print has no server row bound or artifact performance budget beyond the current page size; this is insufficient for a governed report. No live p95 measurement was performed.

## 5. Required next mission boundary

The next mission, if approved, must be a Reporting/Print Contract and owner-decision mission. It must not begin implementation until artifact type, permission, field profile, trusted scope, audit, retention, and delivery are approved. Separate implementation missions should then cover only the approved artifact class.

## 6. Final status

`REPORTING/PRINT AUDIT COMPLETE`

The discovery is complete. The Student Affairs module is **not yet certified for official reporting/printing**. Canonical XLSX export is the only proven governed artifact path; all other listed report/print paths remain partial, legacy, or not implemented.

