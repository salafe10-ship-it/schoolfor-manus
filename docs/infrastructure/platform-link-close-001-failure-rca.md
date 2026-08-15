# PLATFORM-LINK-CLOSE-001 — Failure RCA

## Mission status

`MASTER MISSION BLOCKED — EXTERNAL OWNER ACTION REQUIRED`

The platform-link closure cannot be certified yet. The work stopped at the first failed hard gate and no downstream migration, RLS, or Production action was performed.

## Phase results

### Phase A — Baseline

`PASS — local identity is consistent`

- Git branch: `codex/sop-001-staging`.
- Current commit: `253e2dd52004a75bbf41ccf9754fd86df7a9f9b5`.
- Origin: `salafe10-ship-it/edupro-school-erp`.
- Local Supabase link reference: `vjcjscqgmijgzagshsca`.
- Target Supabase project: `edupro-school-erp-staging`.

### Phase B — Render identity

`PASS — service identity and repository branch visible`

- Render service: `edupro-school-erp-staging`.
- Service ID: `srv-d9rdjiqjnfac73ffo3l0`.
- Service URL: `https://edupro-school-erp-staging.onrender.com`.
- Render repository: `salafe10-ship-it / edupro-school-erp`.
- Render branch: `codex/sop-001-staging`.
- Environment key names visible in Render: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, plus diagnostic flags.
- `DIRECT_URL` was not listed.
- Secret values were not revealed, copied, or recorded.

### Phase C — Supabase identity

`PASS — target project identity visible`

- Project name: `edupro-school-erp-staging`.
- Project reference: `vjcjscqgmijgzagshsca`.
- Project URL: `https://vjcjscqgmijgzagshsca.supabase.co`.
- Dashboard status: Healthy.
- Database region: West EU (Ireland).

### Phase D — Deployment and health

`PARTIAL — public application health passes; database connectivity is not certified`

The public GET request to `/api/health` returned HTTP 200 and `status=healthy`. However, the same response identifies the architecture as:

`Express.js + React Vite SPA + PostgreSQL Simulation Model`

Therefore the health result proves service availability only. It does not prove that the running service acquired a live PostgreSQL connection from `DATABASE_URL`, used the intended Supabase target, or used a restricted non-bypass database role.

### Phase E — Evidence channel

`BLOCKED — SCHEMA/MIGRATION EVIDENCE GATE`

The Supabase dashboard currently shows:

- `Last migration: No migrations`.
- `Recent branch: No branches`.
- `33` Advisor issues.
- Critical `RLS Disabled in Public` findings for at least `public.subscriptions`, `public.academic_years`, `public.schools`, and `public.branches`.

The available dashboard surfaces do not provide the complete sanitized migration-history and schema-definition matrix required by the CTO order. No approved Operations/Platform metadata channel is available in this execution environment.

The following prohibited paths were not used: SQL Editor, direct PostgreSQL, `postgres`, `service_role`, `SET ROLE`, RLS bypass, token extraction, credential-bearing dumps, migration repair, `mark-as-applied`, `db push`, or database mutation.

## Root cause

The Render service is reachable and points to the intended repository branch, but the available evidence cannot prove a live PostgreSQL connection or reconcile Git migrations with the existing Supabase schema. Supabase also reports an empty migration history and critical RLS gaps. Proceeding would violate the hard gates and could create unsafe schema or tenant-isolation state.

## No changes performed

- Render variables: unchanged.
- Supabase schema: unchanged.
- Migration history: unchanged.
- RLS: unchanged.
- Production: untouched.
- Git migrations: unchanged.

## Required owner action — one approved path

The owner/Operations team must provide one of these, outside the chat and with secrets removed:

1. A sanitized, read-only Operations export containing current migration history, schema definitions, constraints, indexes, RLS state/policies, and connection-role metadata; or
2. An approved read-only Operations/Platform capability that returns the same metadata without SQL Editor, administrative PostgreSQL access, service-role access, student data, or mutation.

If the approved CLI channel requires authentication, configure `SUPABASE_ACCESS_TOKEN` as a secret in the approved execution/CI environment only. Never paste it into chat, Git, screenshots, reports, or logs.

## Resume criteria

Reopen `PLATFORM-LINK-CLOSE-001` only after the evidence proves:

1. The live Render process uses the intended Supabase Staging project.
2. The application connection role is non-superuser and non-bypass.
3. Migration history, Git migrations, and live schema are reconciled without blind replay or manual marking.
4. Required migrations can be applied in Staging only.
5. RLS and cross-tenant/cross-branch deny tests pass.
6. Audit, outbox, rollback, fixture cleanup, and final health checks pass.

Until then, do not start another evidence or connectivity mission for the same blocker and do not proceed to the remaining business modules.
