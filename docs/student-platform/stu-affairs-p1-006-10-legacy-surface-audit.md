# STU-AFFAIRS-P1-006-10 — Student Affairs Legacy Surface Audit

## Scope and rule

This is a discovery-only audit. No component, route, repository, service, database object, fallback store, or test was deleted or modified. The purpose is to prevent an old surface from being reactivated accidentally.

## Canonical surface

| Surface | Evidence | Classification | Risk |
|---|---|---|---|
| `src/components/StudentAffairsPortal.tsx` | Imported by the application shell and contains the current Student Affairs command center | CANONICAL | Primary UI surface |
| `src/components/student-affairs/repository/StudentRepository.ts` | Called by the active portal for student list, write, lifecycle, transfer, and export paths | CANONICAL | Must remain behind server authorization/tenant flow |
| `src/modules/student-documents/presentation/StudentDocumentsPortal.tsx` | Imported by the active portal; uses `/api/student-documents*` metadata lifecycle routes | CANONICAL | Metadata-only; binary storage is not implemented |
| `src/modules/student-documents/application/StudentDocumentService.ts` | Server-side canonical document service with request-scoped transaction, audit, outbox, idempotency, and scope checks | CANONICAL | Do not bypass |
| `src/database/repositories/StudentDocumentRepository.ts` | Server-side tenant/school/branch-scoped document repository | CANONICAL | Do not replace with browser writes |
| `server.ts` Student Affairs routes | Active authenticated and permission-guarded routes | CANONICAL | Student Read remains platform-observability blocked |

## Legacy and alternate UI inventory

| File/surface | Active import found | Observed behavior | Classification | Risk/decision |
|---|---:|---|---|---|
| `src/components/student-affairs/StudentAffairsHeader.tsx` | No | Older header callbacks, including print/export/import contracts | DEAD-CODE CANDIDATE / REQUIRES-OWNER-DECISION | Do not reactivate without canonical route review |
| `src/components/student-affairs/StudentSearchPanel.tsx` | No | Older search panel; contains per-row `Promise.all` delete flow and direct fetch path | LEGACY-BLOCKED | High risk if reactivated; must not be used for bulk operations |
| `src/components/student-affairs/StudentTimeline.tsx` | No | Alternate timeline presentation with local event input and print action | LEGACY-BLOCKED | Active portal now owns server timeline loading |
| `src/components/student-affairs/StudentActivities.tsx` | No | Static sample clubs/awards plus notification-only “register” action | NOT_IMPLEMENTED / NOTIFICATION_ONLY | No persistence or API contract |
| `src/components/student-affairs/StudentUniform.tsx` | No | Static sample uniform/fee values; buttons only notify success/info | NOT_IMPLEMENTED / NOTIFICATION_ONLY | False-success risk; no inventory/accounting transaction |
| `src/components/student-affairs/StudentTransport.tsx` | No | Static route/driver/fee values; buttons only notify success/info | NOT_IMPLEMENTED / NOTIFICATION_ONLY | False-success risk; no transport/finance transaction |
| `src/components/student-affairs/StudentLibrary.tsx` | No | Static membership/loan values; button only notifies | NOT_IMPLEMENTED / NOTIFICATION_ONLY | No library persistence or transaction |
| `src/components/student-affairs/StudentMedicalInformation.tsx` | No | Local form state for health fields | LEGACY-BLOCKED | Sensitive data; persistence and permission contract must be verified before use |
| `src/components/student-affairs/StudentGuardianInformation.tsx` | No | Local guardian fields and direct form-state mutation | LEGACY-BLOCKED | Do not bypass canonical Guardian workflow |
| `src/components/student-affairs/StudentAcademicInformation.tsx` | No | Local academic/status controls; notification messages imply save after local mutation | LEGACY-BLOCKED | Must not bypass canonical lifecycle/transition service |
| `src/components/student-affairs/StudentDocuments.tsx` | No | Simulated file pipeline; writes a local `securedDocs` field and announces success | LEGACY-BLOCKED / FALSE-SUCCESS CANDIDATE | Security and integrity hazard; not a storage implementation |
| `src/components/student-affairs/StudentBasicInformation.tsx` | No | Alternate local form section | DEAD-CODE CANDIDATE / REQUIRES-OWNER-DECISION | No active route found |
| `src/components/student-affairs/StudentAdditionalInformation.tsx` | No | Alternate local form section | DEAD-CODE CANDIDATE / REQUIRES-OWNER-DECISION | No active route found |
| `src/components/student-affairs/StudentAddressInformation.tsx` | No | Local address section; map button is notification-only | NOT_IMPLEMENTED / NOTIFICATION_ONLY | No map integration or canonical persistence found |
| `src/components/student-affairs/StudentFeesSummary.tsx` | No | Alternate fees presentation | LEGACY-BLOCKED | Finance boundary must not be bypassed |
| `src/components/student-affairs/StudentProfileHeader.tsx` | No | Alternate profile presentation | DEAD-CODE CANDIDATE / REQUIRES-OWNER-DECISION | No active route found |
| `src/components/student-affairs/StudentStatisticsCards.tsx` | No | Alternate statistics/navigation cards | DEAD-CODE CANDIDATE / REQUIRES-OWNER-DECISION | No active route found |
| `src/components/student-affairs/hooks/useStudentDocuments.ts` | No active import found | Hook stub/alternate path | NOT_IMPLEMENTED | Do not wire without canonical contract |
| `src/components/student-affairs/hooks/useStudentLibrary.ts` | No active import found | Hook stub/alternate path | NOT_IMPLEMENTED | Do not wire without Library contract |
| `src/components/student-affairs/hooks/useStudentTransport.ts` | No active import found | Hook stub/alternate path | NOT_IMPLEMENTED | Do not wire without Transport contract |
| `src/components/student-affairs/hooks/useStudentTimeline.ts` | No active import found | Hook stub/alternate path | LEGACY-BLOCKED | Active portal uses canonical timeline endpoint directly |

