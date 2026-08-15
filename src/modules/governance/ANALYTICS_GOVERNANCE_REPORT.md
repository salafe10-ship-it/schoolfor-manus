# Analytics Governance Report

- **Governance Model**: Centralized `KPIRegistry` serving as the single source of truth for all metric definitions.
- **Enforcement**: No business module is permitted to define custom calculations; they must reference the canonical formulas registered here.
- **Fields enforced**: Owner, Source, Refresh Policy, Validation Rules, Security Classification.
- **Status**: Operational.
