# INF-004 — Staging PostgreSQL Connectivity Root-Cause Investigation

**Parent:** OPS-003B-R1  
**Mode:** Staging infrastructure diagnostic investigation  
**Production access:** None  
**Mission result:** **READY FOR CTO REVIEW**

## 1. Executive Summary

The Staging service is isolated and starts successfully, but the approved live diagnostic could not acquire a PostgreSQL session through the existing pool/transaction-driver path.

The only proven runtime boundary is:

```text
Staging application startup       PASS
DATABASE_URL configuration        PRESENT
Staging isolation guard            PASS
PostgreSQL pool acquire            FAIL
Transaction-driver session         FAIL
```

The exact underlying cause cannot be safely distinguished between configuration, DNS, network/TCP, PostgreSQL authentication, SSL/TLS, pool handling, or another infrastructure condition because:

- the `DATABASE_URL` value is intentionally hidden;
- its host and port cannot be inspected without exposing connection metadata;
- Render Free does not provide Web Shell access for an in-container network test;
- the temporary diagnostic correctly suppresses connection errors and was removed after OPS-003B-R1.

**Primary failure classification: H — UNKNOWN.** No repair or configuration change was performed.

## 2. Known Facts

- Production service: `edupro-school-erp`, branch `main`.
- Staging service: `edupro-school-erp-staging`, isolated branch `codex/ops-003b-diagnostic`.
- Staging startup repair INF-003 is live and reaches the listener.
- Staging environment exposes a `DATABASE_URL` variable by name; its value is masked.
- The temporary OPS-003B-R1 diagnostic returned:

```text
databaseConfigured: true
stagingIsolation: true
postgresReachable: false
sslVerified: false
poolAcquire: false
poolRelease: false
transactionDriverInitialized: false
environment: staging
```

- `sslVerified=false` is not classified as an SSL failure because the PostgreSQL session was never acquired.
- No business SQL or mutation was executed.

## 3. Staging Target Verification

### Application target isolation

**PASS for the application-level Staging guard.** During OPS-003B-R1, the approved guard matched the configured expected Staging Supabase project reference without exposing its value.

### PostgreSQL target identity

**NOT PROVEN.** The diagnostic result proves only that a database configuration value was present and that the application-level Staging guard matched. It does not prove that the masked `DATABASE_URL` points to the intended Staging PostgreSQL target.

The target cannot be proven safely from the current Free-plan UI without reading or exporting the secret value, which is prohibited by this mission.

## 4. DATABASE_URL Structural Verification

| Check | Result | Evidence |
|---|---|---|
| Variable exists in Staging | PRESENT | Render environment key list shows `DATABASE_URL`; value remained masked |
| Server receives a non-empty value | PRESENT | OPS-003B-R1 returned `databaseConfigured=true` |
| PostgreSQL URL format | NOT VERIFIED | Value is secret and no in-container shell is available |
| Intended Staging target | NOT PROVEN | Host/port/database are not exposed or independently attested |
| Production value inspected | NO | Production was not accessed |

## 5. DNS Result

**NOT REACHED / NOT VERIFIABLE**

The hostname is part of the masked `DATABASE_URL`. Render Shell is unavailable on the Free instance, so no safe in-container DNS test could be run. No hostname was printed, inferred, or copied into source or reports.

## 6. Network/TCP Result

**NOT REACHED / NOT VERIFIABLE**

The diagnostic reached the approved pool acquisition boundary but did not expose a safe TCP category. A direct TCP test requires the masked target host and port or a Staging Web Shell; neither is available under the current access and security constraints.

## 7. PostgreSQL Reachability

**UNREACHABLE from the approved application diagnostic path.**

This means the transaction driver could not establish a usable PostgreSQL session. It does not establish whether the cause is DNS, TCP, authentication, SSL, or pool configuration.

## 8. Authentication Result

**NOT REACHED / UNKNOWN**

No PostgreSQL session was acquired, and no safe authentication error category was exposed by the diagnostic. Credentials were not read, printed, tested separately, or modified.

## 9. SSL/TLS Result

**SSL/TLS NOT REACHED**

The driver could not acquire a session, so the diagnostic did not reach a TLS handshake that could be classified as PASS or FAIL.

## 10. Pool Result

- Pool initialization through the existing approved driver: **FAIL at live session establishment**.
- Pool acquire: **FAIL**.
- Pool release: **NOT REACHED** because no client was acquired.
- Pool settings: **not changed**.

## 11. Transaction Driver Result

**FAIL — live initialization not established.**

The existing `PostgresTransactionDriver` implementation was not modified. No transaction was started and no `BEGIN`, `COMMIT`, `ROLLBACK`, or business query was executed.

## 12. Exact Root Cause Classification

**H — UNKNOWN.**

The evidence proves a failure at or before PostgreSQL pool session acquisition, but it does not safely distinguish:

- invalid or unintended Staging connection configuration;
- DNS resolution failure;
- network/TCP reachability failure;
- PostgreSQL authentication failure;
- SSL/TLS negotiation failure;
- pool/driver connection handling failure.

Selecting one of these categories would be speculation under the current constraints.

## 13. Evidence

### Runtime evidence

- Staging application started and became Live after INF-003.
- OPS-003B-R1 returned safe booleans with `databaseConfigured=true` and `stagingIsolation=true`.
- The same result returned `postgresReachable=false`, `poolAcquire=false`, and `transactionDriverInitialized=false`.

### Platform limitation evidence

- Render environment UI exposes only masked `DATABASE_URL` value.
- Render Shell displayed that Shell Access is unavailable for the Free instance type.
- No safe in-container DNS/TCP/driver error probe could therefore be executed.

## 14. Security Review

- No secret value was printed, exported, copied, logged, committed, or placed in source.
- No connection host, port, username, password, or query parameter was disclosed.
- No Production credential or database was accessed.
- Temporary diagnostic variables and diagnostic code were removed after OPS-003B-R1.
- No permanent diagnostic endpoint remains.

## 15. Production Isolation

**PASS**

- Production remained on `main`.
- Production service and environment were not modified.
- Production database was not accessed.
- All Staging-only configuration used for OPS-003B-R1 was removed.

## 16. Files Modified

By INF-004:

- `docs/infrastructure/inf-004-staging-postgresql-connectivity-report.md` (this report only).

No source file, environment file, migration, schema, SQL script, database object, or deployment configuration was changed.

## 17. Database Changes

None. No SQL, migrations, schema changes, business reads, or business writes were performed by INF-004.

## 18. Configuration Changes

None. The masked `DATABASE_URL` was not changed. No SSL setting, pool setting, Render variable, or Production setting was modified.

## 19. Recommended Remediation

CTO should authorize one of the following controlled options before any repair:

1. Provide a supported, non-secret platform method to attest the Staging `DATABASE_URL` target and perform DNS/TCP diagnostics inside Staging; or
2. Temporarily use a Staging plan/access path that provides Web Shell, without changing the connection value, so safe category-only diagnostics can be run; or
3. Have the infrastructure owner verify the masked Staging connection target and PostgreSQL access externally, returning only safe categories (format, target identity, DNS, TCP, authentication, SSL).

No option should expose or copy the connection string, and no configuration should be changed until the root cause is proven.

## 20. INF-001A Readiness

**BLOCKED.** Live ACID transaction certification cannot begin until PostgreSQL connectivity, pool acquire/release, and approved transaction-driver initialization are proven.

## 21. Mission Status

**READY FOR CTO REVIEW**

INF-004 completed as diagnosis-only. The safe conclusion is `H — UNKNOWN`; no repair, workaround, configuration change, Production access, or progression to INF-001A was performed.
