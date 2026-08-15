# STU-AFFAIRS-P0-006-03 — Graduation Integrity Safety Design

Status: `STOP — DOMAIN/SCHEMA/ACADEMIC DECISION REQUIRED`

## Scope

This document is a safety and architecture design only. It does not authorize changes to the graduation service, API, UI, schema, SQL, migrations, RLS, production, or transfer behavior.

## Confirmed root risk

`src/database/services/StudentGraduationService.ts` currently:

- reads a student by `schoolId` and validates fees;
- runs a request-scoped Unit of Work and updates `students.status` to `graduated`;
- returns a fabricated `graduateRegistry` object with a deterministic ID, fixed academic year `2026/2027`, fixed GPA `3.92 / 4.00`, and fixed certificate status `Issued`;
- writes an audit message, but does not persist a canonical graduation record, graduation history, certificate artifact, or outbox event.

The route is protected by authentication, `Student.Write`, and the student tenant middleware. Those controls do not make fabricated graduation values trustworthy. This is therefore a P0 data-integrity and commercial-trust risk.

## Required integrity boundary

Graduation must be treated as an orchestration across separate sources of truth:

`Student → Enrollment → Academic Context → Results/Calculation → Eligibility Decision → Graduation Record → History → Audit → Outbox → Certificate Artifact`

No UI response may claim successful graduation until the canonical graduation record and required history/audit records have committed in the same approved Unit of Work.

## Required eligibility contract

The design contract is:

`Student + qualifying active/completed Enrollment + Academic Year/Term + validated Results/Calculation + approved Eligibility Rules = Graduation Decision`

The following must be proven before implementation:

- the student identity and trusted tenant/school/branch context;
- the applicable academic year and term;
- the enrollment being closed by graduation;
- the authoritative results source and GPA calculation policy;
- outstanding academic requirements and any approved exceptions;
- required financial/administrative gates and their authority;
- the actor and approval authority for the decision;
- idempotency and optimistic-concurrency requirements.

## Integrity rules

The future implementation must prevent:

1. Graduation without a canonical student.
2. Graduation without an applicable enrollment.
3. Graduation without academic context.
4. GPA or academic year values supplied by the client or hardcoded in the service.
5. Duplicate graduation decisions for the same student and academic context.
6. A certificate referencing a missing or uncommitted graduation record.
7. Editing an approved graduation outside an approved correction workflow.
8. Physical deletion of an approved graduation record.
9. A success response before the transaction commits.
10. Direct compatibility-status updates becoming a competing source of truth.

## Required correction model

An approved graduation is append-only from a business perspective. A correction must create a linked correction request with:

- the original graduation record;
- a reason and supporting evidence reference;
- trusted actor, approval, request, and correlation metadata;
- an explicit before/after change set;
- a new immutable history event;
- audit and outbox evidence.

No silent overwrite or direct delete is permitted.

## Current decision

`STOP — DOMAIN/SCHEMA/ACADEMIC DECISION REQUIRED`

Implementation authorization is not granted until the source-of-truth decisions are approved and the missing canonical record contract is available.
