# DOC-001 Failure RCA

## Mission

- Mission ID: DOC-001
- Scope: Student Documents & Attachments Functional Implementation
- Environment: Staging/Development only
- Status: BLOCKED

## Executive Finding

DOC-001 cannot be implemented safely under the approved scope and file restrictions. The authoritative contracts require centralized authorization through the following permissions:

- `StudentDocument.View`
- `StudentDocument.Create`
- `StudentDocument.Verify`
- `StudentDocument.Archive`
- `StudentDocument.AccessLog.View`
- `StudentDocument.Version.Create` where applicable

The certified `PermissionRegistry` does not register these permissions. `AuthorizationEngine` rejects any unregistered permission as `UNKNOWN_PERMISSION`, including for identities whose role has a wildcard permission. DOC-001 explicitly forbids modifying the certified authorization core. Implementing the module with a generic existing permission would violate the approved contracts and would weaken the authorization boundary.

## Direct Evidence

1. `src/authorization/PermissionRegistry.ts` defines the canonical registry from `PERMISSIONS` and legacy aliases. It contains student, finance, exam, inventory, and related permissions, but no `StudentDocument.*` permission.
2. `src/authorization/AuthorizationEngine.ts` normalizes a requested permission and returns `UNKNOWN_PERMISSION` when the registry returns no match before role permissions are evaluated.
3. The canonical EWP-005 migration defines the four required tables and their tenant/school/branch/student scoped keys. The staging verification query returned exactly:

   - `student_document_access_log`
   - `student_document_categories`
   - `student_document_versions`
   - `student_documents`

4. Existing legacy document code is not a safe substitute. `StudentDocumentRepository` uses `FallbackStorage` and does not enforce the required trusted TenantContext scope. `DocumentService` implements a legacy binary upload path and placeholder checksum behavior. DOC-001 forbids reusing or modifying this legacy path.

## Root Cause

The approved DOC-001 contract depends on new domain permissions, while the approved mission boundary forbids changing the certified authorization package. This is a dependency-order conflict between the Student Documents package and the central authorization registry, not an application implementation defect.

## Security Impact

Proceeding without resolving the conflict would require either:

- bypassing centralized authorization;
- trusting a generic permission that does not express the required document actions; or
- modifying the certified authorization core without CTO authorization.

Each option would violate the security contract. No such workaround was implemented.

## Files Modified

Only this RCA was added:

- `docs/student-platform/doc-001-failure-rca.md`

No source code, migrations, RLS, authorization core, production configuration, or database object was modified.

## Required CTO Decision

Issue one bounded follow-up order before DOC-001 implementation:

1. Authorize a narrowly scoped registration of the six `StudentDocument.*` permissions in the certified authorization package; or
2. Amend DOC-001 contracts to use an already registered permission set, with an explicit security review.

The first option preserves the approved contracts and centralized authorization model. After the decision, DOC-001 can resume without changing the database schema or reusing legacy storage code.

## Mission Decision

`BLOCKED`

No implementation, tests, migration, RLS, RPC, UI, or production change was performed.
