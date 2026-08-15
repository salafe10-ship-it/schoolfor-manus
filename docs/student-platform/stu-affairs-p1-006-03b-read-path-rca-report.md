# STU-AFFAIRS-P1-006-03B-RCA — CANONICAL STUDENT READ DATA-PATH

## Final status

`BLOCKED / EVIDENCE INSUFFICIENT — SAFE SERVER TRACE REQUIRED`

## Deployment

- Environment: Render Staging only.
- Service: `edupro-school-erp-staging`.
- Branch: `codex/sop-001-staging`.
- Commit: `c3c9a4cd616a6d092d382bfd53a79e6dea3e59de`.
- Deployment ID: `dep-d9u4fq8ae00c73bk7v30`.
- Render status: `Deploy succeeded`.
- Staging URL used for the fresh-session check: `https://edupro-school-erp-staging.onrender.com/?release=c3c9a4c`.

## Expected request path

```text
StudentAffairsPortal
  -> StudentRepository.list
  -> GET /api/students
  -> authenticateRequest
  -> Student.Read permission check
  -> request-scoped UnitOfWork
  -> TenantEngine resolution and validation
  -> StudentService.advancedSearch
  -> CanonicalStudentReadRepository
  -> PostgreSQL transaction query
  -> Student grid
```

The source confirms that the client repository calls `GET /api/students`, the endpoint requires authentication and `Student.Read`, and the endpoint enters a request-scoped transaction before resolving trusted tenant context and calling the canonical repository.

## Live Staging evidence

| Evidence | Result |
|---|---|
| Fresh application shell | PASS |
| Student Affairs dynamic import | PASS; the fresh session rendered the reviewed screen and showed `تصدير XLSX` |
| Student Affairs screen | PASS |
| Student Read result | FAIL; the grid showed `فشل جلب بيانات الطلاب من الخادم` and zero records |
| Client safe log | Warning surfaced as `فشل جلب بيانات الطلاب من الخادم` at approximately 10:21:40 UTC |
| Render database connection | PASS; the deployed server logged PostgreSQL connection established and `Supabase linked!` |
| Render transaction evidence | The application logged `Rolling back transaction uow_tx_1786530100584_1688...` at 10:21:41 UTC, followed by `Transaction ... rolled back successfully.` |
| Safe diagnostic trace | NOT OBSERVED in the Render log stream; no stage/classification line was exposed for this request |
| Export request | Not executed, as required by the consultant order |

## Layer determination

- **Browser/UI:** reached Student Affairs successfully; no dynamic import error in the fresh session.
- **Request route:** strongly evidenced as reached because a request-scoped UnitOfWork transaction was rolled back at the same time as the grid failure.
- **Authentication:** not independently certified for this specific request; the browser was already authenticated.
- **Student.Read authorization:** not independently certified because the live client does not expose the response status or permission decision.
- **Tenant context:** not independently certified because the live client does not expose the trusted-context decision or reason.
- **StudentService/repository:** not independently certified because the server exposes only the normalized public error and Render logs expose the rollback, not the safe internal classification.
- **PostgreSQL/RLS:** not ruled out. The server connection succeeds, but no database/RLS inspection or SQL execution was authorized for this RCA.
- **Response contract:** the client collapses every non-2xx response into the same Arabic message, so the exact HTTP status, trace ID, request ID, and correlation ID were not visible in the live evidence.

## Root cause

The verified boundary is:

`GET /api/students` reaches the deployed service and fails before a successful Student Read response is produced; the request-scoped transaction is rolled back.

The exact failing layer and root cause are **not proven** by the available safe evidence. It would be unsafe to classify this as an authentication, authorization, tenant, repository, schema, or RLS defect without a server-side safe trace or an approved database/RLS verification.

## Reproduction

1. Open a fresh Staging session with the reviewed deployment SHA.
2. Enter the Student Affairs screen.
3. Observe that the screen renders with `تصدير XLSX`.
4. Observe the student grid error `فشل جلب بيانات الطلاب من الخادم` and zero records.
5. Correlate the approximate time with Render logs: transaction rollback followed by successful rollback completion.

## Required evidence to unblock

Operations must provide a non-sensitive server-side trace for one controlled request containing only:

- request path and HTTP status;
- safe error code;
- request/correlation ID, if already emitted;
- whether authentication completed;
- whether `Student.Read` authorization completed;
- whether trusted TenantContext resolution completed;
- whether `StudentService` was entered;
- whether `CanonicalStudentReadRepository` was entered;
- safe PostgreSQL error classification, without SQL text, credentials, tokens, or student data;
- exact deployment SHA.

If the classification is database or RLS, stop and issue a separate approved database/RLS RCA. If it is a proven local code defect, issue a separate repair order. No repair is authorized by this RCA order.

## Scope and safety

- No files outside this report were modified.
- No application code was changed.
- No SQL or SQL Editor action was performed.
- No database, schema, migration, RLS, RPC, production, permission, tenant, or authentication change was performed.
- No token, password, API key, secret, or student record was collected.

## Decision

