# Enterprise Foundation Database Baseline

**Baseline date:** 2026-08-05  
**Project:** `edupro-school-erp`  
**Project ref:** `bwdjnjbexklsrwqbwzmk`

## Database statistics

| Measure | Count |
|---|---:|
| Public tables | 32 |
| Public indexes | 179 |
| Public constraints | 350 |
| Primary keys | 32 |
| Foreign keys | 75 |
| Unique constraints | 57 |
| Check constraints | 186 |
| Unvalidated constraints | 0 |
| Total non-system project tables | 67 |

## Project schemas

Persistent schemas observed:

`auth`, `extensions`, `graphql`, `graphql_public`, `pgbouncer`, `public`, `realtime`, `storage`, `vault`.

The observed `pg_temp_42` and `pg_temp_51` schemas are temporary session schemas and are not part of the persistent platform baseline.

Project table distribution:

| Schema | Tables |
|---|---:|
| `auth` | 23 |
| `public` | 32 |
| `realtime` | 3 |
| `storage` | 8 |
| `vault` | 1 |
| **Total** | **67** |

## Extensions

| Extension | Version |
|---|---|
| `pg_stat_statements` | 1.11 |
| `pgcrypto` | 1.3 |
| `plpgsql` | 1.0 |
| `supabase_vault` | 0.3.1 |
| `uuid-ossp` | 1.1 |

## Public platform inventory

The 32 public tables are the approved Core, Identity, and Governance foundation only:

`academic_calendar`, `academic_years`, `api_keys`, `audit_access_events`, `audit_change_sets`, `audit_events`, `branches`, `facilities`, `feature_flags`, `notification_queue`, `notification_templates`, `outbox_events`, `permissions`, `role_permissions`, `roles`, `school_settings`, `schools`, `service_accounts`, `sessions`, `setting_definitions`, `setting_values`, `subscriptions`, `system_jobs`, `tenants`, `terms`, `trusted_sessions`, `user_roles`, `users`, `workflow_definitions`, `workflow_instances`, `workflow_tasks`, `workflow_versions`.

No Student Affairs or Finance tables were found in the public foundation inventory.

## Platform summary

- **Core Foundation:** tenants, schools, branches, facilities, subscriptions, academic years, terms, and calendars.
- **Identity Platform:** trusted application identity references, roles, permissions, sessions, service accounts, and API-key metadata.
- **Governance Platform:** append-only audit structures, outbox events, workflows, notification queues, feature flags, settings, and system jobs.
- **Database engine posture:** UUID-based identifiers, explicit referential integrity, named constraints and indexes, and zero unvalidated constraints.
- **RLS posture:** RLS is not enabled on the foundation tables because it was explicitly outside the approved migration scope. This is a release dependency before client-facing exposure.

## Baseline limitations

The baseline is an inventory and certification snapshot. It does not replace a versioned application migration ledger. The three foundation migrations must be registered in the team's deployment-control process before automated promotion is introduced.

