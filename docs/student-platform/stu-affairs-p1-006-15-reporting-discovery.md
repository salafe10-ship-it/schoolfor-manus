# STU-AFFAIRS-P1-006-15 — Reporting & Print Gap Discovery

## 1. Mission boundary

This is a discovery-only audit of Student Affairs reporting, printing, preview, download, and certificate/card surfaces. No source code, API, database, SQL, RLS, permission, tenant, migration, staging, or production resource was modified.

## 2. Executive finding

Student Affairs has one proven canonical artifact path: the bounded server-generated XLSX export at `GET /api/students/export`. The active portal also exposes a browser print action for the current student page, but that action is not an official governed report: it renders client-held rows, includes guardian phone data, has no dedicated report permission or report audit event, and emits an immediate informational notification rather than a durable report result.

Official student ID cards and enrollment certificates are visibly marked unavailable. A legacy timeline print component and generic report utilities exist but are not connected to the active Student Affairs portal. No Student Affairs-specific certificate, ID-card, transcript, or academic/financial report artifact was proven.

## 3. Evidence inventory

| Surface | Evidence | Source | Classification |
|---|---|---|---|
| Student list XLSX | `StudentRepository.exportStudents` calls `/api/students/export`; server generates XLSX | `src/components/StudentAffairsPortal.tsx:557-590`, `src/components/student-affairs/repository/StudentRepository.ts:181-202`, `server.ts:828-852`, `src/modules/student-export/application/StudentExportService.ts:33-100` | CANONICAL |
| Student list print | `handlePrintList` opens a window, serializes `filteredStudents`, calls `window.print()` | `src/components/StudentAffairsPortal.tsx:594-662` | PARTIAL |
| Reports tab list print | Reports card calls the same `handlePrintList` | `src/components/StudentAffairsPortal.tsx:1326-1341` | PARTIAL |
| Student timeline print | Separate component calls `window.print()` on the current page | `src/components/student-affairs/StudentTimeline.tsx:29-48` | LEGACY |
| Active student timeline | Active portal loads `/api/students/:id/timeline`; no print/download action is exposed in the active modal | `src/components/StudentAffairsPortal.tsx:246-276`, `src/components/StudentAffairsPortal.tsx:1728-1768` | CANONICAL READ / NO ARTIFACT |
| ID card preview | Profile modal displays a card-like preview; official print button is disabled | `src/components/StudentAffairsPortal.tsx:1675-1787` | NOT_IMPLEMENTED |
| ID card reports tile | Reports tab labels school ID cards “قريبًا” and provides no action | `src/components/StudentAffairsPortal.tsx:1343-1350` | NOT_IMPLEMENTED |
| Enrollment certificate | Reports tab labels certificates “قريبًا” and provides no action | `src/components/StudentAffairsPortal.tsx:1352-1359` | NOT_IMPLEMENTED |
| Generic report service | Marks an execution completed and audits it, but has no Student Affairs route/artifact pipeline; `saveExecution` is empty | `src/database/services/ReportService.ts:16-41`, `src/database/repositories/ReportRepository.ts:24-26` | NOT_IMPLEMENTED |
| Local PDF/Excel utilities | Client-side `jsPDF`/XLSX writers exist; no active Student Affairs import was found | `src/utils/ExportUtils.ts:8-58` | LEGACY |
| Legacy toolbar | Includes print, PDF, Excel, import, and template callbacks; no active import from Student Affairs portal was found | `src/components/student-affairs/StudentAffairsHeader.tsx:5-93` | LEGACY |

## 4. Required conclusion

`REPORTING/PRINT AUDIT COMPLETE`

The active Student Affairs reporting surface is not fully enterprise-certified. The canonical XLSX export is the only artifact that currently demonstrates a server-owned source, bounded query, dedicated permission, trusted tenant context, sensitive-field projection, and export audit events. Browser print, official reports, cards, certificates, and generic report execution require separate approved contracts before implementation.

## 5. Scope and security observations

- The active student list requests a compatibility `schoolId` hint, while the server is documented as deriving trusted scope from the session. The print handler does not independently resolve or validate tenant scope.
- The browser print payload includes `parentPhone` and `parentName` from `filteredStudents` (`StudentAffairsPortal.tsx:601-608`). This is unsuitable for an official artifact without an approved field profile.
- The print handler uses `selectedSchool.name` and browser time to label the document. Those values are not evidence of a server-issued report identity, approval, request/correlation ID, or durable audit record.
- `Student.Export` is proven for XLSX only. No `Student.Print`, `Student.Report.View`, `Student.Certificate.Issue`, or `Student.IdCard.Issue` enforcement was proven for the other surfaces.
- No real PDF artifact, signed certificate, QR identity artifact, transcript, or student-specific financial/academic report was demonstrated in the active route inventory.

## 6. Commercial and operational impact

Customers can see the print card and expect an official school document. A browser printout can look official while lacking a durable report number, field governance, authorization event, or server-certified scope. This creates trust, privacy, and operational risk even though the XLSX export path is materially stronger.

## 7. Stop condition

Do not implement printing, certificates, ID cards, transcripts, or generic report execution from this discovery. A separate approved Reporting/Print Contract must define artifact identity, data source, permissions, tenant scope, sensitive-field profiles, audit, retention, delivery, and live staging evidence.

