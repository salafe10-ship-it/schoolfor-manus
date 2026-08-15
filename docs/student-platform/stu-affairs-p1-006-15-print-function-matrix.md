# STU-AFFAIRS-P1-006-15 — Print and Reporting Function Matrix

## Classification key

- **CANONICAL** — server-owned, bounded, permissioned, tenant-scoped artifact path proven in code.
- **PARTIAL** — user-visible function exists, but official artifact/security/audit requirements are incomplete.
- **LEGACY** — source exists but is not connected to the active Student Affairs portal.
- **NOT_IMPLEMENTED** — visible placeholder or no executable artifact path.
- **NOTIFICATION_ONLY** — feedback exists without a durable operation/artifact.
- **FALSE_SUCCESS** — success is claimed despite no proven artifact or durable result.

## Function matrix

| ID | Function | Active? | Data source | Server/browser | Artifact | Permission | Tenant/school/branch scope | Audit | Sensitive data | States | Classification |
|---|---|---:|---|---|---|---|---|---|---|---|---|
| REP-01 | Student list XLSX export | Yes | Canonical student read repository with server filters | Server query + browser download | Real XLSX, max 5,000 rows | `Student.Export` | Trusted server tenant context; client does not select authority scope | Accepted, successful, rejected, failed export events | Operational projection excludes national ID and guardian phone | Busy, failure, empty, overflow handled | CANONICAL |
| PRN-01 | Student list print | Yes | `filteredStudents` page array | Browser `window.open` + `window.print` | Browser print page only | No dedicated print permission proven; outer visibility is role-based | Derived from current UI state and `selectedSchool`; no print-time server validation | No dedicated print audit event proven | Includes guardian name and phone | Popup blocked warning; otherwise immediate “جاري” notification; completion not observed | PARTIAL |
| REP-02 | Reports-tab class list print | Yes | Same `handlePrintList` page array | Browser | Browser print page only | Same as PRN-01 | Same as PRN-01 | Same as PRN-01 | Same as PRN-01 | Same as PRN-01 | PARTIAL |
| PRN-02 | Active student timeline view | Yes | `/api/students/:id/timeline` | Server read + browser render | No print/download artifact | Endpoint authentication is present; no report permission proven | Endpoint is expected to enforce trusted session scope; live evidence not part of this mission | Read audit not established as a print audit | Event descriptions/user labels may be sensitive | Loading, error, empty, success states present | CANONICAL READ / NO ARTIFACT |
| PRN-03 | Legacy timeline print | No active import found | Caller-provided `events` prop | Browser `window.print` | Current page print only | None in component | None in component | None | Caller-provided event data | No durable operation state | LEGACY |
| REP-03 | Student profile / ID card preview | Yes, preview only | Current `viewStudent` object | Browser render | No issued artifact | No card-issue permission proven | Uses current selected school/UI object | No card issuance audit | Shows national ID and guardian phone in preview | Close only; official print disabled | NOT_IMPLEMENTED |
| REP-04 | School ID card report tile | Visible, disabled | None | None | None | None | None | None | None | “قريبًا” | NOT_IMPLEMENTED |
| REP-05 | Enrollment certificate | Visible, disabled | None | None | None | None | None | None | None | “قريبًا” | NOT_IMPLEMENTED |
| REP-06 | Student transcript / academic report | No Student Affairs artifact route proven | No proven canonical report query | None proven | None proven | None proven | None proven | None proven | Unknown; no field profile | Not available | NOT_IMPLEMENTED |
| REP-07 | Student-linked financial report | No Student Affairs route proven | Finance/reporting surfaces are separate | None proven in Student Affairs | None proven | None proven | None proven | None proven | Unknown | Not available | NOT_IMPLEMENTED |
| REP-08 | Generic `ReportService.runReport` | Not connected to Student Affairs | Report definition/fallback repository | Server-shaped service, but no artifact generator | Execution object only; `saveExecution` empty | No Student Affairs permission boundary proven | Report definition carries school ID; trusted tenant flow not proven | Generic audit call exists | Unknown | Always constructs `status: completed` | NOT_IMPLEMENTED |
| REP-09 | Local PDF/Excel utility | No active Student Affairs import found | Caller-provided arrays | Browser/client | Local file generated | None in utility | None in utility | None in utility | Caller controls all fields | No server failure/empty/authorization state | LEGACY |
| REP-10 | Legacy Student Affairs toolbar print/PDF/import/template | No active import found | Callback contract only | Browser/callback dependent | Not proven | Role gate only in component | No tenant enforcement in component | None in component | Unknown | No canonical result state | LEGACY |

## Button/action review

| Action visible in active Student Affairs | Result |
|---|---|
| `تصدير XLSX` | Canonical server artifact path; separately proven by P1-006-03 implementation tests, live staging still required. |
| `طباعة` / `كشوفات أسماء الطلاب بالصفوف` | Browser page print; not an official governed report. |
| `بطاقات الهوية المدرسية` | Disabled “قريبًا”; no artifact. |
| `شهادات القيد` | Disabled “قريبًا”; no artifact. |
| Profile `طباعة البطاقة الرسمية` | Disabled explicitly until a printing service is approved. |
| Active timeline `عرض الخط الزمني` | Server read/render only; no print action. |
| Legacy timeline `طباعة السجل` | Not connected to active portal; browser print only. |

## Required owner decisions before implementation

1. Approve whether student list print is an official report or an explicitly labeled local convenience print.
2. Approve separate permissions and field profiles for print, ID cards, certificates, transcripts, and financial reports.
3. Approve server artifact identity, request/correlation IDs, retention, delivery, and audit events.
4. Approve a canonical data source for each artifact and prohibit browser-array serialization for official output.

