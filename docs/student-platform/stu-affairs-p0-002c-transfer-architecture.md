# STU-AFFAIRS-P0-002C — Canonical Transfer Architecture

## Status

**Architecture and business-boundary design only — no implementation authorized.**

## 1. Executive Decision

The canonical source of truth for a first-class transfer must be the Enrollment domain, not the legacy `students.classroom`, `students.section` or `students.status` projection.

The current Student Affairs button must be split conceptually:

1. **Placement Edit:** changes class/section within the same active Enrollment.
2. **Enrollment Transfer:** changes branch, school within the tenant, academic year or term and creates the approved source/destination Enrollment history.

The UI may present one workflow entry point, but the command type must be explicit before persistence. If the client cannot express the distinction, the command must be rejected rather than inferred.

## 2. Canonical Ownership

| Concern | Canonical owner |
|---|---|
| Student identity | Student Platform |
| Current academic placement | Enrollment aggregate |
| Placement history | Approved Enrollment history contract; exact shape requires confirmation |
| Academic lifecycle | Academic Status aggregate |
| Cross-school/branch transfer | Enrollment Transfer contract |
| Audit compliance | Governance audit contract |
| Integration delivery | Governance Outbox contract |
| Tenant/school/branch authority | Trusted authenticated context and Tenant Engine |
| Browser display state | UI projection only; never source of truth |

## 3. Canonical Command Classification

### Placement Edit

Use only when the source and destination remain within the same Enrollment ownership and academic period. It changes approved placement fields such as class/section according to a future placement-history decision.

It must not create an `enrollment_transfers` row unless a separately approved policy says that placement history is represented there. The current ENROLL-CONTRACT-002 explicitly distinguishes placement edits from first-class transfers.

### Enrollment Transfer

Use when branch, school, academic year or term ownership changes. It follows ENROLL-CONTRACT-002:

`approve → close source Enrollment → create destination Enrollment → record enrollment_transfers → write history → audit/outbox`

All effects are one approved application transaction.

## 4. Recommended Application Shape

The future implementation should expose one canonical application boundary that accepts an explicit command type and trusted context. It may internally call domain-specific operations, but it must not call public single-student methods that open independent transactions.

The boundary must perform:

1. normalize and validate the batch;
2. resolve trusted tenant/school/branch and actor;
3. classify or require the command type;
4. validate every student and Enrollment before mutation;
5. acquire one approved request-scoped transaction;
6. apply all effects;
7. write history, audit and outbox records;
8. commit once and return the actual result.

## 5. Existing Path Disposition

- `StudentAffairsPortal.handleBatchTransfer`: UI adapter only; must stop submitting ambiguous commands.
- `components/student-affairs/repository/StudentRepository.transferStudent`: legacy single-student transport; not canonical for the batch.
- `src/database/services/StudentEnrollmentService.transferStudent`: existing single-student legacy service; may be reused only after transaction-aware composition is proven.
- `POST /api/students/:id/transfer`: existing single-student compatibility route; its final disposition requires route governance.
- `POST /api/students/bulk`: not canonical; nested transaction conflict must not be hidden.
- `src/database/repositories/StudentRepository.bulkTransfer`: legacy loop; must not be promoted by renaming.

## 6. Integration Boundaries

Enrollment Transfer may affect Academic Status only according to ENROLL-CONTRACT-002. Transfer is not a Student Status. Finance, attendance, examinations, library, transport and notifications must consume approved events rather than direct UI-local updates.

## 7. Required Architecture Mission

An implementation mission is still required for the transaction-aware repository/application composition because the current repository performs direct persistence and does not accept the active transaction session. That mission must be separate if it requires shared UnitOfWork changes.

## Decision

**ARCHITECTURE READY FOR REVIEW — IMPLEMENTATION BLOCKED UNTIL OPEN BUSINESS AND TRANSACTION DECISIONS ARE APPROVED.**
