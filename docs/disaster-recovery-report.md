# Disaster Recovery Report

## Executive Summary
This report outlines the disaster recovery (DR) capabilities and objectives for the application. The system is designed to provide robust data protection and restoration capabilities utilizing GCP native database features.

## Recovery Objectives
- **Recovery Time Objective (RTO)**: 4 hours (Target time to restore services).
- **Recovery Point Objective (RPO)**: 1 hour (Target maximum data loss in a catastrophic event).

## Backup Strategy
- **Cloud SQL (PostgreSQL)**: Automated nightly backups enabled. Point-in-Time Recovery (PITR) active with 7-day retention for transaction-level recovery.
- **Firestore**: Scheduled daily snapshots to GCS with 30-day lifecycle policies.

## Restoration Procedures
1. **Database Corruption**: Utilize SQL PITR to recover to the state immediately preceding the corruption event.
2. **Region Failure**: Utilize GCS bucket cross-region replication for Firestore exports and automated SQL replica promotion if configured.
3. **Data Verification**: Post-restore checksum validation of ledger balances and academic marks.

## Conclusion
The implemented disaster recovery strategy leverages GCP’s robust managed services to meet stringent data protection requirements. Regular testing of the restoration procedure is required to guarantee the RTO/RPO targets.
