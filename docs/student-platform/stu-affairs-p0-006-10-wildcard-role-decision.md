# STU-AFFAIRS-P0-006-10 — Wildcard Role Security Decision

Status: `UNDECIDED — SECURITY/OPERATIONS APPROVAL REQUIRED`

## Current evidence

Static role definitions include wildcard capability for `admin` and `schooladmin` (and a constrained wildcard path for `superadmin`). The database role loader rejects wildcard permissions from live database assignments. This creates two authorization modes with different trust and revocation behavior.

## Options

| Option | Production posture | Revocation/scope | Status |
|---|---|---|---|
| Database assignments authoritative; no wildcard in production | Explicit permissions, tenant/scope records, auditable revocation | Strongest reviewability | `RECOMMENDED FOR REVIEW` |
| Wildcard allowed only for explicitly scoped platform break-glass role | Requires separate elevation, expiry, audit, and approval | Strong controls required | `UNDECIDED` |
| Static wildcard roles allowed normally | Broad bypass of operation-specific permissions | High privilege concentration | `REJECTED FOR REVIEW` |

## Required owner/security decisions

1. Are wildcard roles allowed in production?
2. Are they development/test only?
3. If allowed, what trusted scope and expiry apply?
4. Can wildcard override explicit operation-specific denial?
5. How is emergency access approved, monitored, and revoked?
6. What is authoritative when static and database assignments disagree?

No role is changed by this package.
