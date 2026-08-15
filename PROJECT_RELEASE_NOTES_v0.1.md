# Enterprise Foundation v0.1

**Release status:** Ready for GitHub milestone  
**Baseline date:** 2026-08-05  
**Project:** `edupro-school-erp`

## Completed Foundation

Enterprise Foundation v0.1 establishes the approved platform layers:

- Core Foundation: tenants, subscriptions, schools, branches, facilities, academic years, terms, and calendars.
- Identity Platform: users, roles, permissions, role assignments, sessions, trusted sessions, service accounts, and API-key metadata.
- Governance Platform: audit events, change sets, access events, outbox events, workflows, notification queues, feature flags, settings, and system jobs.

No Student Affairs, Finance, Accounting, HR, Inventory, or other business-module migration was executed.

## Database Statistics

- Public tables: 32.
- Total non-system project tables: 67.
- Public indexes: 179.
- Primary keys: 32.
- Foreign keys: 75.
- Unique constraints: 57.
- Check constraints: 186.
- Unvalidated constraints: 0.

The complete baseline is documented in [DATABASE_BASELINE.md](DATABASE_BASELINE.md).

## Architecture Summary

The foundation uses UUID identifiers, explicit foreign-key integrity, named constraints and indexes, tenant-aware platform entities, trusted identity references to Supabase Auth, append-only audit structures, and governance primitives for outbox, workflow, notifications, settings, and jobs.

## Migration Summary

Executed in the approved order:

1. `202608051200_core_foundation.sql`
2. `202608051300_identity_platform.sql`
3. `202608051400_governance_platform.sql`

All three migrations completed successfully and were validated against the live project inventory. No pending foundation migration remains in the local migration directory.

The detailed execution record is in [DATABASE_CHANGELOG.md](DATABASE_CHANGELOG.md), and the certification decision is in [FOUNDATION_CERTIFICATION_REPORT.md](FOUNDATION_CERTIFICATION_REPORT.md).

## Known Limitations

- RLS is not enabled on the foundation tables because it was outside the approved migration scope. It is required before client-facing production access.
- No application-owned `supabase_migrations` ledger exists for these manually executed migrations; deployment governance must register the applied migration identifiers before automated promotion.
- This release is a platform foundation and contains no business workflows or operational data.

## Next Phase

The next phase may begin only after CTO approval and should address the approved security prerequisites, especially RLS and migration-ledger governance, before Student Platform implementation.

## Release Readiness

**Decision: READY FOR GITHUB MILESTONE**

No Git tag was created and no remote push was performed.

