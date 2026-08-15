# DB-MIGRATION-004 — Security Object Report

## Scope

Read-only verification of RLS, policies, grants, triggers, functions, and related security objects in Staging.

## Result

The approved CLI paths available in this environment did not return full security-object definitions:

- `db diff` was blocked by missing Docker Shadow Database.
- `db dump` was blocked by the same Docker prerequisite before a schema file was produced.
- `inspect db` supplied table/index operational metadata but not RLS policy definitions or grants.

Therefore the following remain unverified:

- 15/15 expected DB-SEC-003 RLS-enabled tables;
- 46 expected policies;
- policy roles and expressions;
- immutable grants/revocations;
- function/trigger/view inventory;
- whether any policy uses an unsafe tenant source.

## Security Decision

No RLS certification is claimed. No security object was changed.

## Credential Follow-up

The temporary introspection access token was deleted after the blocked attempt. The Staging database password printed by the CLI dry-run should be rotated by the project owner.
