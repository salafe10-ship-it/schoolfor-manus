# PLATFORM-EVIDENCE-002 — Blocker Report

## Mission

Provide one approved Operations/Platform channel for complete read-only Supabase Staging schema metadata.

## Required metadata

- columns and types
- primary and foreign keys
- unique and exclusion constraints
- check constraints
- indexes
- RLS state and policy definitions
- relevant triggers and functions
- `ck_student_status_transitions_allowed`, including `active → withdrawn`

## Channels checked

| Channel | Result |
|---|---|
| Supabase Dashboard Table Editor | Available but incomplete |
| Official Supabase CLI inventory | Available for names/statistics only |
| Official Supabase CLI diff/dump | Requires Docker Desktop |
| Docker Desktop on host | Not installed |
| Official WinGet installation | Blocked twice by HTTP 403 |
| Approved Operations/Platform connector | Not available in this environment |

## Decision

`PLATFORM-EVIDENCE-002 = BLOCKED — NO APPROVED EVIDENCE CHANNEL`

No database or migration action was taken.
