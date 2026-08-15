# STU-AFFAIRS-P1-006-30 — Profile Read Field Matrix

| Field | Safe to show now | Safe to edit now | Current gap | Required decision |
|---|---|---|---|---|
| `fullName` | Yes | Yes | None material | None |
| `studentCode` | Yes | Yes with expected version | Create generation vs Edit required-value semantics | Confirm UI behavior for empty Edit value |
| `birthDate` | Yes | Yes | None material | None |
| `gender` | Yes | Yes | UI/server allowed-value normalization should remain aligned | Domain validation policy |
| `nationality` | Yes | Yes | None material | None |
| `birthCountryCode` | No current Profile projection | No current Profile edit | Persisted at Create but invisible afterward | Read-only or Read+Edit contract |
| `preferredName` | Backend projection exists | Backend patch capability exists | Current Profile UI does not expose it | Add to Profile contract or keep API-only |

## Privacy and scope

All approved fields inherit the trusted canonical read scope: authenticated identity, trusted tenant, school, branch, and academic context where required. No client query/body/header value may become ownership context.

## No new source of truth

This matrix does not authorize copying values from legacy `students` columns, Guardian records, Enrollment, local storage, or synthetic UI defaults into the canonical Student Profile.
