# STU-AFFAIRS-P1-006-63 — Storage Blockers

## Blocking decision

`P1-006-63 = BLOCKED — STORAGE OWNER APPROVALS UNAVAILABLE`

## Blocking items only

1. No verified approval for a private provider and bucket provisioning boundary.
2. No verified Security approval for trusted object-key construction and tenant/school/branch scope enforcement.
3. No verified approval for quarantine, malware/content scan, and server-only finalization.
4. No verified MIME and magic-byte allow-list.
5. No verified maximum object size or document-class override policy.
6. No verified signed-delivery or server-stream contract, exact-object binding, or expiry.
7. No verified encryption decision for regulated document classes.
8. No verified retention schedule, legal-hold rules, archive behavior, or final-purge authority.
9. No verified Operations design for orphan reconciliation, retry, dead-letter, alerting, recovery, and evidence.
10. No verified Schema approval for the `storage_object` relationship to an immutable document version.
11. No verified API/Domain contract for prepare, finalize, delivery, archive, restore, purge, idempotency, and versioning.

## Non-blocking items intentionally excluded

F02 remains a separately deferred P2 source-of-truth decision. P1-006-62 and F01 remain closed. No new inventory of Student Affairs was performed.

## Prohibited actions while blocked

Do not create a bucket or Storage policy. Do not add SQL, migrations, RLS, API, services, repositories, upload/download behavior, binary processing, OCR, malware scanning, signed URLs, UI changes, authorization changes, tenant redesign, staging changes, or production changes.

## Resolution path

Collect named owner decisions with dates and evidence, reconcile conflicts, attach the approval register, and issue a separate implementation order for each approved runtime phase.

