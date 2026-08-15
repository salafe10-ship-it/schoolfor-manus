# STU-AFFAIRS-P1-006-24 — Storage Approval Matrix

## Status vocabulary

- `UNDECIDED / APPROVAL REQUIRED`: the proposal is not an implementation decision.
- `NOT CREATED`: the proposed object does not exist by this handoff.
- `APPROVED`: only a recorded owner decision may set this value.

## Approval matrix

| Decision | Recommendation | Security | Operations | Schema/Architecture | API/Domain | Data Protection/Compliance | Final |
|---|---|---|---|---|---|---|---|
| Provider | Canonical Supabase Storage | REQUIRED | REQUIRED | REQUIRED | — | — | UNDECIDED |
| Bucket name | `student-documents-private` | REQUIRED | REQUIRED | REQUIRED | — | — | UNDECIDED / NOT CREATED |
| Private visibility | No public objects or permanent URLs | REQUIRED | REQUIRED | — | REQUIRED | REQUIRED | UNDECIDED |
| Server-derived object key | Tenant/school/branch/student/document/version | REQUIRED | — | REQUIRED | REQUIRED | — | UNDECIDED |
| `storage_object` relationship | One storage reference per document version unless approved derivatives | REQUIRED | — | REQUIRED | REQUIRED | — | UNDECIDED |
| Quarantine flow | Quarantine → scan → validate → finalize | REQUIRED | REQUIRED | — | REQUIRED | — | UNDECIDED |
| Malware/content scanner | Mandatory before verified state | REQUIRED | REQUIRED | — | — | — | UNDECIDED |
| MIME/magic-byte policy | Allow-list based on detected content | REQUIRED | — | — | REQUIRED | REQUIRED | UNDECIDED |
| Maximum file size | Proposed 25 MiB baseline | REQUIRED | — | — | — | REQUIRED | UNDECIDED |
| Delivery | Short-lived exact-object URL or server stream | REQUIRED | — | — | REQUIRED | — | UNDECIDED |
| Retention duration | No duration assumed | REQUIRED | REQUIRED | REQUIRED | — | REQUIRED | UNDECIDED |
| Legal hold | Blocks purge | REQUIRED | REQUIRED | REQUIRED | — | REQUIRED | UNDECIDED |
| Purge authority | Restricted audited Operations/Security action | REQUIRED | REQUIRED | — | — | REQUIRED | UNDECIDED |
| Orphan reconciliation | Worker with retry and evidence | REQUIRED | REQUIRED | — | — | — | UNDECIDED |
| Compensating cleanup | Required after DB/storage divergence | REQUIRED | REQUIRED | REQUIRED | — | — | UNDECIDED |
| Immutable versions | Replacement creates a new version | REQUIRED | — | REQUIRED | REQUIRED | — | UNDECIDED |
| Idempotency | Required for mutating commands | REQUIRED | REQUIRED | — | REQUIRED | — | UNDECIDED |
| Encryption at rest/in transit | Provider encryption + TLS | REQUIRED | REQUIRED | — | — | REQUIRED | UNDECIDED |
| Application-layer encryption | Data-class decision | REQUIRED | — | — | — | REQUIRED | UNDECIDED |
| Policy source of truth | Trusted JWT/app metadata and server context | REQUIRED | — | REQUIRED | REQUIRED | — | UNDECIDED |

## Decision gate

Implementation remains blocked until the required owners record decisions for every row relevant to the first release. A recommendation is not an approval.

