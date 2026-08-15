# ADR 005: Permission Architecture

## Context
Role-based control alone is insufficient for fine-grained operations.

## Decision
We will adopt a 10-core-operation action model (View, Insert, Edit, Delete, Approve, Cancel, Post, Reverse, Export, Print) mapped to system resources. Permission enforcement will be checked via `PermissionEnforcementService`.

## Alternatives
- Simple CRUD permissions (Rejected: insufficient granularity for financial operations).

## Consequences
- Highly structured and auditable permission matrix.
- Increased complexity in mapping roles to all 10 actions.

## Future Impact
Enables strict segregation of duties (SoD) crucial for financial and auditing modules.
