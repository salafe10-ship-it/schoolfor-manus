# Enterprise Database Architecture & Standards Framework

## 1. Vision
The database is an Enterprise Data Platform and the Single Source of Truth for the entire ecosystem (ERP, BI, AI, Analytics, Reporting, Integration, Audit, Monitoring, Backup, DR). It must be designed for reliability, performance, security, and scalability.

## 2. Fundamental Principles
*   **Normalization:** Normalized to an appropriate level (e.g., 3NF/BCNF).
*   **Denormalization:** Allowed only for performance optimization with justification.
*   **Integrity:** Absolute focus on Data, Referential, and Semantic Integrity.
*   **Maintainability & Extensibility:** Designed for long-term growth and schema evolution.

## 3. Database Roles
Strict separation of concerns based on purpose:
*   Operational Database (OLTP)
*   Reporting Database
*   Data Warehouse (EDW)
*   Archive Database
*   Metadata Repository
*   Audit Database

## 4. Table Design Standards
Every table must contain mandatory Audit Fields:
*   `id` (UUID Primary Key)
*   `tenant_id` (UUID)
*   `school_id` (UUID, optional)
*   `branch_id` (UUID, optional)
*   `created_at` (TIMESTAMP)
*   `created_by` (UUID)
*   `modified_at` (TIMESTAMP)
*   `modified_by` (UUID)
*   `is_deleted` (BOOLEAN, default: false)
*   `deleted_at` (TIMESTAMP, nullable)
*   `deleted_by` (UUID, nullable)
*   `version` (INTEGER, for Optimistic Concurrency)
*   `status` (VARCHAR/ENUM)

## 5. Naming Standards
*   **Tables:** Singular noun (e.g., `student`, `invoice`, `journal_entry`).
*   **Columns:** PascalCase (e.g., `StudentId`, `InvoiceAmount`).
*   **Foreign Keys:** Suffix with `Id` (e.g., `StudentId`, `TeacherId`).
*   **Naming:** Avoid abbreviations; use clear, descriptive names.

## 6. Performance & Scalability
*   **Indexing:** Use a balanced approach (Clustered, Non-Clustered, Filtered, Composite). Index usage must be analyzed.
*   **Partitioning:** Support for Date, Tenant, or School-based partitioning for large tables.
*   **Queries:** All queries must be analyzed for performance (Execution Plan, Statistics).

## 7. Security
*   Encryption: At-rest and in-transit.
*   Sensitive Data: Column-level encryption or Dynamic Data Masking.
*   Isolation: Multi-tenant isolation enforced via Row-Level Security (RLS) or schema separation.

## 8. Data Governance & Integrity
*   **Constraints:** Primary, Foreign, Check, Unique, and Default constraints must be enforced at the database level.
*   **Soft Delete:** All deletions are logical (`is_deleted`). Permanent removal is governed by Data Governance Policy.
*   **Stored Procedures/Triggers:** Restricted. Use only with Architecture Board approval; business logic must reside in the Application layer.

## 9. Monitoring & Maintenance
*   Continuous monitoring of health, slow queries, deadlocks, and fragmentation.
*   Capacity planning based on forecasted growth (transaction volume, storage, backup size).

## 10. Database API
All database interactions must be managed through approved service patterns (e.g., `DatabaseService` or Repository layer).

## 11. Mandatory Requirements
*   **NO** table without UUID Primary Key.
*   **NO** table without mandatory Audit Fields.
*   **NO** physical deletion.
*   **NO** business logic inside the database (Procedures/Triggers restricted).
*   **NO** database connection from the UI layer.
*   **NO** unanalyzed indexes.
*   All objects must be documented (description, owner, purpose).
*   All changes must be auditable and versioned.
