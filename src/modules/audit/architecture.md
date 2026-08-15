# Audit Engine Architecture & Design

## Functional Specification
- Provides immutable, append-only logging of all business-critical state changes.
- Supports compliance requirements for audit trails.
- Facilitates troubleshooting and forensic analysis.

## Security Controls
- Append-only database table (no update/delete permissions).
- Row Level Security (RLS) to ensure tenants only access their own audit logs.
- Strict data sanitization for `old_data` and `new_data`.

## Traceability
- Links to: EBRC (Compliance Policies), CDM (Audit Entity), Infrastructure ADR (Audit Persistence).
