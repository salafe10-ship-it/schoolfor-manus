# ENROLL-SCHEMA-ALIGN-002 — Live Staging Report

Date: 2026-08-11  
Environment: Staging only

## Render deployment evidence

- Service: `edupro-school-erp-staging`
- Branch: `codex/sop-001-staging`
- Commit: `d23780d`
- Deploy result: succeeded
- Service URL: `https://edupro-school-erp-staging.onrender.com`

The approved migration artifact is therefore present in the deployed repository revision.

## Supabase Staging evidence

Project: `edupro-school-erp-staging`  
Project ref: `vjcjscqgmijgzagshsca`

Observed dashboard state:

- Project status: Healthy.
- Last migration: No migrations.
- GitHub repository: No repository connected.
- Branches: No branches.
- Database Migrations page: `Run your first migration`.
- Supabase-provided instructions: `supabase link --project-ref vjcjscqgmijgzagshsca` followed by `supabase db push`.

## Live result

The migration was **not applied** to Supabase Staging. Consequently, the live state of `ck_student_status_transitions_allowed` cannot be certified from this workspace.

No SQL Editor execution, manual database mutation, service-role bypass or production action was used.
