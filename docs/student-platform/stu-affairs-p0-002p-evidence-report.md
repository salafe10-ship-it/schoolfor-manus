# STU-AFFAIRS-P0-002P — Security/Operations Evidence Report

## Mission

**Mission ID:** `STU-AFFAIRS-P0-002P-EVIDENCE-001`  
**Environment:** Staging only  
**Scope:** Evidence collection for the future `TransferOperation` security gate  
**Collection mode:** Read-only repository, Git, Render deployment metadata, and existing sanitized reports  
**Production:** Not accessed  
**Database mutation:** None  
**Secrets:** Not read or recorded

## Executive Decision

`STU-AFFAIRS-P0-002P = BLOCKED / EVIDENCE PENDING`

The available evidence proves that the intended Staging commit was deployed and
that the application reached Supabase successfully. It does **not** prove the
actual PostgreSQL role used by the live application connection, owner or
`BYPASSRLS` exclusion, final `FORCE RLS` approval, transfer claim/reconcile
authority, purge authority, retention windows, or legal-hold policy.

No value has been inferred from a design migration, a SQL Editor role, or an
older diagnostic report. The next migration gate (`P0-002Q`) remains closed.

## Evidence Provenance

### Directly observed during this mission

- Git branch: `codex/sop-001-staging`.
- Git HEAD and remote branch: `2a909d1b86d35853bfbe98198701f775bee2cdf2`.
- Render service: `edupro-school-erp-staging`.
- Render branch: `codex/sop-001-staging`.
- Render deployment for commit `2a909d1b`: Auto-Deploy, `live`.
- Render log messages: build successful, database connection established,
  `Supabase linked`, server listening, and service live.

These observations establish deployment and runtime connectivity only. They do
not expose `current_user`, `session_user`, role attributes, or live RLS policy
enforcement.

### Repository and existing evidence reviewed

- `docs/infrastructure/staging-evidence-sanitized.md`
- `docs/infrastructure/platform-evidence-002-operations-request.md`
- `docs/infrastructure/platform-evidence-002-closure-report.md`
- `docs/student-platform/stu-affairs-p0-002o-role-decision.md`
- `docs/student-platform/stu-affairs-p0-002o-force-rls-decision.md`
- `docs/student-platform/stu-affairs-p0-002o-retention-decision.md`
- `docs/student-platform/stu-affairs-p0-002o-security-gate.md`
- `docs/student-platform/stu-affairs-p0-002o-validation-report.md`
- `docs/performance/perf-010-auth-tenant-forensics.md`
- `supabase/migrations/202608081700_db_sec_003_rls.sql`

## A–G Evidence Decision

| Item | Required conclusion | Status | Evidence conclusion |
|---|---|---|---|
| A. Application role | Actual role used by Staging | **UNPROVEN** | Render deployment metadata does not expose the database session role. The sanitized artifact records `DATABASE_ROLE=not-proven`; the existing role decision records no proven role switch. |
| B. Owner / `BYPASSRLS` exclusion | Actual application path is neither owner nor `BYPASSRLS` | **UNPROVEN** | No current application-connection evidence contains `current_user`, ownership, `rolsuper`, `rolbypassrls`, or membership attributes. |
| C. `FORCE RLS` | Final Security decision and live state | **UNPROVEN / NOT APPROVED** | The existing Security decision explicitly records `FORCE RLS: NOT APPROVED`. No live table-level `relforcerowsecurity` evidence is available. |
| D. Claim / reconcile | Authorized service boundary and permissions | **UNPROVEN** | Design documents define a conditional service/worker boundary, but no approved Operations/Security artifact proves the deployed authority or permissions. |
| E. Purge | Named authority and restricted execution path | **UNPROVEN** | Existing decision documentation states purge is not implemented and requires Operations/Security approval. |
| F. Retention | Committed, failed, retry, and reconciliation windows | **UNPROVEN** | Existing decision documentation intentionally supplies no durations; no Product/Operations approval artifact was found. |
| G. Legal hold | Approved precedence and release policy | **UNPROVEN** | Legal hold is identified as a required policy, but no approved owner artifact proves its precedence, release process, or enforcement. |

## Supporting Findings

### Application role and owner boundary

The repository contains an intended `edupro_staging_app` role in the DB-SEC-003
design migration. That is a design declaration, not proof that the deployed
Render connection uses it. The earlier sanitized evidence also records the
database role and connectivity as not proven. A previous performance report
records `edupro_staging_app.rolbypassrls=false`, but it does not establish that
the current Render pool connection authenticated as that role. It is therefore
insufficient to close A or B.

### RLS and trusted context

The repository contains RLS design material and application fail-closed context
handling. Those artifacts support the approved design direction, but they do
not establish live policy expressions or application-role enforcement. No RLS
change was made in this mission.

### Transfer authority and retention

The existing P0-002O decisions are explicit that claim/reconcile authority,
purge authority, retention durations, and legal hold remain external
Security/Operations/Product decisions. No safe engineering inference can
replace those approvals.

## Security Boundary

The following actions were not performed:

- SQL Editor access or SQL execution.
- Use of `postgres`, `service_role`, `SET ROLE`, or credentials.
- Token, password, `DATABASE_URL`, or API-key extraction.
- Database, schema, migration, RLS, role, or permission mutation.
- Production access.
- Student data export.

## Final Recommendation

Keep `P0-002Q — TransferOperation Schema + RLS Migration` blocked. Request one
sanitized Operations/Security artifact containing only the non-secret A–G
metadata required by `docs/infrastructure/platform-evidence-002-operations-request.md`.

If the artifact proves all A–G items, issue `P0-002P = READY FOR CTO REVIEW`.
If any item remains unproven, retain the gate as blocked and name only the
remaining owner and evidence gap.

**Mission status:** `BLOCKED — SECURITY/OPERATIONS EVIDENCE PENDING`
