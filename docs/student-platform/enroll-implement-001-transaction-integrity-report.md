# ENROLL-IMPLEMENT-001 — Transaction Integrity Report

Date: 2026-08-11  
Status: not implemented because of STOP-1

## Intended transaction boundary

The approved canonical sequence would be:

`BEGIN`

→ validate trusted tenant context

→ validate Enrollment and expected version

→ validate allowed transition

→ update Enrollment

→ update Academic Status and record its transition/history

→ insert `enrollment_history`

→ insert `audit_events`

→ insert `outbox_events`

→ `COMMIT`

Any failure before commit must produce `ROLLBACK`; no partial domain rows are acceptable.

## Why implementation stopped before transaction tests

The transaction boundary cannot be made correct while one required state transition is rejected by the existing schema. A transaction that commits a synthetic suspension would be atomic but semantically incorrect. A transaction that omits the Academic Status change would violate the approved contract.

## No transaction workaround

The general UnitOfWork and Postgres transaction driver were not modified. No fallback storage, direct SQL outside UnitOfWork, or legacy route conversion was introduced.

## Required unblock

Resolve the Academic Status transition contract/schema mismatch first, then rerun transaction tests for:

- activation coupling;
- withdrawal coupling;
- transfer source/destination;
- re-enrollment new-period creation;
- failure at every write stage;
- tenant denial and rollback;
- idempotent replay.
