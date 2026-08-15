# Reporting Architecture Documentation

The Reporting Engine is decoupled from Business Logic, UI, and Database access to ensure maintainability and security.

- **Pipeline**:
    1. **Definition**: Standard `ReportDefinition`.
    2. **Provider**: Data is fetched via registered `DataProviders`.
    3. **Generation**: `ReportingPipeline` standardizes the output `ReportResult`.
- **Decoupling**: Business logic resides in domain engines (`MarksEngine`, etc.), while reporting only consumes processed data through providers.
- **Audit**: Every report generation is tracked in the Enterprise Audit Framework.
