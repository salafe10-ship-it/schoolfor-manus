# OPS-004 — Staging Runtime Diagnostic Access Enablement

**Parent:** INF-004  
**Mode:** Operational environment enablement only  
**Production access:** None  
**Result:** **BLOCKED**

## 1. Access Method

The approved diagnostic access options were evaluated:

- **Option A — Staging Runtime Shell:** attempted through the Render Staging service page.
- **Option B — Existing platform diagnostic capability:** no approved capability was available that exposes category-level DNS/TCP/PostgreSQL evidence without secrets.
- **Option C — Infrastructure owner verification:** no external safe evidence was supplied during this mission.

## 2. Staging Isolation

**PASS**

- Service: `edupro-school-erp-staging`.
- Branch: `codex/ops-003b-diagnostic`.
- Production service remains `edupro-school-erp` on `main`.
- No Production deployment, restart, configuration access, or database access was performed.

## 3. Runtime Capability

**BLOCKED**

Render displayed the Staging Shell page, but the runtime modal explicitly reported that Shell is not supported for the current Free instance type and requires an upgraded instance type. The shell prompt could not be used to run a safe in-container diagnostic.

No plan upgrade was performed because it would be a paid external-state change requiring explicit authorization.

## 4. DATABASE_URL Status

- Staging key presence: **PRESENT**.
- Value: **NOT READ**; it remained masked.
- Structural format: **NOT VERIFIABLE** without reading the secret or using an in-container shell.
- Target identity: **NOT VERIFIABLE** from the available non-secret platform view.
- Production value: **NOT INSPECTED**.

## 5. DNS Capability

**NOT VERIFIABLE**

The hostname is contained in the masked Staging `DATABASE_URL`. No Staging Shell or approved platform diagnostic was available to resolve it without exposing the value.

## 6. TCP Capability

**NOT VERIFIABLE**

The target host and port were not exposed, and the Free plan did not provide a Staging Shell for a server-side TCP check.

## 7. PostgreSQL Diagnostic Capability

**NOT AVAILABLE**

The temporary OPS-003B diagnostic was correctly removed after OPS-003B-R1 and cannot be reintroduced under this mission. No new endpoint or source change was authorized.

## 8. SSL Capability

**NOT AVAILABLE**

SSL/TLS cannot be tested until a safe server-side PostgreSQL access method exists. No SSL configuration was inspected or changed.

## 9. Pool Diagnostic Capability

**NOT AVAILABLE**

The existing application diagnostic previously proved pool acquire failure, but it was removed as required. Render Free Shell access is unavailable, so no replacement pool probe can be run in this mission.

## 10. Security Review

- No `DATABASE_URL` value was printed, echoed, exported, copied, logged, committed, or placed in source.
- No host, port, username, password, token, or connection string was disclosed.
- No new diagnostic endpoint was added.
- No source code was modified.
- No database or Production access occurred.

## 11. Production Isolation

**PASS**

- Production remains on `main`.
- Production was not opened for credentials or database comparison.
- No Production deployment, restart, configuration change, or database access was performed.

## 12. Files Modified

By OPS-004:

- `docs/infrastructure/ops-004-staging-diagnostic-access-report.md` (this report only).

No application source, environment file, migration, schema, SQL, or deployment setting was modified.

## 13. Database Changes

None. No SQL, migrations, schema objects, or business data were touched.

## 14. INF-001A Readiness

**BLOCKED**

Live ACID certification cannot begin until a safe Staging runtime diagnostic capability proves the PostgreSQL connectivity layers.

## 15. Mission Status

**BLOCKED — READY FOR CTO REVIEW**

OPS-004 cannot satisfy its success criteria on the current Render Free plan without one of the following explicitly approved next steps:

1. Enable an isolated Staging runtime plan with Shell access; or
2. Provide an existing approved platform diagnostic capability; or
3. Have the infrastructure owner return only safe category-level connectivity evidence without sharing secrets.

No paid upgrade, workaround, code change, configuration change, or Production action was performed.
