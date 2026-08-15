# INF-001 - Concurrency Test Report

## Coverage

- Concurrent requests acquire different transaction sessions.
- Async context propagation retains the correct transaction per request.
- A transaction cannot be reused after commit, rollback, or release.
- Optimistic-concurrency commands remain parameterized and can include a version predicate.
- Conflict resolution remains outside infrastructure scope and belongs to the application/domain layer.

## Required Live Verification

Before production activation, run a PostgreSQL integration test with two concurrent clients against the same row and verify one versioned update succeeds while the other receives a deterministic conflict. This requires a staging database and is intentionally not run by the local unit suite.
