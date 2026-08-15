# Enterprise Security Platform Database Specification

## 1. Vision
The Enterprise Security Platform Database is the Single Source of Truth for identity, authentication, authorization, and audit logs. It is designed for high performance, security, scalability, and multi-tenant isolation.

## 2. Fundamental Goals
*   Support millions of users and thousands of schools.
*   Enforce full multi-tenancy and row-level security (RLS).
*   Maintain comprehensive audit logs for all security operations.
*   Ensure long-term scalability.

## 3. Database Standards
*   **Primary Keys:** UUID
*   **Deletions:** Logical (`is_deleted`)
*   **Audit Fields:** Mandatory on all tables (`created_at`, `created_by`, `modified_at`, `modified_by`, `is_deleted`, `deleted_at`, `deleted_by`, `version`, `row_version`)
*   **Concurrency:** Optimistic Concurrency via `version`.
*   **Partitioning:** Ready for data partitioning.
*   **Security:** Encryption ready for sensitive columns.

## 4. Core Tables
*   Organizations, Tenants, Schools, Branches
*   Users, Roles, Permissions, RolePermissions, UserRoles
*   SecurityPolicies, PolicyAssignments
*   ApiClients, ApiKeys
*   Sessions, RefreshTokens, AccessTokens
*   Devices, TrustedDevices
*   LoginHistory, FailedLogins, PasswordHistory
*   MfaMethods, OtpRequests
*   SecurityAudits, SecurityEvents, SecurityIncidents

## 5. Key Table Specifications

### Users Table
| Column | Type | Description |
| :--- | :--- | :--- |
| Id | UUID | Primary Key |
| TenantId | UUID | Tenant Identifier |
| Username | VARCHAR | Unique Username |
| Email | VARCHAR | Unique Email |
| PasswordHash | VARCHAR | Hashed Password |
| Status | VARCHAR | User Status |
| ... | ... | Audit Fields & Metadata |

### Roles Table
| Column | Type | Description |
| :--- | :--- | :--- |
| Id | UUID | Primary Key |
| RoleCode | VARCHAR | Unique Role Code |
| RoleName | VARCHAR | Human-readable Name |
| TenantScoped | BOOLEAN | Is Tenant-specific |

### Permissions Table
| Column | Type | Description |
| :--- | :--- | :--- |
| Id | UUID | Primary Key |
| PermissionCode | VARCHAR | Unique Permission Code |
| Module | VARCHAR | System Module |
| Action | VARCHAR | Permission Action |

## 6. Performance Targets
*   **Login:** < 300 ms
*   **Permission Query:** < 20 ms
*   **Session Lookup:** < 10 ms
*   **Audit Insert:** < 5 ms

## 7. Mandatory Rules
*   **NO** physical deletion.
*   **NO** system role/permission deletion.
*   **NO** business logic in DB.
*   **ALL** operations in transactions.
*   **ALL** changes must be audited.
*   **ALL** tables must be documented.

## 8. Definition of Done
Database design is complete when:
- All integration tests pass.
- All performance benchmarks met.
- Encryption protocols implemented.
- Tenant isolation verified.
- Backup and restore procedures tested.
- Full documentation generated.
