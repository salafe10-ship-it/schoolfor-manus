# STU-AFFAIRS-P1-006-02 — Student Export Discovery

## Scope and decision boundary

This document is discovery only. It records the current Student Affairs export behavior and the contract decisions required before implementation. No export endpoint, permission, database object, audit writer, or UI behavior was changed.

The current action is labeled **تصدير Excel**, but the implementation is a browser-generated CSV data URI. It must not be treated as an enterprise Excel export or an official report.

## Evidence reviewed

| Area | Evidence | Finding |
| --- | --- | --- |
| Active UI action | `src/components/StudentAffairsPortal.tsx` (`handleExportExcel`) | Builds a CSV string in the browser, creates an anchor, clicks it, then emits a success notification. |
| Export source | `StudentAffairsPortal.tsx` (`filteredStudents`) | Uses the current server-loaded page only; after P1-003-04A this is not the complete matching result set. |
| Export fields | `StudentAffairsPortal.tsx` | Student number, name, national ID, classroom, section, guardian name, guardian phone, status. |
| File type | `StudentAffairsPortal.tsx` | Filename ends in `.csv`; no XLSX generation exists. |
| Server API | `server.ts` | No Student Export endpoint was found. Student list is a read endpoint only. |
| Authorization | `src/authorization/PermissionRegistry.ts` | Canonical `Student.Export` is not present in `PERMISSIONS`; legacy text contains `student:export`, but no active export route uses it. |
| Audit | Active export handler | No server audit event or trusted request context is created by the export action. |
| Tenant scope | Active export handler | It inherits the rows already loaded by the grid; there is no dedicated server export scope proof. |
| Encoding | Active export handler | Uses `encodeURI` and `charset=utf-8`; no explicit BOM, CSV escaping policy, formula-injection policy, or server artifact validation is defined. |

## Current behavior classification

`StudentAffairsPortal.handleExportExcel` is **page-only client CSV**, not a complete export. The success notification is technically true only for creation of a local browser download, but the label and product semantics overstate the result as Excel and do not disclose that pagination limits the records.

## Risks discovered

1. A user can export only the currently loaded page while believing all filtered students were exported.
2. The UI calls the file Excel although the artifact is CSV.
3. The export is not independently authorized as an export action.
4. The export is not server-audited with trusted identity, tenant, filters, row count, or result.
5. Client-side CSV generation has no formal escaping policy for commas, quotes, line breaks, leading formula characters, or Arabic spreadsheet compatibility.
6. Guardian name and phone are included without a documented data-minimization decision or classification rule for exports.
7. There is no server-side maximum row count, timeout policy, artifact lifecycle, or failure contract.
8. The current implementation has no deterministic export request ID/correlation ID visible to operations.

## Explicit non-findings

- No export database mutation was performed.
- No API or migration was added.
- No permission was added.
- No RLS or tenant policy was changed.
- No official report or print contract was implemented.

## Discovery conclusion

The export action requires a separate approved contract before implementation. The safest enterprise direction is a server-generated, tenant-scoped data export with an explicit artifact type, dedicated permission, audit event, bounded result size, and a truthful UI label. The decision between CSV and real XLSX, page scope and all-results scope, and the treatment of sensitive guardian fields remains a product/security decision.

