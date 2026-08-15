# Enterprise Supabase Foundation

This directory documents the canonical infrastructure boundary for EduPro. It
contains no business schema and does not authorize provisioning a production
database.

## Canonical environment structure

Use one Supabase project for each deployed environment and keep the project
reference in the deployment platform, not in application code.

The environment templates document only these variables:

- `SUPABASE_URL`: canonical project URL.
- `SUPABASE_ANON_KEY`: the only Supabase key permitted to reach the client-side
  application path.
- `SUPABASE_SERVICE_ROLE_KEY`: server/deployment secret only; never expose it
  to React, Vite client bundles, browser storage, or public logs.
- `DATABASE_URL`: pooled database connection for server-side workloads.
- `DIRECT_URL`: direct database connection reserved for administrative and
  migration workflows.
- `JWT_SECRET`: deployment-managed secret where required by server tooling.

`.env.example`, `.env.development.example`, and `.env.production.example` are
templates only. They contain placeholders and must never contain real secrets.

## Deployment flow

1. Create or select the single approved Supabase project for the target
   environment.
2. Configure the six documented variables in the deployment secret manager.
3. Confirm that the client receives only `SUPABASE_ANON_KEY`.
4. Confirm that `SUPABASE_SERVICE_ROLE_KEY` is available only to trusted
   server-side processes when a later approved mission requires it.
5. Link the local Supabase CLI to the approved project only after CTO approval.
6. Apply reviewed migrations through the deployment pipeline.
7. Run verification checks before promoting the release.

No deployment step in this foundation creates tables or production data.

## Migration flow

Migrations belong in `supabase/migrations/` and must be ordered, reviewed, and
applied through the Supabase CLI or an approved CI job. Each migration must be
idempotent where practical and accompanied by verification evidence.

The directory is intentionally empty in this mission. No tables, constraints,
RLS policies, RPC functions, or business schema are being introduced here.

## Seed flow

`supabase/seed.sql` is an intentional no-op placeholder. Seed data must be
non-sensitive, deterministic, environment-scoped, and separately approved.
Production seeding is forbidden unless a later mission explicitly authorizes
it.

## Backup strategy

- Enable Supabase managed backups for the canonical production project.
- Define retention and restore-point requirements before production launch.
- Store encrypted logical exports outside the application repository.
- Test restoration into an isolated project on a scheduled basis.
- Record backup and restore evidence without exposing credentials or personal
  data in logs.

## Boundary rules

- This foundation does not create application tables.
- This foundation does not create RLS policies, storage buckets, RPCs, or users.
- Application code must fail closed when canonical environment variables are
  absent; it must not silently use a service-role key in a client path.
