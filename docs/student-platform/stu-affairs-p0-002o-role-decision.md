# STU-AFFAIRS-P0-002O — Application Role Decision

## Decision

**Application role: UNPROVEN**

The target role for the canonical transfer path is a dedicated application role that is:

- non-owner;
- non-superuser;
- non-`BYPASSRLS`;
- unable to create or alter roles, tables, policies, migrations, or extensions;
- granted only the approved schema/table privileges required by the canonical service;
- unable to perform ordinary physical purge.

`edupro_staging_app` is the role named by the existing staging RLS contract and is therefore the candidate role. It is not approved as the live application role because the recorded DB-SEC-004 reconciliation identified the Render path as a `postgres.<project-ref>` pooler identity and found no proven role switch.

## Required evidence for approval

Security/Operations must provide a controlled Staging evidence record showing, from the actual application connection:

1. `current_user` is the approved application role.
2. The role is not an owner and has `rolbypassrls = false`.
3. The role has no forbidden membership or privilege escalation path.
4. The same role is used across transaction pool reuse, not only in a manual SQL Editor session.
5. The role can perform only approved same-tenant actions and is denied cross-tenant actions.
6. The role cannot alter RLS, schema, role membership, or migration history.

No credentials or connection strings are required in the report; only non-secret role attributes and controlled outcomes are needed.

## Role boundary decision

| Capability | Approved for ordinary app role? | Reason |
|---|---:|---|
| Same-tenant SELECT | Conditional | Only after RLS and role path are proven |
| Create canonical PENDING operation | Conditional | Only through the canonical service and trusted context |
| Claim/complete/fail operation | Conditional | Worker/service boundary must be approved |
| Reconcile | No direct client authority | Separate approved operator/service path |
| Physical purge | No | Separate Operations/Security-controlled process |
| Alter schema/RLS/roles | No | Administrative boundary |

## Status transition

No role, grant, membership, environment variable, or deployment configuration is changed in P0-002O. The status becomes **APPROVED** only after the above evidence is reviewed and signed by Security/Operations.
