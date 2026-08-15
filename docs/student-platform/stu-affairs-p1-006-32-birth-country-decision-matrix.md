# STU-AFFAIRS-P1-006-32 — Decision Matrix

| Decision area | Approved decision | Rationale / guardrail |
|---|---|---|
| Domain owner | Student | Canonical source is `students.birth_country_code`; no cross-domain ownership found |
| Contract shape | Read + Edit | Create already persists the field; parity requires visible read and controlled correction |
| Nullable | Yes | Unknown/not recorded is valid and must remain explicit `null` |
| Create validation | Trim, uppercase, exact two ASCII letters, approved ISO alpha-2 | Same semantics as Edit |
| Edit validation | Same as Create plus expected version | Prevents stale overwrites |
| Normalization | Uppercase canonical representation | Avoids case drift |
| Post-registration change | Allowed as a controlled profile correction | Not a lifecycle or enrollment transition |
| Correction reason | Required when changing an existing value | Supports traceability and prevents unexplained sensitive edits |
| Audit | Required | Server-generated actor, tenant, request, correlation, time, old/new values per audit policy |
| Tenant scope | Existing trusted tenant/school/branch context | No client-selected scope |
| UI | Include in detailed Student Profile after implementation | No implementation in this mission |
| Authorized detailed export | Include | Existing export authorization and classification controls still apply |
| Summary/bulk export | Exclude by default | Prevents unnecessary demographic exposure |
| Official detailed report | Include | Field is part of the approved detailed Student Profile |
| Classification | CONFIDENTIAL | Personal data, not public directory data |
| Encryption | Use existing platform protections | No separate cryptographic redesign authorized |
| Source conflict | None found | Both schema and canonical registration path identify Student ownership |
| Implementation status | Approved for separate bounded order | Architecture approval is not implementation completion |
