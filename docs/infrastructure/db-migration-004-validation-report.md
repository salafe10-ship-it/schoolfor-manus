# DB-MIGRATION-004 — Validation Report

| Validation | Result |
|---|---|
| Staging project ref | PASS — `vjcjscqgmijgzagshsca` |
| Read-only scope | PASS |
| Table inventory | PASS — 47 public tables, 3 auxiliary tables |
| Index inventory | PASS — 264 public indexes, 6 auxiliary indexes |
| Migration history inventory | PASS — remote history empty |
| `db diff --linked` | BLOCKED — Docker Shadow DB unavailable |
| linked-to-migrations diff | BLOCKED — Docker Shadow DB unavailable |
| schema-only `db dump` | BLOCKED — Docker prerequisite unavailable |
| Full DDL equivalence | NOT CERTIFIED |
| Constraints and indexes equivalence | NOT CERTIFIED |
| RLS and policy equivalence | NOT CERTIFIED |
| Database mutation | NONE |
| Production impact | NONE OBSERVED |
| Temporary access token | REVOKED |

## Mission Decision

`DB-MIGRATION-004 = BLOCKED — PLATFORM EVIDENCE LIMITATION`

The next action requires either a trusted environment with Docker Desktop and the official CLI, or an approved schema-only introspection channel that does not expose credentials in output.
