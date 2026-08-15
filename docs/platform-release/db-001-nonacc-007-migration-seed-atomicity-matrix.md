# DB-001-NONACC-007 — Migration / Seed Atomicity Matrix

| Operation | DB write | Sequential dependency | Shared transaction | Rollback on later failure | Retry/recovery | Idempotency evidence |
|---|---:|---:|---:|---:|---:|---|
| Migrate students | Yes | First | No | No shared rollback proven | None | Count-before-insert only |
| Migrate exams | Yes | After students | No | No | None | Count-before-insert only |
| Student Affairs migration | Yes/DDL or data path per engine | After prior migration steps | No shared boundary proven | No | None | Not proven |
| Seed schools | Yes | First | No | No shared rollback proven | None | Count-before-insert only |
| Seed branches | Yes | After schools | No | No | None | Count-before-insert only |
| Seed teachers | Yes | After branches | No | No | None | Count-before-insert only |
| Seed employees | Yes | After teachers | No | No | None | Count-before-insert only |
| Seed inventory | Yes | After employees | No | No | None | Count-before-insert only |
| Seed buses | Yes | Last | No | No | None | Count-before-insert only |

**Decision:** `OWNER DECISION REQUIRED — MIGRATION/SEED ATOMICITY POLICY`  
**Execution:** Discovery only; no migration, seed, SQL, database, staging, or production mutation.
