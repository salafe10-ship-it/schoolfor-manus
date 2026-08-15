# STU-AFFAIRS-P1-006-36 — Reference Source Matrix

| Candidate source | Found in project | Owner identified | Security assessment | Decision |
|---|---:|---:|---|---|
| Database reference table | No | No | Could be tenant-independent and local, but would require schema work | Not approved |
| Approved package/library | No | No | Could be local, but dependency provenance/version must be governed | Not approved |
| Immutable application configuration | No | No | Local, but creates an application-owned source of truth | Not approved |
| External reference service | No | No | Prohibited by default for CONFIDENTIAL Student context unless separately approved; unnecessary data egress risk | Not approved |
| Institutional reference document | No | No | Could establish provenance, but none is present or assigned | Not approved |

## Required decision fields

Before implementation, the owner decision must record:

- selected source and exact version;
- provenance and license/usage status;
- Reference Owner;
- Security Owner;
- Data Governance Owner;
- Technical Owner;
- update approval workflow;
- historical-value compatibility policy;
- local/offline validation guarantee;
- rollback/version pinning policy.

Until these fields are approved, `ZZ` cannot be safely classified as accepted or rejected by the application.
