# STU-GUARDIAN-001 — Guardian Mapping Matrix

| Concept | UI / type representation | Service mapping | Repository / schema representation | Result |
|---|---|---|---|---|
| Father | `fatherName`, `fatherPhone`, job, workplace, national ID | Not consumed by canonical Guardian writer unless separately mapped to legacy fields | Guardian record expects `name`, `phone`, `national_id` in legacy path or legal-name fields in platform migration | **GAP** |
| Mother | `motherName`, `motherPhone`, job, workplace | Not consumed by `enlistCreateGuardianRelation` | No second relationship is created | **GAP** |
| Legacy parent | `parentName`, `parentPhone`, `guardianRelation` | Directly consumed by `StudentGuardianService` | One synthetic Guardian plus one relation | **PARTIAL** |
| Relationship type | `guardianRelation` / `relationshipType` | Defaults to `father` / Arabic display value depending on path | Current types expose `relationType`; static SQL uses `relationship` | **MISMATCH** |
| Primary guardian | `isPrimary` | Always set `true` in composite service | Platform migration has an active-primary uniqueness strategy | **PARTIAL** |
| Financial liability | Not represented in the complete UI contract | Always set `true` | Stored in join record in legacy object path | **UNVERIFIED / SYNTHETIC** |
| SMS notifications | Not represented in the complete UI contract | Always set `true` | Stored in join record in legacy object path | **UNVERIFIED / SYNTHETIC** |
| Guardian identity | Form has an input for national ID | Service derives `G_<student national ID>` or timestamp fallback | Platform migration expects an enterprise guardian identity | **UNSAFE** |
| Email | Form can display a guardian email | Service synthesizes `${guardianId}@alnoor.edu.sa`; hook synthesizes `${student.id}-parent@school-erp.edu` | No verified contact source established | **UNSAFE** |
| Address and occupation | Form captures values | Service uses hard-coded defaults | Platform schema separates legal/contact concerns | **UNSAFE** |
| Tenant | No tenant field in Guardian/StudentGuardian TypeScript value objects | Service passes `schoolId` only | Platform migrations require tenant-scoped keys | **GAP** |
| Branch | Student has branch field | Not passed to Guardian relation service | Platform migration supports branch scope | **GAP** |
| Audit | Admission passes an audit metadata object | One audit enlistment after composite writes | Direct CRUD has no corresponding audit path | **PARTIAL** |
| Domain event | No Guardian event in reviewed UI/service path | None | No Guardian outbox contract found | **GAP** |

## Mapping conclusion

The current canonical writer is not semantically equivalent to the approved Guardian domain model. It is a compatibility path for legacy parent fields and cannot be certified as the authoritative Guardian model.

