# STU-AFFAIRS-P0-006-10 — Authorization Failure-Mode Matrix

Status: `DESIGN ONLY — FAILURE POLICY APPROVAL REQUIRED`

| Failure mode | Required safe behavior | Current decision |
|---|---|---|
| Cache unavailable | Deny sensitive authorization or use approved fresh resolution | `UNDECIDED` |
| Permission source unavailable | Fail closed; do not fall back to broad permissions | `RECOMMENDED` |
| Scope unavailable | Deny | `RECOMMENDED` |
| Role assignment unavailable | Deny | `RECOMMENDED` |
| Revision unavailable | Deny cached scope-sensitive decision | `RECOMMENDED` |
| Stale assignment | Deny until refreshed | `RECOMMENDED` |
| Invalidation failure | Treat cache as unsafe; deny or force fresh resolution | `UNDECIDED` |
| Wildcard conflict | Apply approved precedence; never infer | `UNDECIDED` |
| Unknown permission | Deny and audit | `PROVEN in engine` |
| Invalid role | Deny and audit | `PROVEN in engine` |
| Object scope mismatch | Deny and audit | `REQUIRED DESIGN` |
| Approval missing | Deny sensitive operation | `REQUIRED DESIGN` |

## Audit decision questions

Security and Operations must decide whether to record cache resolution, wildcard use, stale assignments, invalidation failures, and scope denials. Audit records must not contain secrets or raw tokens.
