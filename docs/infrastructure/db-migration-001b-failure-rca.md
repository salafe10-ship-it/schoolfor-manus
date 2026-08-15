# DB-MIGRATION-001B — Failure RCA

## Root cause

The Staging database contains the Enterprise baseline schema, but the Supabase migration history does not provide a matching applied record for that baseline. The official CLI consequently treats all ten repository migrations as pending.

## Direct evidence

The official read-only preflight (`supabase db push --linked --dry-run`) returned:

- `upToDate=false`
- ten migrations proposed for push
- the target alignment migration listed last, after the nine baseline migrations

The earlier DB-EVIDENCE-005 inspection also showed the Supabase migrations page with no listed migration versions while expected tables already existed.

## Why execution was stopped

Executing `supabase db push` would not apply only the approved alignment migration. It would first attempt to replay the baseline migrations and could fail on existing relations or mutate objects outside the mission scope. The CTO stop condition explicitly prohibits proceeding on migration-history mismatch or baseline re-creation.

## Impact

- `ck_student_status_transitions_allowed` was not changed by this mission.
- `active → withdrawn` remains unverified in the live constraint.
- No production system was touched.
- No schema or migration file was changed.

## Safest next action

The CTO must approve a separate, explicit migration-history reconciliation plan or provide a supported mechanism that can register the known baseline without replaying it. Do not use automatic repair, SQL Editor, direct credentials, `service_role`, or a blind `db push` as a workaround.

## Credential hygiene

A short-lived Supabase CLI access token was created for the preflight and revoked immediately after the preflight completed. No credential is stored in these reports or in the repository.
