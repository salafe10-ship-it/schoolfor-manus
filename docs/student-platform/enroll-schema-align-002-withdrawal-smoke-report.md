# ENROLL-SCHEMA-ALIGN-002 — Withdrawal Smoke Report

Date: 2026-08-11

## Required smoke test

The required live operation is:

`Enrollment active + Academic Status active`

→ atomic Withdrawal

→ `Enrollment withdrawn + Academic Status withdrawn + Enrollment History + Status Transition/History + Audit Event + Outbox Event`

## Result

**NOT RUN — live migration not applied.**

The safe test cannot begin because the Supabase Staging database reports no migrations and the local environment has no Supabase CLI or authenticated project connection. Running the operation would not provide evidence against the approved schema and would risk testing the wrong database state.

## Rollback and fault injection

**ROLLBACK FAULT-INJECTION = NOT AVAILABLE.**

No fault injection, SQL Editor workaround, `postgres`, `service_role`, RLS bypass or direct database mutation was attempted.
