# ENROLL-CONTRACT-001 — Architecture Decision Report

Date: 2026-08-11  
Mission: Canonical Enrollment Ownership & State Contract

## Executive decision

**ENROLL-CONTRACT-001 = BUSINESS DECISION REQUIRED**

## Why this is not contract-ready

The repository provides strong structural evidence for tenant-scoped Enrollment tables and one atomic initial registration path. It does not provide enough evidence to choose the final business semantics for:

- Enrollment state ownership;
- the relationship between Enrollment and Academic Status;
- Transfer scope and closure/create behavior;
- Re-enrollment behavior;
- the disposition of the legacy `students.status` lifecycle;
- the exact meaning of `completed` versus `graduated`.

Choosing these by implementation assumption would create a new canonical model on top of unresolved business rules.

## Decisions that can be accepted now

1. Student identity remains owned by `students`.
2. Enrollment placement belongs in `enrollments`.
3. Enrollment timeline belongs in `enrollment_history`.
4. Transfer process belongs in `enrollment_transfers` if the business confirms transfer as an Enrollment operation.
5. Academic lifecycle belongs in the Academic Status aggregate.
6. SOP-001 is the only proven canonical initial-registration writer.
7. Legacy transfer/re-enrollment writers must not be extended as canonical Enrollment writers without a contract.

## CTO/business answers required

| Decision | Required answer |
|---|---|
| Active Enrollment gate | Does `enrollment_status = active` require Academic Status `active`? |
| Initial pending enrollment | Is `pending/pending` an application holding state or a true enrollment? |
| Completed vs graduated | Are they separate concepts? Which one closes Enrollment and which one changes Academic Status? |
| Withdrawal | Does it always close Enrollment and change Academic Status? |
| Transfer | Which scope counts as transfer, and does it close/create Enrollment records? |
| Re-enrollment | New Enrollment or reopen old one? Which academic year/term? |
| Legacy lifecycle | Deprecate, project, or retain `students.status`? |
| History | Which event is mandatory for every Enrollment state change? |

## Safe next implementation boundary

After the above answers are approved, issue a separate hardening mission that may:

- define the canonical Enrollment application service;
- migrate transfer and re-enrollment writers behind it;
- write immutable history and outbox events;
- enforce expected-version concurrency;
- add contract and regression tests.

This report does not authorize any of those changes.
