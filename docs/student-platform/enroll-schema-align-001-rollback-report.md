# ENROLL-SCHEMA-ALIGN-001 — Rollback Report

Date: 2026-08-11

## Rollback design

The migration uses transactional DDL. If the constraint replacement fails before `COMMIT`, PostgreSQL rolls back the dropped constraint and the replacement attempt together; no partial constraint state should remain.

## Application rollback

No application code was changed, so no application rollback is required.

## Database rollback limitation

This repository does not use destructive down migrations. After a successfully applied staging migration, reverting the rule requires a separately reviewed corrective migration that restores the prior constraint definition. That corrective migration is not created or executed by this mission.

## Required staging rollback test

Before production consideration, execute the migration in an isolated staging database and force a failure inside the transaction. Verify:

1. the old constraint remains present after rollback;
2. `active → withdrawn` is not accepted after rollback;
3. all existing allowed transitions remain unchanged;
4. no unrelated object changes.

This report does not claim that live staging SQL execution occurred.
