# GUARDIAN-EVIDENCE-003 — Failure RCA

## Mission status

`GUARDIAN-EVIDENCE-003 = BLOCKED — NO APPROVED EVIDENCE CHANNEL`

No SQL was executed, no data was changed, and no schema or migration was modified.

## Mission scope

The mission requested a read-only staging evidence package for `student_guardians` containing:

- table existence and column metadata;
- constraints and indexes;
- RLS/policy metadata;
- distinct `relationship_type` values with counts;
- any existing representation of Financial Liability.

No student names, guardian contact data, or other PII was required.

## Evidence-gate requirements from CTO

The only acceptable channel must be:

- staging only;
- read-only;
- an approved Operations channel;
- not PostgreSQL role access;
- not `service_role`;
- not `SET ROLE`;
- not RLS bypass;
- not token extraction;
- not SQL mutation;
- not migration-history or schema mutation.

## Inspection result

The currently available Supabase dashboard exposes a Table Editor for the staging project. The inspected Table Editor surface identifies its active database role as `postgres`. That makes it unsuitable for this evidence gate, even when used only for viewing. It is not an approved Operations evidence channel under the CTO decision.

No other authorized read-only Operations connector or evidence export is available in the current workspace. Repository migration files and prior reports can prove intended schema, but cannot prove the current live schema, row values, or current counts.

## Why the evidence is insufficient

Without an approved channel, the following remain unverified:

1. Whether `student_guardians` exists in the target staging database.
2. Its current columns, constraints, indexes, and policies.
3. The actual distinct `relationship_type` values and counts.
4. Whether legacy values such as `parent` are present.
5. Whether Financial Liability is represented elsewhere.
6. Whether any conversion can preserve all existing data.

Using the visible Table Editor despite its `postgres` role would violate the mission’s evidence rules and would not establish a defensible production migration basis.

## Safety decision

- No migration was written or executed.
- No SQL Editor, service-role credential, token extraction, role escalation, or RLS bypass was used.
- No database, RLS, authentication, authorization, Tenant Engine, or Production configuration was changed.
- `GUARDIAN-SCHEMA-002` must not start.
- `GUARDIAN-003R` must not start.

## Required unblock

Provide one approved staging-only Operations evidence channel that returns metadata and aggregated relationship values without PostgreSQL-role access, service-role access, SQL mutation, or sensitive data exposure. The output must be retained as a review artifact with timestamp, target project, and execution identity.

After that evidence is approved, the CTO can issue `GUARDIAN-SCHEMA-002` for a data-based migration design.

## Validation

- Scope check: PASS — only this RCA was added.
- SQL execution: NONE.
- Database mutation: NONE.
- Production mutation: NONE.
- `git diff --check`: PASS.
- Secret scan: PASS.

## Final decision

`GUARDIAN-EVIDENCE-003 = BLOCKED — NO APPROVED EVIDENCE CHANNEL`.
