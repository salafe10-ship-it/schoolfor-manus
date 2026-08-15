# Dashboard Dependency Report

- **Engine**: `DashboardEngine` manages definitions and async loading.
- **Widgets**: Reusable components registered by `type`.
- **Tenant Context**: All dashboard loads require `TenantContext` validation.
- **Dependencies**:
  - `IdentityModule` (for Role validation)
  - `TenantModule` (for Tenant context validation)
  - `WidgetRegistry` (for component mapping)
- **Status**: Operational.
