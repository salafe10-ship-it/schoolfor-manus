# SCHEMA-EVIDENCE-002 — Migration Comparison Status

## Comparison status

The ten Git migrations were statically inventoried, and live object-name presence was compared with the public table inventory. A complete definition comparison could not be performed because the supported CLI diff/dump path requires Docker Desktop and the Dashboard does not expose sufficient definition metadata.

| Migration group | Object-name presence | Definition equivalence | Classification |
|---|---|---|---|
| Core | Confirmed | Unavailable | D |
| Identity | Confirmed | Unavailable | D |
| Governance | Confirmed | Unavailable | D |
| Student foundation | Confirmed | Unavailable | D |
| Guardian | Confirmed | Unavailable | D |
| Enrollment | Confirmed | Unavailable | D |
| Academic status | Confirmed | Constraint text unavailable | D |
| Student documents | Confirmed | Unavailable | D |
| DB-SEC-003 | Partial policy evidence | Full policy definitions unavailable | D |
| Schema alignment | Target table confirmed | `active → withdrawn` unavailable | D |

## Result

- A: 0
- B: 0
- C: 0
- D: 10

No history alignment recommendation can be made from these data. The correct action is to preserve the current history and wait for a supported read-only definitions channel.
