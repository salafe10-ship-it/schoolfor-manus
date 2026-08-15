# STU-AFFAIRS-P1-006-37 — ISO Reference Lifecycle Policy

## Draft guardrails — not yet approved

The following are required policy questions, not engineering decisions:

- Reference version and provenance must be recorded.
- Each version needs an effective date and review date.
- Updates must be reviewed by the named Data Governance and Security owners.
- Changes must be versioned, auditable, reversible, and pinned at runtime.
- Existing Student values must remain historically interpretable; a reference update must not silently rewrite records.
- Additions, deprecations, corrections, and legacy codes require an explicit compatibility rule.
- Runtime validation should use a local immutable snapshot for the approved version unless an owner approves another policy.
- The reference must not receive Student personal data.

## Decisions still required

No lifecycle policy is adopted until the authority approves:

1. reference version and provenance;
2. effective date;
3. review/update cadence;
4. change history and rollback process;
5. handling of deprecated or corrected codes;
6. historical-value compatibility;
7. runtime version pinning.

## Scope

This document does not create a reference list, table, package, migration, validator, or data cleanup.
