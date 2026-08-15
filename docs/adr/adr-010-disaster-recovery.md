# ADR 010: Disaster Recovery Strategy

## Context
Data integrity and availability for financial and academic records are critical. The system must be capable of recovering from catastrophic failures, data corruption, or regional outages.

## Decision
We leverage GCP platform-native features for Database Disaster Recovery:
1. **Cloud SQL (PostgreSQL)**: Enable automated daily backups and Point-in-Time Recovery (PITR) with 7-day retention.
2. **Firestore**: Utilize Firestore scheduled backups and export functionality to Cloud Storage with retention policies.
3. **Encryption**: All backups are encrypted at rest by default using GCP-managed keys.

## Alternatives
- Custom snapshotting scripts (Rejected: High operational overhead, increased risk of failure).
- No automated backup (Rejected: Unacceptable data loss risk).

## Consequences
- Reliance on GCP platform capabilities for RTO/RPO.
- Automated, tested restoration procedures required.

## Future Impact
Supports implementation of cross-region failover for higher availability requirements.
