# STU-AFFAIRS-P2-006-68 — Release Gate Matrix

| Gate | Scope | Evidence currently recorded | Release state | Required next evidence |
|---|---|---|---|---|
| Closed code scopes | Profile, Guardian, Timeline, Documents, list print, identity source | Mission reports, focused tests, TypeScript/build/scan evidence | `PASS — HANDOFF ELIGIBLE` | None for the closed scope; do not reopen |
| Storage/Binary | Upload, download, preview, scanning, signed URLs, bucket lifecycle | No approved Security/Operations/Schema boundary | `BLOCKED` | Named approvals, bucket/policy design, retention and malware controls |
| Lifecycle/Bulk | Promote, re-enroll, dismiss, archive, bulk operations | No authoritative lifecycle and transaction boundary | `BLOCKED` | Domain/Security/Operations/Architecture approval and operation contract |
| Graduation | Graduation status and terminal workflow | `GRADUATION_NOT_READY`; no authoritative contract | `BLOCKED` | Approved graduation state machine, authority, audit, and write boundary |
| ISO/reference | Birth-country reference validation | Reference owner/source/version not approved | `BLOCKED` | Data Governance, Reference Owner, Security, and Technical Owner approval |
| Security-gated | Permission cache, wildcards, operation permissions | Required approval evidence unavailable | `BLOCKED` | Named security decision with scope, evidence, date, and acceptance criteria |
| Live database/RLS | Production equivalence and tenant isolation evidence | Live evidence channel not certified in this handoff | `NOT CERTIFIED` | Authorized live evidence and separate certification mission |
| Production deployment | Operational production readiness | This documentation does not mutate or certify production | `NOT CERTIFIED` | Operations release approval and deployment evidence |
| Development secrets | Environment/secret-manager supplied credentials | No plaintext credentials are included in this handoff | `PASS — POLICY DEFINED` | Rotate under the operational secret-management policy |

## Release rule

Only rows marked `PASS — HANDOFF ELIGIBLE` may be represented as completed capabilities. `BLOCKED` and `NOT CERTIFIED` rows must remain visible in the delivery notes and must not be inferred as approved.
