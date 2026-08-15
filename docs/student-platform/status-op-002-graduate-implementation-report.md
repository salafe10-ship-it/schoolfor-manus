# STATUS-OP-002 — Graduate Implementation Report

## Implementation scope

No code implementation was performed. The mission stop conditions were reached during contract validation.

## Why implementation stopped

The legacy application contract is `active → graduated` with `feesRemaining = 0`. The canonical Academic Status database contract permits `withdrawn → graduated` and requires canonical status, transition, history, audit, and outbox records in one existing UnitOfWork.

Bridging this difference safely would require at least one of the following actions, all outside the approved scope:

- changing migration/schema constraints to allow `active → graduated`;
- changing business semantics to require Enrollment withdrawal/closure first;
- introducing a new graduation persistence contract;
- defining a trusted canonical source for the legacy fee balance;
- deciding the operation-specific authorization permission.

The service cannot be changed to write `withdrawn` merely to satisfy the database constraint. That would create a false withdrawal history and alter the ERP meaning of graduation.

## Safety result

- No status mutation was performed.
- No legacy endpoint was disabled.
- No database, migration, RLS, authorization, tenant, or UnitOfWork file was changed.
- SOP-001 remains unchanged.

## Required CTO/business decisions

1. Approve the legal/academic source state for graduation.
2. Approve whether Enrollment must close before graduation.
3. Approve the fee-balance source and server-side rule in the canonical model.
4. Approve whether the existing broad `Student.Write` is temporarily accepted; narrower permission is a separate mission.
5. Approve the required canonical side effects: enrollment, academic year, attendance, examinations, finance, history, audit, and outbox.

## Mission decision

`STATUS-OP-002 = BUSINESS DECISION REQUIRED`.
