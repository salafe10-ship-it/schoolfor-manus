# STU-ENROLL-001 — Validation Report

Date: 2026-08-11  
Mission: discovery and integrity baseline; no source/database changes

## Static scope validation

| Check | Result | Evidence |
|---|---|---|
| Allowed files only | PASS | Four files under `docs/student-platform/` were added for this mission. |
| Source modifications | PASS | No source, migration, UI, RLS or database files were modified. |
| Enrollment migration inventory | PASS | `202608051700_enrollment_engine.sql` defines the three requested Enrollment tables. |
| Canonical writer inventory | PASS | SOP-001 is the only direct production writer found for `enrollments`; no production writers found for history/transfers. |
| Tenant and academic context review | PASS | Composite migration FKs and `assertAcademicContext` were reviewed. |
| Status model review | BLOCKED | Canonical Enrollment, Academic Status and legacy vocabularies conflict. |
| Duplicate/overlap review | PASS WITH LIMITATION | Database controls exist, but later lifecycle writers are absent and active-only semantics require clarification. |
| Source changes forbidden by order | PASS | No implementation was performed. |

## Required engineering verification baseline

The following repository checks are required before this discovery package is submitted as a hardening gate. They are intentionally executed against the unchanged source tree.

- TypeScript: PASS — `tsc --noEmit --project tsconfig.json`.
- Full Vitest: PASS — 29 files, 156 tests.
- Vite production build: PASS — 3,049 modules transformed.
- Server bundle: PASS — `dist/server.cjs` generated successfully.
- `git diff --check`: PASS for the four mission documents.

Known non-blocking warnings observed in the current and prior approved runs:

- Vite reports the existing dynamic/static import overlap around `PostingEngine` and large chunks.
- The server bundle reports existing `import.meta`/CommonJS warnings.

## Stop conditions assessed

| Stop condition | Assessment |
|---|---|
| Multiple canonical paths | CONFIRMED: SOP-001 plus legacy transfer/re-enrollment paths |
| UUID/legacy conflict | No new UUID conflict found in the Enrollment migration; legacy domain shape remains separate |
| Writes outside canonical UoW | CONFIRMED for legacy Enrollment-related operations |
| Tenant defect | No new defect proven in canonical SOP-001; legacy routes require later isolation review |
| Status conflict | CONFIRMED |
| Schema/RLS dependency | RLS remains outside this mission; no RLS change made |
| Unresolved business semantics | CONFIRMED for transfer, re-enrollment and status synchronization |

## Final decision

**STU-ENROLL-001 = BLOCKED + RCA**

### Root cause

The database package exists, but the application has not yet converged on it. Initial registration is canonical; transfer and re-enrollment are still legacy student mutations. The project also lacks an approved contract linking Enrollment states to Academic Status states. Implementing hardening before resolving these items could create duplicate records, incomplete history, inconsistent status and non-auditable transfers.

### Required next order

Issue a business/architecture decision that:

1. names the single canonical Enrollment writer;
2. defines transfer source/target and closure semantics;
3. defines re-enrollment behavior and academic-year/term requirements;
4. defines Enrollment ↔ Academic Status synchronization;
5. authorizes a separate hardening mission after the decision.
