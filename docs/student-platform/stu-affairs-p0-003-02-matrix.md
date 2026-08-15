# STU-AFFAIRS-P0-003-02 — Guardian Finding Matrix

## Classification rules

- **P0:** release blocker involving authoritative persistence, tenant isolation, identity integrity, or unrecoverable write ambiguity.
- **P1:** high customer/business risk that must be fixed before commercial certification.
- **P2:** maintainability or workflow completeness risk requiring a separate hardening order.

| ID | Finding | Severity | Business impact | Customer impact | Technical impact | Repair complexity | Estimated fix time | Dependency / gate | Evidence |
|---|---|---:|---|---|---|---|---:|---|---|
| P0-003-02-A | Legacy Guardian creation generates synthetic IDs/contact data and enlists SQL without the canonical tenant/branch/audit contract. | P0 | Guardian liability, identity, and relationship data can be fabricated or diverge. | Staff may see a Guardian who is not an authoritative person record. | Legacy SQL and canonical UUID model are incompatible; update scope is id-only. | High | 2–4 days | Canonical Guardian write contract; preserve P0-002P block. | `StudentGuardianService.ts:9-42`; `GuardianRepository.ts:158-175` |
| P0-003-02-B | `/api/students/bulk` reaches the legacy StudentAdmission/Guardian path and lacks the canonical tenant middleware boundary. | P0 | Bulk onboarding can create Guardian records outside the approved path. | Imported students may have missing or synthetic Guardian relationships. | Multiple creation authorities and inconsistent context/transaction semantics. | High | 2–4 days | Approved bulk contract and trusted context order; no TransferOperation. | `server.ts:962-981`; `StudentService.ts:281-305`; `StudentAdmissionService.ts:88-89` |
| P0-003-02-C | Legacy Student update synchronizes Guardian data through direct FallbackStorage reads and an id-only SQL update. | P0 | Student and Guardian records can become inconsistent or cross-scope. | Corrected phone/name may not reach the real Guardian record. | Synchronous void side effect with no explicit outcome; no tenant/branch predicate. | High | 2–4 days | Canonical Guardian update API/service and transaction contract. | `StudentService.ts:44-143`; `StudentGuardianService.ts:47-67` |
| P0-003-02-D | Guardian relationship fallback queue contains school only and replays by id without complete tenant/branch predicates. | P0 | Offline writes can be replayed into the wrong scope or merge with the wrong row. | Data may appear saved locally but not be safely committed to the school. | Recovery semantics are not tenant-complete. | High | 2–4 days | Operations decision on fallback; do not delete fallback without proof. | `FallbackStorage.ts:37-49,486-586,614-655` |
| P0-003-02-E | Canonical Student edit submits Guardian fields that the canonical update mapper ignores. | P0 | Corrections to legally relevant Guardian data are not persisted. | User receives a successful update while Guardian data remains old. | Student update and Guardian update are not one complete business operation. | Medium–High | 1–3 days | Guardian update contract; concurrency/audit requirements. | `StudentAffairsPortal.tsx:290-350`; `server.ts:428-442` |
| P1-003-02-F | No dedicated Guardian or Student-Guardian API route exists. | P1 | Guardian search/link/profile operations cannot be independently governed. | Guardian tab cannot complete its advertised management workflows. | UI relies on Student projection and disabled actions. | Medium | 2–4 days | Product/API scope approval; no schema redesign. | `server.ts` Guardian route search; `StudentAffairsPortal.tsx:1138-1204` |
| P1-003-02-G | Legacy migration utility can copy camelCase synthetic fallback records when `AUTO_MIGRATE=true`. | P1 | Environment startup can attempt incompatible data migration. | Behavior differs between local, staging, and production. | Competing migration authorities and incompatible canonical fields. | Medium–High | 1–3 days | P0-003-03 schema authority decision; no migration execution in this mission. | `src/database/migrations/student_affairs_tables.ts:9-164`; `DatabaseService.ts:31-49` |
| P2-003-02-H | Alternate Guardian component/hook are unwired and hold local form state only. | P2 | Future fixes can land in code users never execute. | UI behavior can differ between apparent Guardian screens. | Duplicate presentation paths and no persistence contract. | Low | 0.5–1 day | Product decision to integrate or retire. | `StudentGuardianInformation.tsx`; `useGuardianInformation.ts` |
| P2-003-02-I | Fallback seeds contain demo Guardian identities and legacy field shapes. | P2 | Test/demo data can be mistaken for production records. | Operators may see synthetic contacts during outage/local mode. | Seed and emergency storage concerns are mixed. | Low–Medium | 1–2 days | Explicit dev/offline data policy. | `FallbackStorage.ts:267-274` |

## Certification matrix

| Capability | Result | Reason |
|---|---|---|
| Canonical Guardian create during Student registration | **PASS for inspected path** | Trusted context, scope checks, UUID identity, audit/correlation, one transaction. |
| Canonical existing Guardian link | **PASS for inspected path** | Existing id is checked against trusted tenant/school/branch scope. |
| Canonical Guardian update from Student edit | **FAIL** | Parent fields are submitted but ignored by `toCanonicalStudentPatch`. |
| Legacy Guardian create | **FAIL / P0** | Synthetic identity and incomplete scope/audit contract. |
| Legacy Guardian synchronization | **FAIL / P0** | Direct fallback read and id-only update. |
| Student-Guardian repository isolation | **PASS for tested repository path** | 6 focused tests pass; this does not certify the legacy service. |
| Offline Guardian recovery | **NOT CERTIFIED** | Queue lacks complete tenant/branch scope and uses id-only replay. |
| Dedicated Guardian search/profile/link API | **NOT IMPLEMENTED** | No dedicated Guardian routes found. |

## P0 release decision

```text
STU-AFFAIRS-P0-003-02 = OPEN / REMEDIATION REQUIRED
P0-003-01 = CLOSED / CODE-LEVEL PASS (unchanged)
P0-002P = BLOCKED / Operations evidence pending (unchanged)
P0-002Q = NOT AUTHORIZED (unchanged)
PLATFORM-EVIDENCE-002 = CLOSED / BLOCKED + RCA (unchanged)
DB / RLS / Migration / Production = NO CHANGE
```

## Recommended repair sequence

1. CTO selects the canonical Guardian write/update boundary and decides whether fallback writes are permitted.
2. Prove the active callers of the legacy creation/synchronization path and prevent uncertified Guardian writes from being reported as successful.
3. Make every approved Guardian operation use trusted tenant/school/branch context and canonical audit/request/correlation metadata.
4. Add focused tests for canonical create, existing link, update, duplicate match, cross-tenant rejection, missing context, fallback outage, and rollback.
5. Only then consider a separate API/UI workflow order.

**Matrix status:** `READY FOR CTO REVIEW — P0 OPEN`
