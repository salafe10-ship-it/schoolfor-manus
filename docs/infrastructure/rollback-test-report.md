# INF-001 - Rollback Test Report

## Scenarios

| Scenario | Expected result |
| --- | --- |
| Successful commit | All commands commit once and the session is released. |
| Failure after first write | Rollback; zero staged/committed rows. |
| Failure after middle write | Rollback; zero staged/committed rows. |
| Failure after last write | Rollback; zero staged/committed rows. |
| Repository exception | Rollback and deterministic error propagation. |
| Database exception | Rollback and connection release. |
| Connection failure | No transaction session is created; no persistence occurs. |
| Transaction timeout/error | Query failure rolls back the session. |
| Repeated commit | Rejected after the UnitOfWork has completed. |
| Repeated rollback | Rejected after the UnitOfWork has completed. |
| Nested UnitOfWork | Rejected before a second transaction begins. |

The test suite uses an in-memory fake transaction driver to inject each failure point. It does not use production secrets or write to Supabase.
