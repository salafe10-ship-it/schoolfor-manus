# DOC-005 Security and Contract Review Report

## Mission

- Mission ID: `DOC-005`
- Scope: Student Documents code-level security and contract hardening
- Environment: Local and Staging build validation only
- Production: forbidden and untouched
- Database, migrations, RLS, roles, and platform authorization infrastructure: not modified

## Decision

`DOC-005 = PASS — CODE-LEVEL SECURITY/CONTRACT HARDENING CERTIFIED`
`DOC-004 = PARTIALLY CERTIFIED / EVIDENCE BLOCKED` remains unchanged because live Operations/database evidence is unavailable.

## Review Matrix

| Area | Result | Evidence |
| --- | --- | --- |
| Document Service validation | PASS | `src/modules/student-documents/application/StudentDocumentService.ts:33-154` validates identifiers, dates, classifications, lifecycle values, file metadata, retention, pagination, and idempotency headers before repository work. |
| Trusted context propagation | PASS | `server.ts:717-726` constructs the module context from the trusted request tenant context and server-generated request/correlation values; request body metadata is not merged into identity context. |
| Authentication and API authorization handoff | PASS | Every Student Documents route at `server.ts:733-809` uses `authenticateRequest` followed by one registered `StudentDocument.*` permission. |
| Tenant/school/branch reads | PASS | Repository reads at `src/modules/student-documents/infrastructure/StudentDocumentRepository.ts:153-165, 230-327` apply trusted tenant, school, and branch scope. |
| Tenant/school/branch writes | PASS | Document and version updates now include tenant, school, branch, identifier, and optimistic version predicates at `StudentDocumentRepository.ts:398-426`. |
| Actor identity | PASS | `resolveInternalActorUserId` resolves only an active internal user linked to the trusted tenant and compatible school/branch scope at `StudentDocumentRepository.ts:125-138`. |
| Transaction boundary | PASS | Service operations use the request-scoped `UnitOfWork` at `StudentDocumentService.ts:156-177`; repository access rejects execution without an active transaction at `StudentDocumentRepository.ts:9-15`. |
| Audit and outbox atomicity | PASS | Mutation flows enqueue audit, business, access-log, and outbox work through the same UnitOfWork. No new transaction architecture was introduced. |
| Lifecycle transitions | PASS | Verification and rejection are now limited to `pending_verification`; repeated expiry is rejected. A new version after rejection/expiry returns the document to `pending_verification` when verification is required. |
| Version integrity | PASS | Current-version replacement remains ordered inside the same transaction, and version creation retains optimistic document version control. |
| Legal hold and retention | PASS | Archive and expiry continue to enforce legal hold, retention date, and archive eligibility checks. |
| Idempotency | PASS | Keys are namespaced by operation and resource before storage, preventing a key used by category creation from returning a document operation result. Same-operation retries continue to return the stored result. |
| Legacy fallback in canonical path | PASS | The canonical portal and API use `src/modules/student-documents/**`. The older `src/database/repositories/StudentDocumentRepository.ts` and `FallbackStorage` references remain outside the canonical path and were not deleted or changed. |
| Live database, RLS, cross-tenant, and cleanup proof | EVIDENCE BLOCKED | DOC-EVIDENCE-001 closed this gate because no approved Operations capability exists. No forbidden workaround was used. |

## Defects Corrected

1. Verification could be requested from a draft, already verified, or other non-pending lifecycle state. The service now rejects those transitions.
2. Approval/verification could be submitted without a reason through a direct API call. All decisions now require the same server-side validation of a non-empty reason.
3. Adding a version to a rejected or expired document did not return it to the review lifecycle. New versions now return to `pending_verification` whenever verification is required.
4. Document and version update statements did not repeat school and branch predicates. They now enforce the complete trusted scope at write time as defense in depth.
5. Internal actor resolution accepted any active user in the tenant. It now additionally requires compatible school and branch scope, while retaining support for tenant-wide actors.
6. Idempotency keys were tenant-global but operation-agnostic. They are now namespaced by operation and resource without a schema change.

## Deliberately Unchanged

- `PermissionRegistry`, `RoleResolver`, `AuthorizationEngine`, `TenantEngine`, `UnitOfWork` implementation, RLS, migrations, database roles, and Production configuration.
- Binary storage, OCR, scanning, malware detection, and external providers.
- The legacy repository used by unrelated student lifecycle/constraint code. It is documented as a remaining technical-debt boundary, not silently removed.

## Remaining Risks

- Live mutation, database-state, RLS, cross-tenant, rollback, and cleanup evidence remains blocked until an approved Staging Operations capability is provided.
- Same-operation idempotency intentionally returns the original stored result; a conflicting payload fingerprint policy is not part of the current endpoint contract.
- The legacy student lifecycle constraint path still reads fallback document records outside the canonical Student Documents API and requires a separately approved migration mission if it is to be retired.
