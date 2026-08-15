# Tenant Engine Architecture & Design

## Functional Specification
- Provides multi-tenancy isolation for all school data.
- Manages tenant lifecycle (provisioning, activation).
- Enforces data scoping (Row Level Security) based on tenant context.

## Security Controls
- Tenant-scoped database access.
- Row Level Security (RLS) policies based on `tenant_id`.
- Tenant context propagation via JWT claims.

## Traceability
- Links to: EBRC (Tenant Policy), CDM (Tenant Entity), Infrastructure ADR (SaaS Multi-tenancy).
