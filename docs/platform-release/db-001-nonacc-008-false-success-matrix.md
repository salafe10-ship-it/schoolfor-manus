# DB-001-NONACC-008 — False-Success Matrix

| Failure shape | Representative evidence | Current outcome | Risk | Required next action |
|---|---|---|---|---|
| Supabase read throws, fallback record returned | StudentDocument, Guardian, StudentContact, StudentMedicalRecord | Resolves with local record or `null` | Stale data presented as canonical | P1: explicit read failure contract |
| Supabase read returns error, fallback list returned | Attendance, Employee, Inventory, student-related repositories | Resolves with local list/count | Empty/stale list can be mistaken for authoritative result | P1: distinguish empty result from failed query |
| Supabase write fails, fallback write attempted | Library, Transportation, Uniform legacy repositories | Local write can be returned as success | False success and divergence | P1: route through `performWrite`/canonical guard |
| Canonical write fails, fail-closed guard runs | Attendance, Employee, Inventory, Student, Student-related `performWrite` paths | Throws `PERSISTENCE_UNKNOWN` when canonical is required | Control is present | PASS; retain regression coverage |
| Canonical student read fails | StudentRepository / CanonicalStudentReadRepository | Throws / requires canonical boundary | No silent fallback in audited path | PASS for 008 |
| Configuration read fails | ConfigurationRepository | Error logged and rethrown | Caller receives failure instead of “not found” | PASS for 008 |
| Platform repository operation is stubbed | Workflow, Security permission lookup, several save methods | Fallback-only, `false`, `undefined`, or no operation | Functional false success / incomplete persistence | P1/P2 separate implementation missions |
| HTTP handler receives a repository resolution | `server.ts:1113-1150` | Sends `success: true` when service resolves | Repository fallback semantics can propagate to HTTP success | Verify after repository hardening; no 008 code change |

## Classification rule

- **P1:** reachable student-affairs or operational path can return a non-canonical result or report a local write as success.
- **P2:** platform/legacy or incomplete path requires owner confirmation before implementation.
- **P0:** not evidenced by this static audit; no live corruption or security bypass was demonstrated.
