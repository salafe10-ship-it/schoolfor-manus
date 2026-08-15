# SCHEMA-EVIDENCE-002 — Capability Report

## Objective

Provide an approved read-only channel for complete Supabase Staging schema definitions without database mutation or credential output.

## Environment check

| Capability | Result |
|---|---|
| Supabase project | Staging `vjcjscqgmijgzagshsca` |
| Official Supabase CLI | Available via bundled Node / pnpm |
| Docker command | Not installed |
| Docker Desktop directory | Not found |
| Supabase CLI schema diff | Requires Docker and unavailable |
| Supabase CLI schema dump | Requires Docker and unavailable |
| Dashboard Table Editor | Available, but definition surface incomplete |
| Database mutation | Not performed |

## Installation attempts

Docker Desktop was permitted by the CTO order as a tooling prerequisite. Two official WinGet installation attempts were made:

1. Default official source: download rejected with HTTP `403 Forbidden` (`0x80190193`).
2. WinGet source: same official download rejected with HTTP `403 Forbidden` (`0x80190193`).

No installer completed and no system component was changed.

## Capability decision

The requested complete read-only schema-definition channel cannot be provisioned in the current environment. The available Dashboard surface can prove object presence and limited table metadata, but cannot export the complete definitions required for migration equivalence.
