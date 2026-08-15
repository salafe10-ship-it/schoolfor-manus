# DB-001-NONACC — Fallback Reachability Matrix

**Mode:** Static/read-only audit; no runtime mutation  
**Decision:** `P1/P2 HARDENING REQUIRED`

| Fallback surface | Trigger | Can write locally? | Can return success? | Production safety status |
|---|---|---:|---:|---|
| `FallbackStorage.performWrite` | Canonical write failure or no client | Compatibility mode only after DB-002 guard | No when canonical persistence is required | PASS for guarded callers; direct callers remain to audit |
| `FallbackStorage.performRead` | Canonical read/health failure | N/A | Returns local data in explicit compatibility mode | P1 until all direct callers use guard |
| `safeReadFile`/`safeWriteFile` | Initialization or direct collection use | Yes, JSON server-side or localStorage browser-side | Caller-dependent | P2 compatibility surface; not a production authority |
| Emergency queue | Failed local-compatible write | Queues JSON operation | Caller may see local success in legacy paths | P1: must not be reachable as production financial/non-accounting authority |
| Student/Guardian legacy collections | Direct getter/setter calls | Yes | Caller-dependent | P1 route containment required |
| Attendance repository | Supabase exception/no data | Yes | Yes (`Attendance`/`true`/count) | P1 false-success risk |
| Employee/Teacher repository | Supabase exception/no data | Yes | Yes (record/`true`) | P1 false-success risk |
| Inventory repository | Supabase exception/no data | Yes | Yes (record/`true`) | P1 false-success risk |
| Student document repository | `performWrite` path | Guarded in configured env | Only after canonical success in configured env | P1 due no-op `DocumentRepository` path and read scope |
| Exams repository | `performWrite` path | Guarded in configured env | Only after canonical success in configured env | P1 read/source parity remains |
| Notification inbox | Direct fallback getter | Read only | Returns local list | P1 canonical read parity not proven |
| Configuration effective read | Supabase query error | No fallback write | Returns `null` | P2 ambiguous failure semantics |

## Queue behavior

`FallbackStorage.syncQueue` performs conflict merge/upsert and then writes a separate audit row. This is not a single transaction and its merge policy can overwrite/merge remote state without an approved domain-specific conflict contract. It is not evidence of a production data incident, but it is a P1 risk if reachable for authoritative production data.

## Required hardening boundary

For each non-accounting writer, one of these must be explicit:

1. canonical PostgreSQL/Supabase writer with confirmed commit;
2. truthful `PERSISTENCE_UNAVAILABLE`/`OUTCOME_UNKNOWN` failure;
3. documented local-only development adapter that cannot be selected by staging/production configuration.

## Decision

Fallback is not globally removable because local compatibility uses it, but its reachability is too broad for release certification. `P1` hardening is required for direct repository callers and emergency queue authority.
