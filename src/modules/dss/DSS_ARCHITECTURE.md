# DSS Architecture

- **Domain**: Centralized Decision Support (`/src/modules/dss`).
- **Pipeline**:
    - **Data Input**: Aggregated from `BIEngine`, `MonitoringEngine`, and `AnalyticsEngine`.
    - **Processing**: `DSSEngine` transforms raw indicators into actionable insights.
    - **Presentation**: `DecisionSupportDashboard`.
- **Consistency**: No duplicated business logic; standardizes consumption of enterprise modules.
- **Status**: Operational.