`STU-AFFAIRS-P1-006-03B-RCA = BLOCKED / EXACT ROOT CAUSE NOT PROVEN`

`STU-AFFAIRS-P1-006-03C-RCA = RESOLVED / CACHE-VERSION MISMATCH`

## CTO review decision

The report was reviewed and accepted as evidence-complete for the discovery boundary. No repair is authorized. The next authorized activity is:

`STU-AFFAIRS-P1-006-03B-RCA-01 = SAFE SERVER TRACE`

Operations must provide one non-sensitive trace containing the request path, HTTP status, safe error code, stage classifications, and safe PostgreSQL classification. Render log review performed after the report did not expose that trace; it exposed only successful PostgreSQL startup/connection and the transaction rollback pair. The mission remains blocked pending Operations evidence.

## RCA-02 diagnostic-only implementation status

The consultant authorized a narrowly scoped, diagnostic-only trace for Staging. The implementation was prepared in an isolated worktree and passed `TypeScript --noEmit` and `git diff --check`.

- Local diagnostic commit: `c3c9a4cd` (`STU-AFFAIRS-P1-006-03B-RCA-02 - Safe Student Read diagnostics`).
- Files in the diagnostic commit: `server.ts`, `src/database/repositories/CanonicalStudentReadRepository.ts`, and `src/database/services/StudentService.ts`.
- The diagnostic records only stage status, generated request/correlation IDs, HTTP status, and a bounded PostgreSQL classification. It does not record secrets, tokens, SQL text, SQL parameters, student data, or raw database errors.
- The diagnostic commit has not been deployed because the available GitHub HTTPS credential session is unavailable. Official Git returned `SEC_E_NO_CREDENTIALS`; no credential was deleted or changed.
- No Staging, database, RLS, migration, or production state was changed by RCA-02.

`STU-AFFAIRS-P1-006-03B-RCA-02 = DEPLOYED / SAFE TRACE NOT OBSERVED`

The consultant's next order is:

`STU-AFFAIRS-P1-006-03B-RCA-02C = VERIFY STAGING DEPLOYMENT & SAFE TRACE`

The commit is now published through the approved GitHub/Render channel and the Render deployment SHA matches. The controlled Student Read was executed once, but the expected safe stage trace was not observable; only the transaction rollback pair was visible. Credentials must not be sent to the engineer, and no authentication bypass is permitted. The RCA remains blocked until Operations exposes the safe trace or approves a separate evidence method.

## RCA-03 diagnostic observability validation

The source-level review confirms:

- `server.ts` creates the Student Read diagnostic immediately inside the `/api/students` handler, after `authenticateRequest` and `requirePermissionOnly(PERMISSIONS.STUDENT_READ)`.
- The first diagnostic markers are `auth` and `Student.Read`; later markers cover tenant context, tenant validation, StudentService, and PostgreSQL.
- The diagnostic uses `EnterpriseLogger.info` with context `StudentReadRCA` and safe request/correlation metadata only.
- The production logger serializes structured records to stdout when `NODE_ENV=production`.
- The Render deployment page confirms the deployed commit is `c3c9a4cd616a6d092d382bfd53a79e6dea3e59de`.

The live Render log stream showed normal startup, PostgreSQL connection, and the UnitOfWork rollback pair, but did not show even the first `StudentReadRCA` marker for the controlled request. Therefore the current evidence supports only these bounded conclusions:

1. The deployed artifact and source wiring are aligned at the commit level.
2. The diagnostic handler path was not observably entered, or the Render log channel omitted that context.
3. The rollback alone cannot identify authentication, authorization, tenant validation, service, repository, PostgreSQL, or RLS as the failing layer.

No additional logging, code change, database access, SQL, RLS inspection, or repeated Student Read was performed under RCA-03.

`STU-AFFAIRS-P1-006-03B-RCA-03 = BLOCKED / DIAGNOSTIC ENTRY NOT OBSERVED`

## RCA-04 Operations access/request evidence

The available Render evidence was reviewed without generating a new request. The Render Logs surface exposed only `Application logs` for the selected time window. It did not expose an HTTP/access log stream or a record containing the prior request method, path, HTTP status, request ID, correlation ID, or service-instance request trace.

For the existing failed request, the evidence is therefore:

| Requested evidence | Result |
|---|---|
| Request timestamp | Partially observable from the client and rollback timestamps |
| HTTP method/path | `NOT OBSERVABLE` in the available Render surface |
| HTTP status | `NOT OBSERVABLE` in the available Render surface |
| Request/correlation ID | `NOT OBSERVABLE` |
| Service instance | Only the Render application instance is known; request-level instance is `NOT OBSERVABLE` |
| Deployment SHA | `c3c9a4cd616a6d092d382bfd53a79e6dea3e59de` |
| Whether `GET /api/students` reached the application process | `NOT OBSERVABLE` from available access/platform logs |
| HTTP/access records before the application handler | `NOT OBSERVABLE` |

`STU-AFFAIRS-P1-006-03B-RCA-04 = NOT OBSERVABLE / OPERATIONS PLATFORM-EVIDENCE DEPENDENCY`
