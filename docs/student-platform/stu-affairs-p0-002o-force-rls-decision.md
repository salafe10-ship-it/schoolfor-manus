# STU-AFFAIRS-P0-002O — FORCE RLS Decision

## Current status

**FORCE RLS: NOT APPROVED**

This means Security has not yet recorded the final decision. It does not mean that RLS is disabled, and it is not permission to change the database.

## Decision rule

For the future `TransferOperation` table, Security must choose one of these documented positions:

| Option | When it is acceptable | Risk |
|---|---|---|
| Approve `FORCE RLS` | Default defense-in-depth choice, especially while owner/BYPASSRLS exclusion is not independently proven | Requires migration review and owner/admin operational planning |
| Do not approve `FORCE RLS` | Only after permanent proof that every application path is non-owner and non-`BYPASSRLS`, with no escalation or owner execution path | A role-drift or administrative path could bypass ordinary RLS assumptions |

## Engineering recommendation

Approve `FORCE RLS` for `TransferOperation` unless Security proves the stronger alternative: all application paths are permanently non-owner/non-`BYPASSRLS`, role membership is controlled, and owner access cannot be used by the application. This is a recommendation for the later Security migration review, not an implementation decision in this mission.

## Required proof either way

- actual Render application role;
- `rolsuper`, `rolbypassrls`, ownership, and membership attributes;
- role privileges for the target schema/table;
- behavior under two concurrent tenant contexts;
- denial after context omission, corruption, and connection reuse;
- explicit Security sign-off stored with the migration review.

## Prohibited action now

Do not alter `DB-SEC-003`, add a policy, enable or force RLS, or execute SQL under this mission.
