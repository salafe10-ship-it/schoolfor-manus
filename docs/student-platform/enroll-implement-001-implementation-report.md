# ENROLL-IMPLEMENT-001 — Implementation Report

Date: 2026-08-11  
Scope: canonical Enrollment core only

## Mission result

**ENROLL-IMPLEMENT-001 = STOP + RCA**

No application implementation was committed because a required contract cannot be executed against the current approved schema without a migration change.

## Stop condition

`STOP-1`: the current schema does not allow the approved Enrollment/Academic Status contract without migration.

## Exact root cause

The approved contract requires an approved withdrawal operation to close Enrollment as `withdrawn` and change Academic Status to `withdrawn` atomically.

The current migration `supabase/migrations/202608061000_academic_status_engine.sql` constrains ordinary Academic Status transitions to:

`applicant → admitted → active → suspended → withdrawn → graduated → archived`.

It does not allow ordinary:

`active → withdrawn`.

Implementing the approved withdrawal contract would therefore require either:

1. a schema/migration change to authorize the direct transition; or
2. an artificial `active → suspended → withdrawn` sequence that would create a false suspension event and violate the approved business meaning.

Both alternatives are outside this mission. The artificial sequence is explicitly rejected as unsafe.

## What was not changed

- No `src` implementation files.
- No `UnitOfWork`.
- No migrations or schema.
- No RLS, Auth, Authorization or TenantEngine.
- No Legacy transfer/re-enrollment endpoints.
- No database or production environment.

## Safe recommendation

Issue a focused contract/schema decision before implementation:

- approve a migration amendment that represents the intended withdrawal transition; or
- revise the business contract to require the existing two-step Academic Status lifecycle, with explicit approval of the resulting semantics.

Do not continue with Enrollment core implementation until one option is approved.
