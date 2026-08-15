# STU-GUARDIAN-001 — Integrity and Security Report

## Required final matrix

| Control | Result | Evidence / interpretation |
|---|---|---|
| Canonical writer | **PASS for composite admission only** | `StudentAdmissionService.createStudent` → `StudentGuardianService.enlistCreateGuardianRelation` → UnitOfWork enlistments. This does not eliminate direct writers. |
| Legacy writers | **FAIL — 6 direct CRUD methods plus fallback path** | GuardianRepository create/update/delete and StudentGuardianRepository create/update/delete; FallbackStorage is an additional persistence path. |
| Guardian relationship semantics | **GAP** | Types support relationship attributes, but the service creates one guardian from legacy fields and does not persist the full father/mother form model. |
| Transaction atomicity | **PARTIAL** | Composite admission is UoW-scoped; direct CRUD and fallback writes are not proven to share the same request-scoped transaction. |
| Tenant scope | **FAIL / PARTIAL** | GuardianRepository filters school only; StudentGuardianRepository omits school/tenant filters; no trusted TenantContext parameter is used by these repositories. |
| Audit | **PARTIAL** | Composite admission enlists an audit record; direct Guardian and StudentGuardian operations have no equivalent audit enlistment. |
| Outbox | **GAP** | No Guardian-specific outbox or domain-event publisher was found. |
| Authorization | **GAP / PARTIAL** | StudentService has a server-execution assertion, but the repositories accept raw school IDs and do not contain Guardian-specific permission enforcement. |
| RLS live evidence | **BLOCKED** | The approved evidence-channel limitation prevents a live policy decision. Source migration text is not proof of deployed state. |
| Schema live evidence | **BLOCKED** | No live schema introspection was available in this mission. |
| Production untouched | **PASS** | No production or database mutation was performed. |

## Cross-tenant risk assessment

The most serious source-level defect is the relationship repository. `schoolId` is accepted by the public methods but is not used in its Supabase `getById`, `getAll`, `update`, or `delete` predicates, and is not used in fallback lookups. The risk remains critical even if a database RLS policy may currently mitigate it; RLS status was not live-verified.

The Guardian repository is safer at the school predicate level, but it still lacks trusted tenant/branch context and can fall back to local storage. School filtering in application code is not a substitute for database isolation.

## Transaction and orphan assessment

The composite admission path records `guardians`, `student_guardians`, and `audit_logs` in its affected-table set and enlists them inside one UnitOfWork. In contrast, direct repository operations invoke `FallbackStorage.performWrite` themselves. The two paths do not establish one canonical write boundary, and no Guardian outbox or compensating invariant was found. This is a release blocker for relationship integrity.

## Data integrity assessment

The service synthesizes national ID, email, occupation, address, and account state. The UI hook also supplies hard-coded fallback national ID, mother name, and guardian email values. These are demo-style defaults in a production-facing domain and must be treated as data corruption risk, not as harmless presentation defaults.

## Certification decision

**BLOCKED + RCA**. No implementation is authorized by this discovery mission.

