# Enterprise Foundation Database Changelog

**Baseline date:** 2026-08-05  
**Project:** `edupro-school-erp`  
**Project ref:** `bwdjnjbexklsrwqbwzmk`

## Migration history

The controlled execution order was verified as:

1. `202608051200_core_foundation.sql`
2. `202608051300_identity_platform.sql`
3. `202608051400_governance_platform.sql`

All three executions returned `Success. No rows returned`. No Student, Finance, HR, Inventory, or other business-module migration was executed.

The SQL Editor execution evidence records the executions on **2026-08-05**. Identity completed at approximately **13:12**, and Governance at approximately **13:18**. The exact Core execution time was not persisted in a database migration ledger.

## Executed migrations

| Migration | Scope | Tables added | Indexes after migration | Constraints after migration | Validation |
|---|---|---:|---:|---:|---|
| `202608051200_core_foundation.sql` | Core Foundation | 9 | 43 | 85 | Passed |
| `202608051300_identity_platform.sql` | Identity Platform | +9 | 98 cumulative | 191 cumulative | Passed |
| `202608051400_governance_platform.sql` | Governance Platform | +14 | 179 cumulative | 350 cumulative | Passed |

## Core Foundation

Tables:

`tenants`, `subscriptions`, `schools`, `school_settings`, `branches`, `facilities`, `academic_years`, `terms`, `academic_calendar`.

Constraints: 9 primary keys, 12 foreign keys, 15 unique constraints, and 49 check constraints.

Indexes: 43 total after Core execution.

## Identity Platform

Tables:

`users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `sessions`, `trusted_sessions`, `service_accounts`, `api_keys`.

Identity contribution: 9 primary keys, 26 foreign keys, 21 unique constraints, 50 check constraints, and 55 indexes.

The `users` table was verified to reference `auth.users`. No authentication secrets were created by the migration.

## Governance Platform

Tables:

`audit_events`, `audit_change_sets`, `audit_access_events`, `outbox_events`, `workflow_definitions`, `workflow_versions`, `workflow_instances`, `workflow_tasks`, `notification_queue`, `notification_templates`, `feature_flags`, `setting_definitions`, `setting_values`, `system_jobs`.

Governance contribution: 14 primary keys, 37 foreign keys, 21 unique constraints, 87 check constraints, and 81 indexes.

Audit tables received the migration's append-only privilege revocations. No triggers, RLS policies, RPC functions, seed data, views, or materialized views were added.

## Final validation

- Public tables: 32.
- Public indexes: 179.
- Public constraints: 350.
- Primary keys: 32.
- Foreign keys: 75.
- Unique constraints: 57.
- Check constraints: 186.
- Unvalidated constraints: 0.
- Missing expected foundation tables: 0.
- Unexpected public tables: 0.
- Constraint naming violations: 0.
- Index naming violations: 0.
- Governance tables present: 14/14.
- Student migrations executed: none.

## Migration ledger note

No application-owned `supabase_migrations` ledger was found. The objects named `auth.schema_migrations`, `realtime.schema_migrations`, and `storage.migrations` are platform-owned tables and are not evidence of application migration application. Foundation history is therefore certified from the ordered local migration files, successful SQL Editor execution results, and the resulting database object inventory.

