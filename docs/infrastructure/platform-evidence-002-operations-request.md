# PLATFORM-EVIDENCE-002 — Operations Request

## Authorization

This request is issued by the project owner for the Staging environment only.

```text
MISSION=PLATFORM-EVIDENCE-002
ENVIRONMENT=STAGING ONLY
PROJECT_REF=vjcjscqgmijgzagshsca
PRODUCTION_ACCESS=PROHIBITED
DATABASE_MUTATION=PROHIBITED
```

## Objective

Generate one sanitized Operations Evidence Artifact that verifies sections C–G
for the real Staging application connection. The artifact must contain metadata
only and must not contain database rows or secrets.

## Required Evidence

### C — Connection Identity

Collect from the actual application database connection:

```text
current_user
session_user
rolsuper
rolbypassrls
rolinherit
rolcanlogin
application_role_confirmed=<YES|NO|UNPROVEN>
```

### D — Migration History

```text
migration_version
migration_name
applied_status
applied_at
```

Explicitly classify:

```text
202608111000_enroll_schema_align_001=<APPLIED|PENDING|UNKNOWN>
```

### E — Schema Inventory

For each target table, collect metadata only:

```text
schema
table
column
data_type
nullable
default
primary_key
foreign_key
unique_constraint
check_constraint
index
index_definition
trigger_or_function_presence
```

### F — RLS Evidence

For each target table:

```text
table
rls_enabled
force_rls
policy_name
policy_role
command
using_expression
with_check_expression
application_role_enforcement=<PROVEN|UNPROVEN>
```

### G — Security Integrity

```text
service_role_used=NO
postgres_used=NO
set_role_used=NO
sql_editor_used=NO
db_mutation=NO
migration_executed=NO
secret_exposed=NO
production_accessed=NO
student_data_exported=NO
```

## Prohibited Actions

- Do not include passwords, `DATABASE_URL`, API keys, JWTs, or tokens.
- Do not include database rows or personal data.
- Do not use SQL Editor, `postgres`, `service_role`, `SET ROLE`, `db push`, or migration repair.
- Do not modify schema, RLS, migration history, roles, or application code.
- Do not access Production.

## Delivery

Return the sanitized artifact through the approved private Operations/Platform
channel. Do not send secrets through chat, email, screenshots, or Git history.

## CTO Gate

After receipt, Engineering will merge sections A–G into:

`docs/infrastructure/staging-evidence-sanitized.md`

The CTO will then issue one decision only:

```text
CERTIFIED
or
BLOCKED + RCA
```
