# STU-AFFAIRS-P1-006-17 — Student Affairs Data Integrity Audit

## 1. Mission boundary

Discovery and static integrity audit only. No source, API, permission, authorization, tenant, database, SQL, RLS, migration, staging, production, export, reporting, graduation, transfer, or storage change was made.

## 2. Executive decision

`STOP — P0 DATA INTEGRITY FINDING REQUIRES IMMEDIATE ISOLATED FIX`

### P0-DATA-001 — Graduation returns fabricated official-looking data

- **Evidence:** `src/database/services/StudentGraduationService.ts:42-48` constructs `graduateEntry` with hardcoded `graduationYear: "2026/2027"`, `gpa: "3.92 / 4.00"`, and `certificationStatus: "Issued"`, then returns it from the graduation operation.
- **Persistence reality:** The transaction persists the student status update and audit, but the returned `graduateEntry` is not shown as being persisted to an authoritative graduation/results/certificate source.
- **API claim:** `server.ts:1262-1271` returns HTTP success with `Student graduated and record locked successfully.` and includes the returned object.
- **Business impact:** A caller can receive an apparently issued certificate/GPA result that is not sourced from a real academic record and is not a durable certificate artifact.
- **Risk:** P0 release blocker; false official academic evidence and irreversible trust damage.
- **Required next action:** Isolated P0 fix mission only. Do not implement it in this audit and do not start another domain mission until CTO review.

## 3. Integrity findings

| Risk ID | Severity | Area | Finding | Evidence | Business impact | Status |
|---|---|---|---|---|---|---|
| P0-DATA-001 | P0 | Graduation | Hardcoded GPA/year and “Issued” certificate-like registry returned as success without proven source-of-truth persistence | `StudentGraduationService.ts:42-62` | False graduate evidence and invalid certificates | STOP |
| P1-DRIFT-002 | P1 | Edit Student | UI sends `classroom`, `section`, `status`, and other form fields; `toCanonicalStudentPatch` maps only name, identity, date, gender, nationality, and student number. The API can return success while requested academic placement/status changes are not persisted | `StudentAffairsPortal.tsx:370-399`, `server.ts:523-540`, `server.ts:949-1033` | User believes year/class/section correction succeeded while canonical data remains unchanged | OPEN |
| P1-DRIFT-003 | P1 | Create Student | Compatibility route UI payload includes class/section/stage/status/address; `toCanonicalRegistrationCommand` does not map these fields into the canonical registration command. `email` is used as guardian email fallback | `StudentAffairsPortal.tsx:370-399`, `server.ts:482-522` | New students may be registered without the placement data shown by the form, or with contact data mapped to the wrong aggregate | OPEN |
| P1-TX-004 | P1 | Edit + Guardian | UI performs canonical guardian PATCH first, then a separate student POST. A guardian commit can succeed while the subsequent student update fails or conflicts | `StudentAffairsPortal.tsx:401-438`, `server.ts:1035-1058` | Partial composite update and user-facing inconsistency | OPEN |
| P1-LIFE-005 | P1 | Promotion | Active route uses legacy `StudentPromotionService`, writes hardcoded `academicYear: "2027/2028"`, and returns success without a trusted academic-year context or canonical enrollment transition | `StudentPromotionService.ts:27-87`, `server.ts:1228-1243` | Historical placement and reporting corruption across academic years | OPEN |
| P1-LIFE-006 | P1 | Lifecycle writers | Transfer, re-enrollment, dismissal, and archive services write through the legacy `StudentRepository` and do not demonstrate the canonical Enrollment/Academic Status aggregates or optimistic version contract | `StudentEnrollmentService.ts:23-238`, `server.ts:1211-1312` | Divergent state models and conflicting lifecycle history | OPEN |
| P1-UI-007 | P1 | Edit modal | Non-basic/non-guardian tabs display “تم حفظ وتأكيد البيانات...” before the save request occurs | `StudentAffairsPortal.tsx:1590-1597` | User may interpret local form state as persisted data | OPEN |
| P1-PRIV-008 | P1 | Student list/profile | Active UI renders national ID and guardian phone in list/profile/print surfaces; field-profile governance exists only for canonical XLSX export | `StudentAffairsPortal.tsx:1120-1145`, `1675-1719`, `594-662` | Excessive exposure and unsafe official-print reuse | OPEN |
| P2-LEGACY-009 | P2 | Legacy admission | Unused legacy admission service contains synthetic IDs, default academic year, default address/fees, and local subsystem writes; canonical SOP-001 route does not use it | `StudentAdmissionService.ts:20-121`, `server.ts:1035-1033` | Future direct caller can reintroduce divergent records | LEGACY / OWNER DECISION |
| P2-LEGACY-010 | P2 | Withdrawal | Legacy withdrawal service reads fallback documents and contains hardcoded exam checks for `stud_1`/`stud_2`; current DELETE route uses canonical lifecycle writer | `StudentWithdrawalService.ts:38-45`, `server.ts:1182-1209` | Dead-code confusion and unsafe future reuse | LEGACY / OWNER DECISION |

## 4. Operations verified as correctly fail-closed or truthfully bounded

- Student registration canonical path requires trusted context, idempotency, duplicate checks, audit/outbox enlistment, and one UnitOfWork.
- Canonical Guardian update validates trusted scope, permission, row lock, versions, audit, and outbox.
- Student Documents metadata operations use authentication, permission, tenant middleware, idempotency, version checks, audit, outbox, and commit-based success.
- Batch transfer UI explicitly states that no mutation occurred and remains disabled.
- Excel import UI explicitly states that no file was received and no student was modified.
- Official ID-card print is disabled; certificate tiles are disabled.

## 5. Root cause summary

Student Affairs contains a canonical SOP-001/Guardian/Documents path alongside legacy lifecycle and presentation paths. The largest integrity failure is not a missing notification; it is an official-looking graduation result created in memory with fabricated academic values and returned as a successful operation.

