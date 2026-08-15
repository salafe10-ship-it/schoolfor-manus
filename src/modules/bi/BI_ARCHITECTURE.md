# BI Architecture Documentation

- **Data Sourcing**: `BIEngine` aggregates data from domain-specific engines (`AnalyticsEngine`, `AccountingEngine`).
- **Calculations**: Business logic is centralized; `BIEngine` only presents transformed intelligence, avoiding duplication of business calculations.
- **Traceability**: All BI indicator generations are audit-logged for executive transparency.
- **Status**: Operational.
