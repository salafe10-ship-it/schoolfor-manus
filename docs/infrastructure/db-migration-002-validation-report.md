# DB-MIGRATION-002 — Validation Report

## Preflight

- Target project ref verified: `vjcjscqgmijgzagshsca`
- Target environment: Supabase Staging
- Final dry run: PASS
- Pending migration count: 10
- Pending migration order: exact repository order
- Extra migrations: none
- Database mutation before apply: none

## Apply

- Command: official `supabase db push`
- Result: FAILED at migration `202608051200_core_foundation.sql`
- PostgreSQL error: `42P07 relation "tenants" already exists`
- Migration history after failure: remote versions remained empty in read-only `supabase migration list`
- Migration state: not certified

## Validation Status

| Check | Result |
|---|---|
| Project target | PASS |
| Environment isolation | PASS — Staging only |
| CLI channel | PASS |
| Dry-run migration list | PASS |
| Core migration apply | FAIL — pre-existing `tenants` relation |
| Later migrations | NOT RUN |
| Academic status verification | NOT RUN |
| Enrollment verification | NOT RUN |
| RLS verification | NOT RUN |
| Production impact | NONE OBSERVED |

## Certification

`DB-MIGRATION-002 = BLOCKED + RCA`

No baseline certification is claimed.
