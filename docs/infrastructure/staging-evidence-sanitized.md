# Staging Evidence — Sanitized Export

> هذا الملف مخصص لإثبات حالة بيئة Staging فقط.
> يُمنع إدراج كلمات المرور أو مفاتيح Supabase أو JWT أو DATABASE_URL أو أي بيانات فعلية.

## 1. Environment Identity

```text
ENVIRONMENT=staging
SUPABASE_PROJECT_REF=vjcjscqgmijgzagshsca
SUPABASE_PROJECT_URL=https://vjcjscqgmijgzagshsca.supabase.co
SECRETS_REDACTED=true
DATA_REDACTED=true
EXPORT_DATE_UTC=2026-08-11 (time not captured)
EVIDENCE_STATUS=partial-read-only-inspection
```

## 2. Database Connection Identity

```text
DATABASE_TARGET_PROJECT=vjcjscqgmijgzagshsca
DATABASE_ROLE=not-proven
ROLE_SUPERUSER=not-proven
ROLE_BYPASS_RLS=not-proven
ROLE_CREATEDB=not-proven
ROLE_CANLOGIN=not-proven
DATABASE_CONNECTIVITY_VERIFIED=false
DATABASE_CONNECTIVITY_NOTE=health endpoint returned 200 but reported PostgreSQL Simulation Model
DATABASE_ROLE_UI_OBSERVATION=postgres administrative role visible in Supabase Table Editor; not evidence of Render application identity
```

> لا تضع قيمة `DATABASE_URL` أو سلسلة الاتصال أو كلمة المرور هنا.

## 3. Migration History

| Migration | Applied At UTC | Status |
|---|---|---|
| none observed in Supabase Database > Migrations | 2026-08-11 | no migrations shown |

```text
PENDING_MIGRATIONS=not-determinable
MIGRATION_HISTORY_SOURCE=Supabase Dashboard read-only page; page displayed Run your first migration
MIGRATION_HISTORY_STATUS=foundation migration history not proven
```

## 4. Schemas and Extensions

```text
SCHEMAS:
- public (observed)
- complete schema inventory not collected

EXTENSIONS:
- not enumerated
```

## 5. Tables and Constraints

| Table | Primary Keys | Foreign Keys | Unique Constraints | Check Constraints |
|---|---|---|---|---|
| public.student_status_transitions | id (observed) | tenant_id, school_id columns observed; FK targets not verified | not verified | not verified |
| public.subscriptions | not verified | not verified | not verified | not verified |
| public.academic_years | not verified | not verified | not verified | not verified |
| public.schools | not verified | not verified | not verified | not verified |
| public.branches | not verified | not verified | not verified | not verified |

## 6. Indexes

| Table | Index | Definition Summary | Purpose |
|---|---|---|---|
| all project tables | not enumerated | not verified | not verified |

## 7. Row Level Security

| Table | RLS Enabled | Policy | Command | Trusted Identity Source |
|---|---|---|---|---|
| public.student_status_transitions | partial observation: 4 policies shown | policy names/commands not captured | not verified | not verified |
| public.subscriptions | false reported by Supabase Advisor | not applicable | not applicable | not applicable |
| public.academic_years | false reported by Supabase Advisor | not applicable | not applicable | not applicable |
| public.schools | false reported by Supabase Advisor | not applicable | not applicable | not applicable |
| public.branches | false reported by Supabase Advisor | not applicable | not applicable | not applicable |

```text
RLS_CLIENT_TENANT_VALUES_USED=not-verified
RLS_HEADER_VALUES_USED=not-verified
RLS_BODY_VALUES_USED=not-verified
RLS_CURRENT_SETTING_USED=not-verified
```

## 8. Security Validation

```text
ANON_ACCESS_REVIEWED=false
AUTHENTICATED_ACCESS_REVIEWED=false
SERVICE_ROLE_USAGE_REVIEWED=false
CROSS_TENANT_READ_BLOCKED=not-tested
CROSS_TENANT_WRITE_BLOCKED=not-tested
MISSING_TENANT_BLOCKED=not-tested
```

## 9. Evidence Integrity

```text
COLLECTED_BY=Codex read-only browser inspection
COLLECTION_METHOD=Supabase and Render visible dashboard pages; no SQL or secret access
NO_SECRETS_INCLUDED=true
NO_PERSONAL_DATA_INCLUDED=true
NO_DATABASE_DATA_ROWS_INCLUDED=true
```

## 10. Sign-off

```text
PREPARED_BY=Codex
REVIEWED_BY=not reviewed by Platform Operations
REVIEW_STATUS=draft — external owner evidence required
```

## 11. Explicit Blocker

The current inspection does not prove the Render application's real PostgreSQL
target, connection role, migration history, complete schema, or complete RLS
policy set. This file is intentionally not a certification. Platform Operations
must replace the `not-proven` and `not-verified` values using an approved
read-only evidence export, without adding secrets or database rows.

## 12. Local / Git Evidence Collected by Engineering

```text
GIT_BRANCH=codex/sop-001-staging
GIT_HEAD=de65afee82ed9c2d70b73ec4b45f84a194cf1dd3
GIT_REMOTE_SYNC=branch matches origin/codex/sop-001-staging at collection time
RENDER_SERVICE=edupro-school-erp-staging
RENDER_ENVIRONMENT=staging
RENDER_BRANCH=codex/sop-001-staging
RENDER_LATEST_DEPLOYMENT_COMMIT=de65afe
RENDER_LATEST_DEPLOYMENT_STATUS=live
```

Migration files present in Git (presence in Git does not prove remote execution):

```text
202608051200_core_foundation.sql
202608051300_identity_platform.sql
202608051400_governance_platform.sql
202608051500_student_platform_foundation.sql
202608051600_guardian_platform.sql
202608051700_enrollment_engine.sql
202608061000_academic_status_engine.sql
202608061100_student_documents_platform.sql
202608081700_db_sec_003_rls.sql
202608111000_enroll_schema_align_001.sql
202608111200_attend_schema_001.sql
```

```text
LOCAL_DATABASE_MUTATION_PERFORMED=false
PRODUCTION_ACCESSED=false
SECRETS_READ=false
```

The following remain Operations-only evidence: actual application connection
identity, remote migration history, live schema equivalence, live RLS policy
definitions, and enforcement through the application role.
