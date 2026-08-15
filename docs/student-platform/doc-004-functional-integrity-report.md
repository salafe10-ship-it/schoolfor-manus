# DOC-004 Functional Integrity Report

## Decision

`DOC-004 = PARTIALLY CERTIFIED / EVIDENCE BLOCKED`

The presentation and protected API contract are implemented and locally verified. Full functional certification on Staging is blocked because the approved operations path does not currently provide a safe way to create and inspect synthetic tenant fixtures or verify PostgreSQL state after each mutation.

## Scope and safety

- Environment considered: Staging only.
- Production was not accessed or modified.
- No existing school/student data was used as a test fixture.
- No `postgres`, `service_role`, SQL Editor, RLS bypass, token extraction, or database-role impersonation was used.
- No source changes outside Student Documents UI/tests/docs were made for this mission.

## Operation evidence matrix

| Operation | UI | API | Auth | DB mutation | Audit | Outbox | Tenant isolation | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| List/search/filter | PASS locally and in deployed UI path | PASS — existing GET route | PASS by existing middleware contract | EVIDENCE-BLOCKED live DB | READ access is service-defined | N/A | Static/service scope PASS; live proof blocked | PARTIAL |
| Open details/version timeline | PASS in component test | PASS — existing GET detail route | PASS by existing middleware contract | EVIDENCE-BLOCKED live DB | READ access is service-defined | N/A | Static/service scope PASS; live proof blocked | PARTIAL |
| Metadata create | PASS UI contract and request shape | PASS route exists | PASS middleware/permission route | EVIDENCE-BLOCKED — no synthetic student fixture | Service code writes audit/outbox in transaction; live rows unproven | Service code path present; live rows unproven | Trusted context path present; live proof blocked | PARTIAL |
| Verify | PASS UI action and expected version submission | PASS route exists | PASS middleware/permission route | EVIDENCE-BLOCKED | Service code path present; live rows unproven | Service code path present; live rows unproven | Trusted context path present; live proof blocked | PARTIAL |
| Reject | PASS UI action and reason requirement | PASS route exists | PASS middleware/permission route | EVIDENCE-BLOCKED | Service code path present; live rows unproven | Service code path present; live rows unproven | Trusted context path present; live proof blocked | PARTIAL |
| Expire | PASS UI action and reason requirement | PASS route exists | PASS middleware/permission route | EVIDENCE-BLOCKED | Service code path present; live rows unproven | Service code path present; live rows unproven | Trusted context path present; live proof blocked | PARTIAL |
| Archive | PASS UI action and reason requirement | PASS route exists | PASS middleware/permission route | EVIDENCE-BLOCKED | Service code path present; live rows unproven | Service code path present; live rows unproven | Trusted context path present; live proof blocked | PARTIAL |
| Restore | PASS UI action and reason requirement | PASS route exists | PASS middleware/permission route | EVIDENCE-BLOCKED | Service code path present; live rows unproven | Service code path present; live rows unproven | Trusted context path present; live proof blocked | PARTIAL |
| Version create | PASS UI form and metadata validation | PASS route exists | PASS middleware/permission route | EVIDENCE-BLOCKED | Service code path present; live rows unproven | Service code path present; live rows unproven | Trusted context path present; live proof blocked | PARTIAL |
| Category create | Existing service route and local service contract available | PASS route exists | PASS middleware/permission route | EVIDENCE-BLOCKED | Service code path present; live rows unproven | Service code path present; live rows unproven | Trusted context path present; live proof blocked | PARTIAL |
| Access-log read | PASS explicit read-only UI | PASS route exists | PASS middleware/permission route | N/A | Append-only read path; live ordering unproven | N/A | Trusted scope in service query; live proof blocked | PARTIAL |

## Security matrix

| Case | Local/component evidence | Live Staging evidence | Decision |
| --- | --- | --- | --- |
| No Auth → 401 | Existing middleware contract; component handles 401 | Not executed without a safe live fixture/channel | EVIDENCE-BLOCKED |
| Invalid token → 401 | Existing middleware contract | Not executed | EVIDENCE-BLOCKED |
| Missing permission → 403 | Component test passed with 403 and neutral state | Not executed against mutation fixture | EVIDENCE-BLOCKED |
| Other student/school/branch/tenant | Service query and trusted-context design reviewed | Cannot safely create cross-tenant fixture | EVIDENCE-BLOCKED |
| Forged client role/school/tenant | UI sends none of these values; prior service tests reject forged metadata | Not executed live | EVIDENCE-BLOCKED |

## Atomicity and idempotency

- The existing service uses the request-scoped Unit of Work and records audit/outbox work within the same transaction boundary.
- Local rollback coverage exists for metadata registration and commit failure.
- Live partial-failure verification for every mutation is not certified because the safe Staging fixture/database evidence channel is unavailable.
- Existing idempotency contract is used by mutation requests; DOC-004 does not add or redesign idempotency.

## Staging surface observed

- Render Staging service: `edupro-school-erp-staging`.
- Branch: `codex/sop-001-staging`.
- Live deployment for DOC-003: `e4af819` — Deploy succeeded.
- Authenticated school session displayed the isolated `PERF003 Test School` banner and Student Affairs route.
- No existing data was mutated during this mission.

## Stop condition reached

The requested remaining proof requires all of the following unavailable safe capabilities:

1. Create synthetic Tenant/School/Branch/App User/Student fixtures.
2. Execute each mutation with approved role/permissions.
3. Inspect database state, audit rows, outbox rows, and tenant-scope results.
4. Delete only the synthetic fixtures and prove zero residual rows.

Opening SQL Editor, using `postgres`/`service_role`, extracting a browser token, or using an existing student's record would violate the CTO order. Therefore the mission stops at the approved evidence boundary.

## Certification

The UI/API integration is ready for the next controlled verification run. Full Student Documents functional certification remains pending an approved Staging synthetic-fixture and database-observation channel.
