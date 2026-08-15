# STU-AFFAIRS-P1-006-13 — Lifecycle Implementation Gap Matrix

## Scope

This is a read-only comparison of the current Student Affairs lifecycle implementation against the P1-006-12 domain contract. No code, database, route, migration, RLS, or production setting was changed.

## Top findings

| ID | Severity | Current implementation | Expected contract | Gap type | Dependency | Direct fix after approval? |
|---|---|---|---|---|---|---|
| LIF-01 | P0 | Graduation returns fixed/mock registry values (`2026/2027`, GPA `3.92 / 4.00`, `Issued`) | Durable graduation data from canonical academic sources | Data integrity / false success | DOMAIN + SCHEMA + OWNER | No — contract/source decision first |
| LIF-02 | P0 | Current state machine uses legacy values and lacks approved `Admitted` | Approved Applicant → Admitted → Active → Suspended → Withdrawn → Graduated → Archived | State integrity | DOMAIN OWNER | No — mapping decision first |
| LIF-03 | P0 | Transfer returns a transient movement object; target school is not applied in the observed update path | Immutable enrollment transfer aggregate/history | Cross-school/data integrity | TRANSFER P0 + SCHEMA + SECURITY | No — blocked by approved TransferOperation |
| LIF-04 | P1 | Promotion hardcodes `academicYear` to `2027/2028` | Trusted academic-year/term context | Historical/reporting integrity | DOMAIN + CORE ACADEMIC CONTEXT | No — source-of-truth decision first |
| LIF-05 | P1 | Lifecycle actions do not show dedicated status/enrollment history writes | Immutable lifecycle/enrollment history for every transition | Auditability | SCHEMA + DOMAIN | No — history contract/schema first |
| LIF-06 | P1 | Archive restore has two route/service paths | One canonical archive/restore command | Divergent behavior | API/DOMAIN OWNER | Partly — route decision first |
| LIF-07 | P1 | Lifecycle routes use broad `Student.Write`; operation-specific approval/permissions are not demonstrated | Permission and approval per transition | Authorization/business control | AUTH + DOMAIN OWNER | No — permission policy first |
| LIF-08 | P1 | Idempotency key and expected-version handling are not present in the reviewed lifecycle route contracts | Idempotent commands and optimistic concurrency | Retry/concurrency risk | API + DOMAIN | No — command contract first |
| LIF-09 | P1 | `StudentWithdrawalService` consults `FallbackStorage` for documents/contacts and auxiliary commitments | Canonical tenant-scoped records in one approved transaction boundary | Persistence/tenant consistency | SCHEMA + OPERATIONS | No — dependency owner decision |
| LIF-10 | P1 | No explicit lifecycle outbox publication was proven in the reviewed services | Transactional domain event/outbox per transition | Integration consistency | GOVERNANCE/SCHEMA/OPERATIONS | No — outbox proof/contract first |

## Additional findings

| ID | Severity | Finding | Classification |
|---|---|---|---|
| LIF-11 | P2 | Generic student update accepts status changes through a broad update path, even though lifecycle transitions should be dedicated commands | DOMAIN/API decision |
| LIF-12 | P2 | Dismissal maps permanent action to legacy `dismissed`, which is absent from the approved state set | DOMAIN decision |
| LIF-13 | P2 | Re-enroll changes placement and registration date but lacks explicit academic-year/term/enrollment command fields | DOMAIN/API gap |
| LIF-14 | P2 | Archive/restore effects on enrollment are not explicit | DOMAIN decision |
| LIF-15 | P2 | Client repository still exposes `permanentDeleteStudent`, while the canonical server route rejects physical deletion | LEGACY surface; owner cleanup decision |
| LIF-16 | P3 | Some older lifecycle UI handlers display success/info notifications after local state changes rather than a canonical transition response | LEGACY false-success risk |

## What is not claimed

- The presence of `UnitOfWork.runInTransaction` does not prove that the domain contract, history, outbox, and external side effects are complete.
- `AuditRepository.log` is not treated as a substitute for immutable lifecycle history or an outbox event.
- The existing authentication, permission middleware, and tenant middleware are not redesigned by this audit; their use is recorded, not recertified for the missing domain contracts.

## Remediation classification

### Direct code fixes after approval

Potentially direct once the contract is approved: remove hardcoded/fixed values, unify one route adapter, enforce explicit result-based notifications, and add tests for command guards. These are not authorized in this discovery mission.

### Requires domain decision

Status mapping, transition edges, approval thresholds, enrollment effects, academic context, graduation source of truth, and archive/restore policy.

### Requires schema/API decision

Lifecycle history, enrollment transfer history, graduation registry, storage of approval/effective context, idempotency, optimistic concurrency, and outbox linkage.

### Requires security/operations decision

Cross-school transfer, FallbackStorage retirement/ownership, outbox workers, retry/dead-letter behavior, and production observability.

