# STU-AFFAIRS-P0-002L — Schema/Migration Implementation Report

## Mission

Transfer Operation physical persistence for Staging/Local only.

## Mission status

`STOP + RCA — SECURITY DEPENDENCY`

## Pre-migration inspection

- No existing physical `TransferOperation` entity, table, migration, or equivalent operation-store schema was found.
- Existing Enrollment and Governance migrations do not provide the required command/result lifecycle.
- The approved design therefore requires a new physical persistence object in a separate migration.

## Blocking finding

The new record contains tenant-scoped operation keys, payload hashes, result references, actor/request metadata, and reconciliation state. It is sensitive command state and requires database-level tenant isolation.

The current repository has no RLS policy for the new object. The existing Student/Governance RLS migration uses `current_setting('app.*')`, and adding a new policy under that unverified pattern would create a security dependency rather than close isolation safely. Creating the table without RLS would create an unsafe tenant-leakage window.

## Why the migration was not written

- A table without RLS is not acceptable for this data.
- Inventing a new JWT/RLS contract is outside P0-002L.
- Modifying existing RLS or opening a security exception is forbidden by the mission.
- Retention duration remains an Operations/Product decision and must not be invented in SQL.

## Files modified

No migration, source, DB, RLS, role, or Production file was modified. This report and its validation report are documentation only.

## Required dependency

Open a separate security/schema mission to approve the trusted-identity RLS contract and retention policy, then re-run the migration review. Do not execute a partial or blind migration.
