# DB-HISTORY-ALIGN-001 — Failure RCA

## Root cause

The Staging schema contains the expected 47 public table names, while the official migration channel reports the full ten-migration set as pending. The available read-only surfaces cannot prove that the live definitions are equivalent to the Git SQL or reveal complete constraint/policy text.

## Why the mission stopped

The CTO order requires migration-by-migration evidence before any baseline history alignment. The available evidence supports object presence and limited RLS visibility, but not schema equivalence or execution provenance. Classifying the migrations as applied would be an unsupported inference.

## Risk of proceeding

Registering the baseline without proof could hide schema drift. Replaying the baseline could fail on existing relations or alter objects outside the approved scope. Automatic repair would create an irreversible history decision without a verified definition comparison.

## Safe recommendation

Keep the migration history unchanged. Obtain a supported, read-only schema-definition export/diff channel that does not print credentials, or have the CTO explicitly approve an independently verified baseline attestation. Until then, do not run `db push`, `migration repair`, `--include-all`, SQL Editor, direct Postgres, or any schema mutation.

## Security and environment

- Staging only was inspected.
- Production was not accessed or changed.
- The short-lived forensics token was revoked after use.
- No credentials are stored in this repository or in this RCA.
