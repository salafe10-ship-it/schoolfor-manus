# DB-001-NONACC-008 — Application Persistence Error-Semantics Reachability Audit

**Mode:** Static/read-only discovery audit  
**External mutation:** None  
**Scope:** Non-accounting repositories only; Document, Notification, Migration/Seeder and production/database execution excluded by mission contract.

## Executive decision

`DB-001-NONACC-008 = P1/P2 HARDENING REQUIRED`

No live corruption, cross-tenant disclosure or production override was proven by this static audit. However, reachable legacy read paths can return local fallback data after a Supabase query returns an error. The result can be stale, empty, or semantically different from the canonical database result. These paths must be handled by separate bounded implementation missions; no fix is included here.

## Control baseline checked

`FallbackStorage.performRead` and `FallbackStorage.performWrite` fail closed when canonical persistence is required. `FallbackStorage.assertCanonicalPersistence` raises `PERSISTENCE_UNKNOWN` in canonical, staging, or configured-Supabase modes. `StudentRepository` and `CanonicalStudentReadRepository` use this boundary for their canonical student paths. `ConfigurationRepository.getEffectiveConfig` now rethrows read failures rather than converting them to `null`.

## Reachability findings

| Area / repository | Evidence | Semantics after canonical failure | Reachability | Classification |
|---|---|---|---|---|
| Attendance / Employee / Inventory | `AttendanceRepository.ts:98,133`, `EmployeeRepository.ts:86,179,289`, `InventoryRepository.ts:86,125` | Direct local fallback after failed query; write paths are guarded by `assertCanonicalPersistence` from DB-001-NONACC-001 | Used by student/portal services and module components | P1 hardening |
| Student documents | `StudentDocumentRepository.ts:33,55` | Returns fallback record/list after failed Supabase read; writes use `performWrite` | Used by student document service and HTTP handlers | P1 hardening; separate from blocked canonical metadata mission |
| Student contacts/assets/library/medical/transport/uniform accounts | `StudentContactRepository.ts:27,49`, `StudentAssetRepository.ts:33,55`, `StudentLibraryAccountRepository.ts:27,47,69`, `StudentMedicalRecordRepository.ts:35,55,77`, `StudentTransportationRepository.ts:27,47,69`, `StudentUniformAccountRepository.ts:26,46,68` | Direct fallback reads; `performWrite` protects most writes | Invoked by Student services and student-affairs workflows | P1/P2 hardening |
| Student guardians and guardians | `StudentGuardianRepository.ts:70,95`, `GuardianRepository.ts:27,49` | Scope-filtered fallback is still returned after canonical read failure; mutation APIs are blocked at legacy boundary | Student registration/guardian paths are reachable | P1 hardening; tenant filtering does not make stale data authoritative |
| Library / Transportation / Uniform | `LibraryRepository.ts:94,123`, `TransportationRepository.ts:96,128`, `UniformRepository.ts:95,118` | Direct fallback reads and direct fallback writes can return a local record after Supabase errors | Legacy module repositories are reachable from module components | P1 hardening for writes; P2 for reads pending owner scope decision |
| AI / Backup / BI / Integration / MDM / Report / Tenant / User | Each repository returns `FallbackStorage.get...` after a failed or unsuccessful Supabase lookup | `undefined`/record fallback can hide the difference between not-found and persistence failure | Registered in `IoCContainer.ts:76-93` or used by platform services | P2 hardening |
| SecurityRepository | `SecurityRepository.ts:12-22` | Returns `undefined` on client/query failure; `hasPermission` is an explicit unimplemented false | Registered platform repository | P1 review required before security-sensitive reachability |
| WorkflowRepository | `WorkflowRepository.ts:10-25` | Definitions/instances read and writes are fallback-only; no canonical query or persistence error path | Used by `WorkflowService` and registered in `IoCContainer.ts:76` | P1 implementation dependency |
| Monitoring / BackgroundJob | `MonitoringRepository.ts:7-31`, `BackgroundJobRepository.ts:9-29` | Writes use `performWrite`; remaining operations are unimplemented or fallback-only | Registered and used by platform services | P2 bounded follow-up |
| StudentRepository / CanonicalStudentReadRepository / ConfigurationRepository | `StudentRepository.ts:353-426`, `CanonicalStudentReadRepository.ts:270-279`, `ConfigurationRepository.ts:27` | Canonical read failures throw or require canonical persistence; no silent fallback in the audited paths | Reachable | PASS for this mission’s error-semantics control |

## HTTP success-after-failure review

The inspected student document and student registration handlers return `success: true` only after their application service resolves; errors are passed to `next(error)` in the observed handlers (`server.ts:1113-1150`). This does not remove the repository-level risk: a repository may resolve a stale/local value, after which the handler can legitimately emit a successful HTTP response for a non-canonical result. No additional endpoint fix is authorized in 008.

## Empty-result semantics

The following patterns are unsafe in canonical/staging operation when reached after a failed query: `return []`, `{ data: [], count: 0 }`, `return null`, `return undefined`, or a local record from `FallbackStorage`. They conflate “canonical query failed” with “canonical query returned no matching rows”. The static evidence above shows these patterns in the listed repositories.

## Exclusions and limitations

- Accounting repositories were excluded exactly as ordered.
- `DocumentRepository`, `NotificationRepository`, migration and seed code were excluded because they have their own missions or dependency gates.
- No database, staging, production, RLS, RPC or live transaction test was executed.
- Reachability is source-level reachability through imports, services, registered IoC components, or module components; no production traffic trace was available.

## Required disposition

Open separate bounded implementation missions for the P1 read/error-semantic families, starting with student-affairs dependent repositories, then the legacy platform repositories. Each mission must replace silent fallback with an explicit canonical read contract, preserve tenant scope, and add failure-versus-empty tests. Do not combine this with schema, RLS, migration, or production work.
