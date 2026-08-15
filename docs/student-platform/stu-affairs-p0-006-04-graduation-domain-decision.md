# STU-AFFAIRS-P0-006-04 — Graduation Domain Decision

Status: `STOP — DOMAIN/ACADEMIC DECISION REQUIRED`

## Proposed ownership

| Capability | Proposed owner | Rationale | Approval status |
|---|---|---|---|
| Student identity | Student Affairs | Owns canonical student identity and tenant scope | `Existing contract` |
| Enrollment closure | Enrollment | Owns placement period, academic year, term, and closure history | `Approved contract` |
| Academic results | Examinations/Results | Owns marks, result locking, calculation evidence, and result corrections | `Not approved for this flow` |
| Graduation eligibility | Academic Affairs/Registrar | Owns policy and final decision | `Owner approval required` |
| Graduation record | Graduation/Academic Status capability | Owns durable decision and lifecycle | `Schema/domain decision required` |
| Certificate artifact | Documents/Certificate capability | Owns artifact creation, issuance, and retention | `Owner approval required` |
| Audit | Governance platform | Owns compliance evidence | `Platform dependency` |
| Integration delivery | Outbox platform | Owns reliable downstream notifications/integration | `Platform dependency` |

## Non-negotiable design decisions

- `students.status` is a compatibility projection, not sufficient graduation evidence.
- Enrollment closure, Academic Status graduation, graduation record, domain history, audit, and outbox must be coordinated atomically where the approved contract requires it.
- Results/GPA must come from an authoritative, versioned source. The current JSON/mock Exams path cannot be promoted by assumption.
- Approved graduation records are immutable by ordinary updates and may change only through a correction/revocation workflow.
- The UI must be disabled or show `NOT AVAILABLE` until canonical graduation data exists; it must not show success from an in-memory registry.

## Decision gates before implementation

Implementation remains blocked until all of the following are approved:

1. Canonical Results source and calculation contract.
2. Academic Affairs eligibility and approval policy.
3. Canonical Graduation Record and History ownership.
4. Enrollment closure semantics.
5. Certificate artifact boundary and retention.
6. Security permissions and approval separation.
7. Schema/migration scope and tenant isolation design.
8. Operations plan for existing/mock data and migration of legacy paths.

## Final decision

`P0-006-04 = DISCOVERY CLOSED / IMPLEMENTATION BLOCKED`

The current system is not authorized to present or persist a trusted graduation outcome.
