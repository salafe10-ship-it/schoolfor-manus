# STU-AFFAIRS-P0-006-03 — Graduation Source of Truth

Status: `STOP — DOMAIN/SCHEMA/ACADEMIC DECISION REQUIRED`

## Evidence matrix

| Graduation value | Required source of truth | Current evidence | Status |
|---|---|---|---|
| Student identity | Canonical Student aggregate | `StudentRepository.getById` is used | `PROVEN` for lookup only |
| Tenant/school/branch | Trusted authenticated tenant context | Route and service currently center on `schoolId`; full branch semantics are not proven | `NOT PROVEN` |
| Enrollment being graduated | Canonical Enrollment aggregate | Approved enrollment contract requires closing the applicable Enrollment atomically; service does not read or close Enrollment | `NOT PROVEN` |
| Academic year | Canonical academic context | Service returns fixed `2026/2027`; no trusted source is read | `MOCK` |
| Term | Canonical academic context | No term is read or persisted by the service | `NOT PROVEN` |
| Results/GPA | Canonical results/calculation source | Service returns fixed `3.92 / 4.00`; no results source is read | `MOCK` |
| Graduation eligibility | Approved academic/domain rule | Fee balance is checked; complete academic eligibility is not proven | `NOT PROVEN` |
| Graduation date | Approved command/request context plus server time | No canonical graduation date is persisted | `NOT PROVEN` |
| Graduation status | Canonical Graduation Record | Service returns fixed `Issued`; no graduation record exists in the reviewed path | `MOCK` |
| Approval actor | Trusted identity and approval authority | `meta.userName` is placed in the fabricated response; approval authority is not separately proven | `NOT PROVEN` |
| Certificate | Separate certificate artifact contract | No artifact is persisted or linked | `NOT PROVEN` |
| History | Immutable graduation/domain history | Student audit entry exists; graduation history is not proven | `NOT PROVEN` |
| Compliance audit | Central audit event | `AuditRepository.log` is called | `PARTIAL` |
| Integration delivery | Outbox event | No outbox write is proven in this path | `NOT PROVEN` |

## Required canonical relationship

The approved design must resolve this relationship before implementation:

`student → applicable enrollment → academic year/term → authoritative results → eligibility decision → graduation record → graduation history`

The compatibility field `students.status` may remain a projection, but it cannot be the only durable graduation evidence.

## Required owner decisions

The following are not inferred from code:

1. Who owns final graduation eligibility: Academic Affairs, Registrar, or another approved domain.
2. Which results source and GPA calculation are legally authoritative.
3. Whether financial clearance is a hard gate, advisory gate, or separate approval.
4. The official academic-year and term semantics for graduation.
5. The canonical graduation statuses and certificate lifecycle.
6. Whether one graduation is allowed per student per school, tenant, program, or academic context.
7. The correction and revocation authority.
8. Retention and legal-hold requirements for graduation evidence.

## Prohibited assumptions

- Do not use `students.status = graduated` as proof of a complete graduation.
- Do not derive GPA from UI state, request body, local storage, or fixed values.
- Do not choose an academic year or term from the current date without an approved policy.
- Do not treat an audit message as a substitute for domain history.
- Do not emit a certificate or success notification without a committed canonical record.

## Decision

`NOT PROVEN — SCHEMA/DOMAIN/ACADEMIC DECISION REQUIRED`
