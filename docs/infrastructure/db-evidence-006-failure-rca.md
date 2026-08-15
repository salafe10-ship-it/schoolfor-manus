# DB-EVIDENCE-006 — Failure RCA

## Mission status

`DB-EVIDENCE-006 = BLOCKED + RCA`

## Environment

- Target: Supabase Staging project `edupro-school-erp-staging`.
- Project reference: `vjcjscqgmijgzagshsca`.
- Production: not accessed.
- Mutation: none.

## Required evidence

The CTO order requires two complete, sanitized, read-only evidence sets:

1. Remote migration history: applied versions, order, pending versions, and comparison with the Git baseline.
2. Dependency schema definitions for `students`, `enrollments`, academic year, term, class/section dependencies, `audit_events`, and `outbox_events`, including columns/types, primary keys, foreign keys, unique constraints, check constraints, indexes, exclusion constraints if present, and relevant triggers/functions.

## Evidence available locally

The repository contains prior evidence artifacts, including:

- `docs/infrastructure/db-evidence-005-migration-state.md`
- `docs/infrastructure/db-evidence-005-schema-state.md`
- `docs/infrastructure/db-history-align-001-failure-rca.md`
- `docs/infrastructure/platform-evidence-002-failure-rca.md`

These artifacts establish prior observations such as an empty or unmatched remote migration-history surface and limited dashboard object visibility. They do not constitute a new complete schema-definition export or a complete current migration-history attestation for all objects required by `DB-EVIDENCE-006`.

The local repository can confirm that the target attendance migration exists and that the linked project reference is `vjcjscqgmijgzagshsca`. Local Git files cannot prove remote applied state, pending state, live constraint text, or live index definitions.

## Approved-channel result

No approved Operations/Platform connector or sanitized schema/migration export is available in this execution environment.

The Dashboard/Table Editor is insufficient for the required definition matrix. The previously inspected Table Editor session uses the PostgreSQL `postgres` role, so it is not an approved evidence channel under the CTO order. The following prohibited alternatives were not used:

- SQL Editor
- direct PostgreSQL connection
- service-role access
- `SET ROLE`
- RLS bypass
- token extraction
- `DATABASE_URL` or credential-bearing dump output
- migration repair or schema mutation

## Gate results

| Gate | Result | Reason |
|---|---|---|
| Migration history | BLOCKED | No current complete approved history export/attestation |
| Dependency definitions | BLOCKED | No approved complete schema metadata channel |
| Attendance migration readiness | BLOCKED | Gates above are prerequisites; no execution decision is possible |

## Root cause

The required evidence capability is unavailable. Reusing earlier partial dashboard observations would overstate certainty and would not satisfy the CTO standard for `DB-EVIDENCE-006`.

## Safety decision

No migration history was repaired, no migration was marked applied, no schema was changed, and no database connection or privileged path was used. The Staging database, Production environment, and repository migrations remain unchanged.

## External unblock required

Provide one of the following outside this execution path:

1. An approved, sanitized, read-only migration-history and schema-definition export for Staging; or
2. An approved Operations/Platform capability that returns the required metadata without credentials, PostgreSQL-role access, student data, or mutation.

After the evidence is supplied, the CTO must issue a separate decision for `DB-HISTORY-ALIGN-002` or reopen `ATTEND-MIGRATION-001`. No downstream attendance mission may start before that decision.
