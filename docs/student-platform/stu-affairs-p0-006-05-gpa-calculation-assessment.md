# STU-AFFAIRS-P0-006-05 — GPA Calculation Assessment

Status: `NOT READY FOR GRADUATION CONSUMPTION`

## Existing calculations

The UI calculates a percentage by summing marks from `gradesMatrix` and dividing by the sum of subject maximums. It then derives Arabic grade symbols and pass/fail status from component state. The same pattern is repeated for exports and result screens. These are presentation calculations, not a canonical academic calculation engine.

The module also calculates comparison indicators using simulated previous-year GPA and simulated attendance. These values must never be used for graduation eligibility.

## Missing calculation guarantees

- no server-authoritative calculation version;
- no canonical subject/assessment weights;
- no explicit rounding policy persisted with the result;
- no treatment contract for missing or absent marks;
- no retake or replacement-mark policy;
- no approval/lock state for final grades;
- no enrollment, academic-year, or term linkage;
- no immutable calculation snapshot;
- no reproducible audit input/output record;
- no concurrency or correction contract.

## Minimum future calculation evidence

An approved final result must retain:

- student, enrollment, academic year, and term identifiers;
- subject and assessment identifiers;
- raw marks and maximum marks;
- weighting and rounding policy versions;
- calculation inputs and output;
- calculation timestamp and trusted actor/system identity;
- lock/approval status;
- correction lineage, if applicable;
- request ID and correlation ID.

## Graduation gate

Graduation must reject any candidate when:

1. a required result is missing or not locked;
2. the result belongs to a different enrollment or academic context;
3. the calculation policy is unknown or unapproved;
4. GPA provenance cannot be reconstructed;
5. a correction is pending;
6. the final result snapshot is stale.

## Assessment

`GPA SOURCE NOT PROVEN — DO NOT CONNECT CURRENT UI CALCULATIONS TO GRADUATION`.