## FallbackStorage and auxiliary repositories

`FallbackStorage` is not dead code globally. It remains referenced by broader application/database services and migration code. It is therefore classified as `REQUIRES-OWNER-DECISION`, not safe to remove from this mission.

The Student Affairs-specific auxiliary repositories for library, transport, uniform, and related services contain fallback paths and enlist operations. They are not imported by the active Student Affairs portal in this audit, but they are referenced by broader services. No deletion or migration decision is made here.

## Notification-only and false-success findings

- The legacy `StudentActivities`, `StudentUniform`, `StudentTransport`, `StudentLibrary`, and `StudentAddressInformation` buttons do not call a canonical API.
- The legacy `StudentDocuments` component simulates scanning/compression/upload, writes only to local React state, and emits a success notification. It is not a secure storage path and must not be reactivated.
- The legacy `StudentAcademicInformation` controls locally mutate form state and tell the operator to save; they are not a replacement for the canonical lifecycle/transition services.

## UI buttons and routes

- The active portal’s visible controls are in `StudentAffairsPortal.tsx` and the canonical `StudentDocumentsPortal.tsx`; they were not replaced by these legacy components.
- No active import was found for the legacy component list above.
- Active server routes are present in `server.ts` and are protected by authentication/permission/tenant middleware according to their current contract.
- This audit found no justification to delete a route: route reachability and production usage require a separate owner-approved cleanup decision.

## Findings requiring owner decision

1. Whether to archive or remove the unimported alternate components in a future cleanup mission.
2. Whether auxiliary library/transport/uniform repositories remain supported by other modules.
3. Whether to replace or permanently block all local simulated document upload code after the Storage mission is approved.
4. Whether the active portal’s local academic fields need a separate canonical Enrollment/Academic Status workflow.

**No deletion is authorized by this audit.**

