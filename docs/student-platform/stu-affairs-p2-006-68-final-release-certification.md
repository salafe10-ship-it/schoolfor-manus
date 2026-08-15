# STU-AFFAIRS-P2-006-68 — Student Affairs Final Release Certification

## Certification decision

`STUDENT AFFAIRS = RELEASE / HANDOFF READY WITH DOCUMENTED BLOCKERS`

This certification is based on the existing repository evidence and the approved bounded missions. It does not claim that blocked capabilities are production-ready, and it does not authorize new implementation.

## Certified closed work

The following work remains closed and must not be reopened by this certification:

- Student profile and field-parity truthfulness.
- Guardian save UX and atomicity containment.
- Sensitive-data UI containment.
- Canonical Student Timeline source and tenant-scoped reading.
- Student Documents metadata and action truthfulness.
- Student Documents error, concurrency, accessibility, responsive, search, filter, sort, selection, refresh, and post-mutation behavior.
- `STU-AFFAIRS-P1-006-62` / F01.
- `STU-AFFAIRS-P1-006-65` — Documents metadata release-gate hardening.
- `STU-AFFAIRS-P2-006-66` — Student List browser-print truthfulness.
- `STU-AFFAIRS-P2-006-67` — Student Document List identity source-of-truth.
- `STU-AFFAIRS-P1-006-40` — Canonical Student Timeline source fix.

## Evidence recorded

The repository contains accepted evidence for the closed scopes, including:

- Student Timeline: 285/285 Student Affairs regression tests, with 8/8 focused timeline tests.
- Student List print: 36/36 focused tests across 10 files.
- Student Documents identity and release gates: 51/51 tests across 4 files.
- TypeScript, Vite production builds, server bundles, `git diff --check`, and scoped secret scans are recorded as passing for the relevant bounded missions.
- Existing non-blocking warnings are recorded rather than hidden: large Vite chunks, existing `import.meta`/CommonJS server warnings, and line-ending notices where applicable.

## Explicit release limitations

The following capabilities are not certified for operational delivery:

### Storage / Binary

Binary upload, download, preview, malware scanning, quarantine, signed URLs, bucket policy, lifecycle, and purge remain blocked pending Security, Operations, and Schema/Architecture approval.

### Lifecycle / Bulk

Promote, re-enroll, dismiss, archive, and other bulk operations remain blocked pending an authoritative lifecycle contract, operation-specific permissions, item-level scope, transaction/idempotency/history/outbox rules, and Domain, Security, Operations, and Architecture approval.

### Graduation

Graduation remains `GRADUATION_NOT_READY`. No authoritative graduation contract or approved terminal-state implementation boundary is claimed.

### ISO / Birth Country

The birth-country field contract exists for read/edit handling, but full ISO 3166-1 alpha-2 validation remains blocked until its reference owner, source, version, and security/technical ownership are approved.

### Security-gated capabilities

Permission-cache, wildcard, and operation-permission decisions remain blocked where approval evidence is incomplete.

## Certification boundary

This document certifies the current handoff state only. It does not certify live database/RLS equivalence, Storage configuration, production deployment, or the blocked capabilities listed above.

## Development secret policy

Development credentials are not a release blocker when they are supplied exclusively through environment variables or an approved secret manager. No password, token, API key, or service credential may be committed to Git/GitHub, displayed in a report, embedded in tests, or written to application logs. Credentials must be rotated later under the operational secret-management policy.

## Handoff status

Student Affairs may be handed off as a release candidate with the limitations in this document attached to the delivery package. Any future implementation must be a separate bounded mission with the required named approvals recorded first.
