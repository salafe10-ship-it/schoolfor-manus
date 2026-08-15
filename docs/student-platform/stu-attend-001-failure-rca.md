# STU-ATTEND-001 — Failure RCA

## Mission status

`STU-ATTEND-001 = STOP + RCA`

## Root cause

The repository contains a legacy attendance repository and admission side effect, but not a certifiable Student Attendance platform. The expected database table is absent from the migration set, the model lacks enterprise scope and academic context, and the only visible attendance screen is for employees and is browser-backed.

## Stop triggers met

- Schema mismatch: repository expects `attendance`, but no migration creates it.
- Business semantics unresolved: admission currently creates `present` attendance without an approved rule.
- Tenant isolation cannot be certified: direct update/delete/bulk paths lack trusted tenant/school/branch enforcement.
- No canonical protected endpoint or attendance state machine.
- No safe proof of uniqueness, enrollment eligibility, session semantics, correction, approval, audit, or outbox behavior.

## Safety action

- No attendance migration was written.
- No attendance source file was modified.
- No RLS, authorization, tenant engine, Unit of Work, or database changes were made.
- No mock data or fixture was created.
- HR employee attendance was not changed or promoted to student attendance.

## Required CTO decision

Approve a dedicated Student Attendance contract/schema mission that defines enrollment eligibility, academic year/term/session ownership, status state machine, correction/approval rules, uniqueness, audit/outbox behavior, and trusted tenant context. Only after that decision may implementation begin.
