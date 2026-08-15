# ACC-001-GOV-001 — Accounting Owner Governance Contract

**Mission:** `PROGRAM-RELEASE-P0-002 / ACC-001-GOV-001`  
**Status:** `GOVERNANCE CONTRACT CLOSED — ACCOUNTING IMPLEMENTATION STILL OWNER-GATED`  
**Scope:** Documentation and governance contract only  
**Date:** 2026-08-13

## 1. Purpose

This document records the formal governance role required before any accounting implementation can be approved. It does not create a person, assign the role to an individual, or authorize financial code, schema, SQL, migrations, seed data, RLS, staging, or production changes.

## 2. Official role

The governing role is **Accounting Owner**.

The role is an approval authority, not an application user, database account, or invented individual identity. The person or organization holding the role must be assigned outside this document through the owner’s operational governance process.

## 3. Approval scope

The Accounting Owner must approve or reject changes to:

1. **Chart of Accounts** — account identity, hierarchy, account nature, postability, scope, and lifecycle.
2. **Accounting Periods** — opening, closing, reopening, period boundaries, and close controls.
3. **Posting Rules** — event-to-account mappings, journal semantics, balancing precision, posting eligibility, reversal, correction, and financial effect timing.

No material change in these three areas may be treated as approved solely because engineering code exists or because a technical deployment succeeded.

## 4. Governance workflow

1. A change proposal identifies the affected accounting contract and business reason.
2. The proposal includes impact, invariants, migration/reconciliation implications, audit requirements, and rollback/correction behavior.
3. The Accounting Owner reviews the proposal against approved accounting policy.
4. Approval or rejection is recorded with actor, timestamp, decision, scope, reason, and correlation/reference ID.
5. Only an approved decision may become an implementation mission.
6. Engineering validates the approved contract and implements only the authorized scope.
7. Post-implementation verification is recorded separately; implementation success never substitutes for Accounting Owner approval.

## 5. Non-delegable boundaries

The following are not granted by this contract:

- authority to create or alter a chart of accounts;
- authority to open, close, or reopen accounting periods;
- authority to change posting or journal rules;
- authority to approve financial calculations or mappings;
- authority to execute SQL, migrations, or production changes;
- authority to assign a named person to the role.

## 6. Evidence required for implementation authorization

Before an accounting implementation mission is opened, the repository must contain or reference an approved record showing:

- the accountable Accounting Owner role assignment;
- the approved scope of the decision;
- the decision date and decision identifier;
- the approved accounting policy or contract version;
- the affected domains and required review participants;
- any required reconciliation, audit, and correction obligations.

Until this evidence exists, Accounting implementation remains owner-gated.

## 7. Current decision

`ACC-001-GOV-001 = GOVERNANCE CONTRACT CLOSED — ACCOUNTING IMPLEMENTATION STILL OWNER-GATED`

This closes the documentation task only. It does not close `ACC-001-OWNER` as a financial implementation gate and does not authorize changes to Accounting code or data.
