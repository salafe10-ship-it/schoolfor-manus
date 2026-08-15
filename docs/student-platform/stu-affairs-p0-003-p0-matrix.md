# STU-AFFAIRS-P0-003 — P0/P1/P2 Matrix

## Classification rules

- **P0:** release blocker; security, authoritative persistence, or deployment ambiguity.
- **P1:** high customer/business risk; must be fixed before commercial certification.
- **P2:** medium maintainability, UX, or scale risk; schedule before production hardening.
- **P3/P4:** none promoted by this discovery pass without more evidence.

| ID | Finding | Severity | Business impact | Customer impact | Technical impact | Repair complexity | Estimated fix time | Dependency / gate | Evidence |
|---|---|---:|---|---|---|---|---:|---|---|
| P0-003-01 | Legacy lifecycle endpoints bypass canonical TenantContext and route through legacy repositories/services. | P0 | Wrong lifecycle outcome or cross-school/branch mutation risk. | Staff may update a record outside the intended scope or see inconsistent status. | Two authorization/tenant/transaction paths. | High | 2–4 days | Must preserve P0-002P block for transfer; no TransferOperation here. | `server.ts:1012-1113`; `src/database/services/StudentEnrollmentService.ts:74-235` |
| P0-003-02 | Guardian sync can use FallbackStorage, synthetic identities, and school-only legacy scope. | P0 | Guardian liability and relationship data can diverge from the student source of truth. | Wrong guardian or missing relationship can affect communication and safety. | Non-canonical persistence and weaker scope model. | High | 3–5 days | Canonical Guardian/StudentGuardian contract and recovery decision. | `src/database/services/StudentGuardianService.ts:9-65`; `src/database/repositories/GuardianRepository.ts:11-175` |
| P0-003-03 | Canonical and legacy Student Affairs migration/schema authorities coexist. | P0 | Deployment may certify one schema while runtime uses another. | Features can fail differently across environments. | Duplicate table/policy/identifier models; drift risk. | High | 2–4 days | CTO architecture/deployment decision; no migration executed in this audit. | `supabase/migrations/202608051500_student_platform_foundation.sql`; `src/database/migrations/student_affairs_tables.sql` |
| P1-003-04 | Portal loads only page 1/100 and computes totals/filter/pagination locally. | P1 | Incomplete reporting and wrong operational counts. | Large schools cannot find or see all students. | Client/server pagination contract is incomplete. | Medium | 1–2 days | API meta contract and performance acceptance tests. | `StudentAffairsPortal.tsx:116-233`; `server.ts:765-775` |
| P1-003-05 | Bulk repository sends raw array while server expects `{operation,items}`; import remains unavailable. | P1 | Bulk processing/import cannot be relied on. | Staff cannot onboard or correct cohorts efficiently. | API contract mismatch and incomplete workflow. | Medium | 1–2 days | Approved bulk semantics and idempotency policy. | `StudentRepository.ts:39-49`; `server.ts:962-981`; `StudentAffairsPortal.tsx:1715-1742` |
| P1-003-06 | Guardian link, contact, SMS, card, transfer, and import actions are disabled or notification-only. | P1 | Commercial scope is materially incomplete. | User sees polished controls that do not complete the promised action. | UI state is ahead of backend capability. | Medium | 3–6 days per approved subset | Provider/integration approvals where applicable. | `StudentAffairsPortal.tsx:1147-1194,1526-1529,1622-1742` |
| P1-003-07 | Print/export output handling is not hardened. | P1 | Corrupt reports or unsafe exported content. | Printing/exporting certain names/notes can fail or render unexpectedly. | Escaping, CSV serialization, authorization/audit not demonstrated. | Medium | 1–2 days | Approved export/print security contract. | `StudentAffairsPortal.tsx:464-550` |
| P1-003-08 | Timeline/legacy writes are not proven to use append-only canonical audit events. | P1 | Regulatory and dispute evidence may be incomplete. | Staff cannot trust the student history timeline. | In-memory movement log and legacy audit read path. | High | 2–4 days | Central audit/outbox contract. | `server.ts:1115-1140`; `StudentService.ts:44-143`; `StudentEnrollmentService.ts:112-119` |
| P2-003-09 | Multiple Student Affairs components are unwired/dead-code candidates. | P2 | Maintenance cost and inconsistent future fixes. | Some screens may appear to change without affecting the live portal. | Duplicate component/handler surface. | Low–Medium | 1–2 days | Product decision to integrate or retire. | `StudentAffairsPortal.tsx` imports vs `src/components/student-affairs/*` |
| P2-003-10 | Bearer token is read from localStorage in client Student Affairs code. | P2 | Increased blast radius for same-origin XSS. | Session could be exposed in a browser compromise. | Storage policy differs from hardened cookie/session options. | Medium | 1–2 days | Authentication/session owner approval. | `StudentAffairsPortal.tsx:118`; `StudentRepository.ts:6-12` |
| P2-003-11 | Performance evidence is uneven; large chunks and missing lifecycle SLAs. | P2 | Scale confidence is reduced. | Slower first load and uncertain response times at scale. | No consistent p95/query budget across all workflows. | Medium | 2–4 days | Performance test dataset and budget. | Vite build output; canonical-only PERF-004 instrumentation |

## P0 release decision

```text
P0-003-01  OPEN / remediation required
P0-003-02  OPEN / remediation required
P0-003-03  OPEN / architecture-deployment decision required
P0-002P    BLOCKED / Operations evidence pending (unchanged)
P0-002Q    NOT AUTHORIZED (unchanged)
```

## Recommended repair sequence

1. Freeze/declare the single Student Affairs schema and persistence authority.
2. Bring all non-transfer lifecycle routes through the canonical trusted context, authorization, transaction, version, and audit boundary.
3. Resolve Guardian canonical persistence and relationship synchronization.
4. Keep TransferOperation out of this mission until the P0-002P evidence gate is closed and a separate CTO order authorizes it.
5. Repair API/UI contracts, then complete the UX and performance acceptance suite.
