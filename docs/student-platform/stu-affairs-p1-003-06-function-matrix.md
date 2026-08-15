# STU-AFFAIRS-P1-003-06 — Function Matrix

## Active Portal Functions

| Function | Entry point | Real effect | Data source | Auth/tenant | Classification | Risk |
|---|---|---|---|---|---|---|
| Search/list | `StudentAffairsPortal` → `StudentRepository.list` → `GET /api/students` | Reads current server page | Canonical PostgreSQL read path | Auth + Student.View + trusted tenant | CANONICAL | Scope is page-local for client tools |
| Add student | main portal save | Canonical registration call | Canonical PostgreSQL | Student.Write / registration contract | CANONICAL | Depends on existing approved contract |
| Edit student | main portal save | Canonical update call | Canonical PostgreSQL | Student.Write | CANONICAL | Guardian fields deliberately rejected outside guardian workflow |
| Delete student | `handleDeleteStudent` | Soft-delete request | Server delete endpoint | Student.Delete | CANONICAL API, legacy client shape | Requires full regression coverage |
| Suspend | `handleToggleSuspendStudent` | Canonical status update for suspend | Canonical PostgreSQL | Student.Write | CANONICAL for suspend | Reactivation is intentionally blocked in UI |
| View profile | `setViewStudent` | Opens local projection | Current loaded page | Parent screen permission only | CANONICAL UI / incomplete projection | May show compatibility fields not in canonical source |
| Export “Excel” | `handleExportExcel` | Creates data URI and downloads `.csv` | Current loaded page | No dedicated server export gate | LEGACY / INCOMPLETE | Mislabel, incomplete scope, no server audit |
| Print list | `handlePrintList` | Opens `window.open` and calls browser print | Current loaded page | No dedicated server report gate | LEGACY / INCOMPLETE | Popup, page scope, no server certification |
| Profile card print | modal callback | Notification and modal close only | None beyond UI state | No print permission | NOTIFICATION ONLY | False success |
| Guardian link | disabled-looking button | Notification only | Local student projection | No operation permission | NOTIFICATION ONLY | No canonical relationship mutation |
| Guardian call | button | Notification only | Local phone display | No provider/permission | NOTIFICATION ONLY | No external call |
| Guardian message | button | Notification only | Local phone/email display | No provider/permission | NOTIFICATION ONLY | No SMS/email delivery |
| Report cards | reports tab cards | list print only; identity/certificate cards unavailable | Current page only | No dedicated report permission | MIXED | Cards advertise unavailable features |
| Import Excel | modal | Explicit refusal; no file accepted | None | No import route in active flow | NOT_IMPLEMENTED / BLOCKED | Correct fail-closed state |
| Batch transfer | modal | Disabled; handler fails closed | None | Transfer contract not approved | BLOCKED BY DEPENDENCY | Correctly prevents partial writes |

## Legacy / Dead-Code Inventory

No active import from the current `StudentAffairsPortal.tsx` path was found for:

- `src/components/student-affairs/StudentAffairsHeader.tsx`;
- `src/components/student-affairs/StudentSearchPanel.tsx`;
- `src/components/student-affairs/StudentTimeline.tsx`;
- `src/components/student-affairs/StudentActivities.tsx`;
- `src/components/student-affairs/StudentUniform.tsx`;
- `src/components/student-affairs/StudentTransport.tsx`;
- `src/components/student-affairs/StudentLibrary.tsx`;
- `src/components/student-affairs/StudentMedicalInformation.tsx`;
- `src/components/student-affairs/StudentGuardianInformation.tsx`;
- `src/components/student-affairs/StudentAcademicInformation.tsx`;
- `src/components/student-affairs/StudentDocuments.tsx`.

These are **dead-code candidates / legacy alternate UI**, not deleted by this mission. The unused `StudentSearchPanel` contains a per-student `Promise.all` delete action and must not be reactivated as a bulk operation without a separate canonical transaction contract.

## Permission Matrix Observed

| Action | Active canonical permission evidence | Finding |
|---|---|---|
| View students | `Student.View` | Present on list route |
| Create/update students | `Student.Write`, registration-specific permission | Present on write routes |
| Delete students | `Student.Delete` | Present on delete route |
| Export students | No canonical `Student.Export` in `PermissionRegistry` | Gap for server-certified export |
| Print students/cards | No canonical `Student.Print` in `PermissionRegistry` | Gap for server-certified print |
| Guardian link | `Student.Guardian.Link` exists for registration rules, but no active guardian-link endpoint in this UI action | Contract mismatch |
| SMS/call | No Student Affairs provider permission/route found | Not implemented |
| Documents | Dedicated document permissions and middleware exist | Canonical metadata path |

## Classification Rules Used

- `CANONICAL`: active path with trusted server contract and real business effect.
- `LEGACY`: older path or local client behavior retained for compatibility.
- `DEAD-CODE`: no active import found and not proven dynamically reachable; recorded as candidate only.
- `NOT_IMPLEMENTED`: explicit unavailable or missing business operation.
- `NOTIFICATION ONLY`: click causes a toast/warning but no business effect.
- `BLOCKED BY DEPENDENCY`: deliberately disabled pending an approved contract or infrastructure dependency.

