# STU-AFFAIRS-P1-006-34 — Request/Response Matrix

| Scenario | Request condition | Required result | Write allowed |
|---|---|---|---|
| Read populated | trusted Student read context | `birthCountryCode: "XX"` from canonical row | No |
| Read null | trusted Student read context | `birthCountryCode: null` | No |
| Create value | valid normalized ISO alpha-2 value | existing registration response includes canonical value | Existing Create path |
| Patch absent | field omitted | other approved fields only; birth country unchanged | Yes, if other patch fields exist |
| Patch null from existing | explicit null + valid reason + expectedVersion | canonical `null` and incremented version | Yes |
| Patch different from existing | valid different value + valid reason + expectedVersion | canonical new value and incremented version | Yes |
| Patch null to value | valid value + expectedVersion | canonical value and incremented version | Yes |
| Same normalized value | same value | no-op or canonical unchanged response; no false success | No write required |
| Lowercase/whitespace | normalizable valid value | trim/uppercase before validation | Yes after normalization |
| Wrong length | not exactly two ASCII letters | `VALIDATION_ERROR`; no write | No |
| Non-ASCII | non-ASCII input | `VALIDATION_ERROR`; no write | No |
| Unsupported ISO code | syntactically valid but not in approved reference | `VALIDATION_ERROR`; no write | No |
| Missing reason | existing → different or existing → null without reason | `VALIDATION_ERROR`; no write | No |
| Stale version | `expectedVersion` differs from current | `CONFLICT_ERROR`; no success | No |
| Cross-tenant target | trusted scope does not match target | existing tenant denial | No |
| Persistence failure | database/transaction failure | failure response and rollback | No committed write |

## Response minimum

The successful canonical Student response contains:

```text
data.student.birthCountryCode: string | null
data.student.version: integer
```

No response may claim success based only on local form state or an optimistic client cache.
