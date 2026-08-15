# STU-AFFAIRS-P1-006-20 — Lifecycle Writer Matrix

| Operation | Active route | Service | Writer | Status changed | Enrollment changed | Domain history | Audit | Outbox | Idempotency | Version | Canonical? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Registration | `POST /api/students` | `StudentRegistrationService` | canonical registration repositories | applicant/status initialization | enrollment inserted | status history + transition inserted | canonical audit event | canonical outbox event | required idempotency key | canonical transaction/version | Yes |
| Generic update | `POST /api/students` with id | server route | `CanonicalStudentWriteRepository.update` | no client status binding | no | audit event | canonical audit | not part of ordinary patch | request metadata; no operation key | expected version required | Yes for current route |
| Suspend | same generic route with suspended | canonical write repository | `CanonicalStudentWriteRepository.suspend` | active → suspended | no closure proven | status history/transition path present | canonical audit | canonical event path present | operation idempotency not proven | expected version path requires review | Yes for current route |
| Promote | `/promote` | legacy StudentService | `StudentPromotionService` + legacy StudentRepository | no lifecycle status; academic year/class/stage | no | no dedicated lifecycle history proven | `AuditRepository.log` | not proven | not proven | legacy update can increment/check version, route does not supply expected version | No |
| Re-enroll | `/re-enroll` | legacy StudentService | `StudentEnrollmentService` + legacy StudentRepository | validates `re_enrolled`, writes `active` | no enrollment record mutation proven | no dedicated status history proven | `AuditRepository.log` | not proven | not proven | route does not supply expected version | No |
| Dismiss/suspend | `/dismiss` | legacy StudentService | `StudentEnrollmentService` + legacy StudentRepository | dismissed or suspended | no closure proven | no dedicated status history proven | `AuditRepository.log` | not proven | not proven | route does not supply expected version | No |
| Archive/restore | `/archive` | legacy StudentService | `StudentEnrollmentService` + legacy StudentRepository | archived or active | no closure proven | no dedicated status history proven | `AuditRepository.log` | not proven | not proven | route does not supply expected version | No |
| Soft delete/restore | `DELETE /api/students/:id` | canonical write repository | `changeLifecycle` | soft-delete/restore state | no closure proven | canonical lifecycle/audit path | canonical audit event | event path requires domain review | not proven as operation key | canonical transaction/version path | Yes for current route |
| Bulk | `/bulk` | legacy StudentService | legacy create/update/transfer/promote/archive services | varies | varies | varies | legacy audit log | not proven | not proven | mixed | No |
| Graduation | `/graduate` | none on live route | fail-closed containment | none | none | none | no success audit | none | none | none | Contained |

## Cross-cutting findings

1. `StudentLifecycleManager` and `src/modules/student-admission/domain/StudentLifecycle.ts` define different status/transition vocabularies.
2. Current approved canonical vocabulary and legacy vocabulary are not yet proven equivalent.
3. Enrollment closure and lifecycle history ownership are not consistently demonstrated by the legacy writers.
4. Audit logs exist across legacy paths, but Audit is not a substitute for domain status history.
5. Outbox and operation idempotency are proven for selected canonical registration paths, not for the legacy lifecycle routes.

No implementation is authorized by this discovery task.
