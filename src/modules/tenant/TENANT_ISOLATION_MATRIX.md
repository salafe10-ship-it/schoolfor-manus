# Tenant Isolation Matrix

| Layer | Validation Mechanism | Responsibility |
| :--- | :--- | :--- |
| API/Gateway | Token Context Extraction | Security Middleware |
| Service | TenantEngine.validateContext | Business Logic |
| Repository | TenantEngine.applyIsolationFilter | Data Retrieval |
| Dashboard/Report | Filtered Dataset Passing | UI Components |
| Export | Filtered Dataset Processing | Data Exporter |
