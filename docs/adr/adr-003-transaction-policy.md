# ADR 003: Transaction Policy

## Context
Data integrity is paramount in financial and educational modules.

## Decision
All write operations spanning multiple entities must be wrapped in transactions initiated at the Service level orchestrator. Read-only operations do not require explicit transaction wrapping unless strict snapshot isolation is needed.

## Alternatives
- Autocommit (Rejected: fails to guarantee atomicity).

## Consequences
- Performance overhead of transaction management for write-heavy services.
- Guarantees consistency.

## Future Impact
Sets the baseline for system reliability in high-throughput environments.
