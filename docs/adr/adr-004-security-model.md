# ADR 004: Security Model

## Context
The application must strictly enforce access control across all modules, complying with zero-trust principles.

## Decision
We will implement a Role-Based Access Control (RBAC) system enforced server-side via middleware. Client-side UI will only serve as a presentation layer for permissions, not a security enforcement point.

## Alternatives
- Client-side security only (Rejected: fundamentally insecure).

## Consequences
- Centralized security management in `src/middleware/auth.ts`.
- Every API endpoint requires explicit permission mapping.

## Future Impact
Forms the basis of compliance audits and mitigates unauthorized access attempts.
