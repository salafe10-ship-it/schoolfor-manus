# UNIT 02 — Dashboard — SOL 5.6 Review & Implementation Plan

الحالة: `SOL FINAL REVIEW COMPLETE / ACCEPTED WITH NON-BLOCKING ITEMS`

## SOL review evidence

| ID | Problem | Root Cause | Impact | Severity | Required fix / result |
|---|---|---|---|---|---|
| DASH-SOL-001 | Dashboard كان يعرض مسار Student Affairs لحساب يرفضه API. | اختصارات ثابتة مع fallback لصلاحيات الدور عند غياب hint الخادم. | UX غير متسق مع API وقد يبدأ طلبًا غير مصرح. | High | تم ربط الاختصارات والحراسة بقائمة الخادم، مع fail-closed عند غيابها. |
| DASH-SOL-002 | طلب shared student hydration كان يظهر في Dashboard رغم عدم امتلاك `Student.View`. | effect لم يكن مقيدًا بالوحدة النشطة والصلاحية. | 403 متكرر وتنبيه مضلل. | High | تم تقييد effect بـStudent Affairs + trusted permission فقط. |
| DASH-SOL-003 | بعض مؤشرات Dashboard كانت قابلة للظهور كأرقام ثابتة دون مصدر. | مصادر metrics غير مكتملة أو غير موثقة في العقد الحالي. | خطر اعتبار demo data بيانات تشغيلية. | High | Dashboard يعرض `—` ورسالة مصدر غير متاح، أو القيمة الحية من RLS فقط. |
| DASH-SOL-004 | API method/status trace وDB direct verification غير متاحين من قناة المتصفح الحالية. | Browser capability لا تعرض Network/Performance API الآمن المطلوب. | لا يجوز ادعاء trace أو DB persistence. | Medium | توثيق `UNVERIFIED` وعدم رفع درجة الإغلاق. |

## Files / implementation steps

- `src/components/ModernSchoolDashboard.tsx`: filter/guard quick actions and disable unauthorized student search.
- `src/authorization/ClientAuthorization.ts`: use server-derived permission hint; fail closed for tenant modules when absent, keeping Dashboard as safe landing surface.
- `src/App.tsx`: prevent unauthorized Student Affairs mount and shared hydration.
- `src/middleware/trustedAuthentication.ts`, `src/middleware/trustedSessionManager.ts`, `server.ts`: carry server-derived tenant permissions to the client as a visibility hint; server middleware remains authoritative.

## Tests and acceptance criteria

- Visible Dashboard loads after trusted Login and Reload: `PASS`.
- Live `public.students (RLS)` count rendered as `10`; `public.enrollments (RLS)` rendered as `0` in the observed session: `PASS`.
- Unavailable finance/attendance/teacher sources render `—` with an explicit source message: `PASS`.
- Student search is visibly disabled and unauthorized quick actions are hidden: `PASS`.
- No new `Shared student hydration failed` log after the repaired reload: `PASS`.
- API trace and direct DB verification: `UNVERIFIED`, documented as non-blocking for this bounded Dashboard acceptance.

## SOL final decision

`ACCEPTED WITH NON-BLOCKING ITEMS` for the reviewed Dashboard surface. This is not a project-wide delivery approval and does not close Student Affairs CRUD.
