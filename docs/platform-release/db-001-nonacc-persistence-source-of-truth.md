# DB-001-NONACC — Non-Accounting Persistence Source-of-Truth Audit

**Mission:** `PROGRAM-RELEASE-P0-002 / DB-001-NONACC`  
**Date:** 2026-08-13  
**Mode:** Static/read-only discovery  
**Database/Production mutation:** None  
**Decision:** `P1/P2 HARDENING REQUIRED — NO DIRECT P0 DATA INTEGRITY FINDING PROVEN`

## Scope

Student Affairs, Student Document metadata, Admissions/Registration, Academic/Classes, Exams/Results, HR/Employee, Inventory, Administration/Settings, Notifications, and other non-accounting repositories using PostgreSQL/Supabase or fallback storage. Accounting business rules and Receipt/Journal/GL/Financial Closing were excluded as ordered.

## Source-of-truth matrix

| Area | Canonical path observed | Fallback/local path observed | Release assessment |
|---|---|---|---|
| Student core | Canonical Student repositories and server Unit of Work exist; DB-002 guards core mutations | Legacy FallbackStorage remains reachable for compatibility/read paths | Core writes hardened; legacy reachability remains P1 containment work |
| Guardian/Student relations | Canonical services/repositories exist for approved workflows | FallbackStorage collections and legacy repositories remain | P1: writer/read parity must be proven per route |
| Student document metadata | `StudentDocumentRepository` uses `FallbackStorage.performWrite`; canonical guard applies in configured environments | Local JSON/localStorage compatibility path exists | P1: tenant scoping and complete canonical metadata contract need proof |
| Admissions/Registration | `StudentAdmissionService` creates a Unit of Work and enlists related records | Fallback collection projection exists when no driver is configured | P1: live server driver and database result must be mandatory for production |
| Exams configuration/results | `ExamsRepository` has Supabase path and guarded `performWrite` | Fallback `exams_database` is used in unconfigured/compatibility mode | P1: read fallback and synthetic configuration require explicit production gate |
| Attendance | `AttendanceRepository` writes directly to Supabase when available | `create`, `update`, `delete`, and `saveBulk` fall back and return success | P1 release blocker: false-success path after canonical failure |
| HR/Employees/Teachers | `EmployeeRepository` queries/upserts Supabase when available | Save/delete methods write FallbackStorage and return data/true after failure | P1 release blocker: canonical failure can become successful local result |
| Inventory | `InventoryRepository` validates, upserts, and deletes Supabase when available | Save/delete methods write FallbackStorage and return data/true after failure | P1 release blocker: same false-success and stale-read risk |
| Notifications | Create uses `FallbackStorage.performWrite` | Inbox reads directly from fallback storage; no canonical read path shown | P1: notification delivery/persistence parity not proven |
| Configuration/Settings | `ConfigurationRepository` uses Supabase and throws on missing client/save errors | No safe canonical fallback; effective-config catches and returns null | P2: failure semantics distinguish missing configuration from database failure |
| Document metadata/DMS | Read attempts Supabase; `saveMetadata` invokes a no-op canonical callback | Fallback callback is also no-op | P1: success semantics are not proven because no actual write is implemented |

## Findings

### P1 — Non-accounting repositories can return success after canonical failure

Evidence:

- `src/database/repositories/AttendanceRepository.ts`: create/update/delete/saveBulk fall back after Supabase errors and return a record/count/true.
- `src/database/repositories/EmployeeRepository.ts`: `saveEmployee`, `saveTeacher`, `deleteEmployee`, and `deleteTeacher` fall back and return success-like values after Supabase failure.
- `src/database/repositories/InventoryRepository.ts`: `save` and `delete` fall back and return success-like values after Supabase failure.

This is a release-blocking persistence risk, but this static audit found no evidence of a live production mutation or confirmed corrupted record. Classification: **🟠 P1 — RELEASE BLOCKING PERSISTENCE RISK**.

### P1 — Read fallback can hide canonical outage or stale state

Several non-accounting reads use FallbackStorage after a missing/unhealthy/error Supabase path. In configured environments DB-002 protects the generic `performRead` path, but direct repository fallbacks and validation helpers remain reachable. Classification: **🟠 P1 — RELEASE BLOCKING PERSISTENCE RISK** until route-by-route canonical enforcement is proven.

### P1 — Document metadata write is not a real canonical write

`DocumentRepository.saveMetadata` invokes `performWrite` with an empty Supabase callback and an empty fallback callback. It cannot be certified as persisted or as correctly failed. Classification: **🟠 P1**.

### P2 — Local compatibility storage is broad and process-wide

FallbackStorage owns many JSON/localStorage collections and initializes/seed-loads them. This can be acceptable for explicitly unconfigured local development, but the boundary is broad and must not be reachable as a production authority. Classification: **🟡 P2 — ACCEPTABLE/DEFERRED TECHNICAL DEBT** only while production gates remain enforced.

## No direct P0 evidence

This mission did not execute mutations or inspect production records. It therefore did not prove data loss, corruption, unauthorized cross-tenant write, or a completed production false-success event. The observed issues remain release-blocking risks, not a proven P0 data-integrity incident.

## Decision

`DB-001-NONACC = P1/P2 HARDENING REQUIRED — NO DIRECT P0 DATA INTEGRITY FINDING PROVEN`.
