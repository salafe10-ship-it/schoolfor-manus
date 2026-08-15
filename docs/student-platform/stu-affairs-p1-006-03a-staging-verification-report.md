# STU-AFFAIRS-P1-006-03A — STAGING VERIFICATION REPORT

## Final status

`BLOCKED / STUDENT READ EVIDENCE PENDING`

The Staging service became reachable, but the deployed application did not provide enough evidence to certify the Student Export implementation. No code, database, migration, RLS, RPC, or production resource was modified during this verification.

## Environment

- Environment: Render Staging
- URL: `https://edupro-school-erp-staging.onrender.com/`
- Initial state: Render application-loading screen while the service woke up.
- Final state: Application became reachable after a reload and startup wait.
- Visible school context: `PERF003 Test School`
- Visible tenant scope: isolated environment indicator `بيئة معزولة ✅`
- Visible branch selector: `كل فروع المدرسة`
- Visible academic year: `2026/2027`
- Visible account label: `مدير النظام (Admin)` / `سليمان بن غازي` / reference `P003`
- Render deployment branch: `codex/sop-001-staging`.
- Render latest listed deployment commit before the reviewed deployment: `2a909d1b86d35853bfbe98198701f775bee2cdf2`.
- Render deployment label before the reviewed deployment: `Complete canonical Student Affairs persistence`.
- Render listed deployment time before the reviewed deployment: August 11, 2026 at 4:20:48 PM GMT+2.

## Render deployment

The service was reachable after startup. The first page was a central administration dashboard. The reviewed isolated commit was then pushed to the Staging branch and Render reported:

- Commit: `a9eb89e21d8d42729cdea5a0f93d1f1b746928ba`.
- Branch: `codex/sop-001-staging`.
- Deployment ID: `dep-d9u3t1jbc2fs739qqj50`.
- Status: `Deploy succeeded`.
- Duration: `1m11s`.

After the successful deployment, an already-open browser tab retained the old shell and requested the stale chunk:

`Uncaught TypeError: Failed to fetch dynamically imported module: https://edupro-school-erp-staging.onrender.com/assets/StudentAffairsPortal-ByivSqi3.js`

That stale-tab failure was reproduced as a cache/version mismatch. A fresh Staging tab opened with `?release=a9eb89e` loaded the new index asset, rendered Student Affairs with the reviewed `تصدير XLSX` control, and produced no dynamic-import error. The reviewed deployment therefore passed the runtime chunk-load check in a fresh session.

The remaining live blocker is independent: the fresh Student Affairs screen still displayed `فشل جلب بيانات الطلاب من الخادم` and zero records. Student Read evidence is therefore still unavailable, so the export matrix must remain uncertified.

Before the new deployment, the UI showed `تصدير Excel` and `فشل جلب بيانات الطلاب من الخادم`; those observations are retained as pre-deployment evidence only.

## Student Export verification

| Check | Result | Evidence |
|---|---|---|
| Student Affairs screen reachable after reviewed deployment | PASS | Fresh tab with `?release=a9eb89e` rendered the Student Affairs screen. |
| Export control visible | PASS | Reviewed control `تصدير XLSX` rendered in the fresh tab. |
| Student Read path | BLOCKED | Fresh screen displayed `فشل جلب بيانات الطلاب من الخادم` and zero records. |
| True XLSX download | NOT VERIFIED | Clicking the control produced no browser download event. |
| All matching results, not current page | NOT VERIFIED | Student query failed and returned zero visible records. |
| Empty result behavior | NOT VERIFIED | The screen showed a data-fetch failure, not the P1-006-03 export contract result. |
| 5,000-row behavior | NOT VERIFIED | No live dataset was available. |
| More-than-5,000 rejection | NOT VERIFIED | No live dataset was available. |
| Sensitive-field exclusion | NOT VERIFIED | No XLSX artifact was produced for inspection. |
| Search/filter/sort parity | NOT VERIFIED | Student data retrieval failed before comparison. |
| `Student.Export` vs `Student.View` | NOT VERIFIED | No controlled permission fixture was available in the live session. |
| Missing/invalid tenant context | NOT VERIFIED | No safe live fixture was available; no spoofing attempt was made. |
| Audit accepted/rejected/failed/successful | NOT VERIFIED | No live audit record surface was available and no database inspection was performed. |
| False-success behavior | PARTIAL | No success notification or download was observed after the click; server-side audit could not be confirmed. |

## Additional observed access result

The central-administration transition to `super_stats` returned a visible `403_FORBIDDEN` for the current school-level role. This confirms a live authorization denial, but it is not a Student.Export permission test and is not used as evidence for the export contract.

## Safety boundary

Not performed:

- SQL or SQL Editor access.
- Service-role or secret use.
- Database mutation.
- Migration, schema, or RLS changes.
- Production access or production export.
- Tenant spoofing or cross-tenant probing.

## Runtime RCA and root cause of remaining blocked certification

The old dynamic-import error was caused by a stale browser shell/chunk URL after deployment. It is resolved by starting a fresh session; no code, database, RLS, or production change was required.

The reviewed commit is deployed and Student Affairs now loads in a fresh session, but the Student Read request still fails. Consequently, the required artifact, row-limit, privacy, audit, filter-parity, and permission tests cannot be honestly certified. The remaining gate is a separate Student Read data-path RCA, not an Export functional failure.

## Required next action

Operations/engineering must issue and complete a separate Student Read data-path RCA without changing the database, RLS, or production. Then provide a controlled test account with `Student.Export`, a valid tenant/school/branch context, and safe test data. Only after Student Read succeeds should the complete export matrix be rerun.

## Decision

`STU-AFFAIRS-P1-006-03C-RCA = RESOLVED / CACHE-VERSION MISMATCH`

`STU-AFFAIRS-P1-006-03B-READ-PATH-RCA = BLOCKED / STUDENT READ EVIDENCE REQUIRED`
