# UNIT 03 — Student Affairs — Durable Checkpoint

آخر تحديث: `2026-08-22`

هذا checkpoint محفوظ في المشروع ليكون نقطة استئناف بعد إعادة تشغيل أو انقطاع كهرباء. لا يعني إغلاق الوحدة.

## SOL state

- القرار: `NOT CLOSED — RUNTIME UAT BLOCKED`.
- آخر findings: `STU-SOL-008` إلى `STU-SOL-015` موثقة في خطة SOL؛ أُصلح STU-SOL-012 إلى STU-SOL-015، واختُبر STU-SOL-012 إلى STU-SOL-014 حيًا.
- لا انتقال إلى الوحدة التالية قبل إكمال Add/Delete/Persistence UAT وإصدار SOL Final Acceptance.

## LUNA saved implementation

- Student edit validation لا يطلب guardian عند تعديل بيانات الطالب فقط.
- تاريخ الميلاد في edit يُرسل بصيغة `YYYY-MM-DD`.
- Student export لا يستدعي legacy audit fallback؛ route يسجل canonical `public.audit_events` داخل PostgreSQL transaction.
- Add Student form يعرض حقل `حالة القيد` ويربطه بـ`formData.status` مع الخيارات canonical.
- مؤشرات Student Affairs تُقرأ من PostgreSQL الكانوني ضمن `TenantContext`، ولا تعتمد على `Supabase count` غير الموثوق.
- تذييل البحث يستخدم `studentQueryMeta.totalCount`؛ UAT الحي أثبت نتيجة 1 من 1 ثم baseline 10 من 10 بعد reload.
- الطباعة تعرض معاينة داخلية مرئية؛ UAT الحي أثبت 10 صفوف مع منع بيانات الهاتف والهوية من الظهور.
- التسجيل الجديد يمر عبر `/api/student-registration` بصلاحية `Student.Registration.Create` ومفتاح idempotency ثابت لكل محاولة، مع تطبيع الخادم للـpayload.
- الملفات الأساسية: `server.ts`, `src/components/StudentAffairsPortal.tsx`, `src/modules/student-export/application/StudentExportService.ts`, والاختبارات المرتبطة.

## Verification state

- `npm run lint`: `PASS`.
- Targeted regression: `13 files / 54 tests — PASS`.
- SPA build: `PASS`.
- Server bundle: `PASS`; running on local port `10004`.
- Browser read/edit: passed with PostgreSQL persistence and reload verification.
- Browser metrics/search/reload after latest restart: passed visibly; 10 rows and consistent KPI values, then 1-of-1 search and 10-of-10 baseline after reload.
- Browser export after fix: visible success notification; PostgreSQL aggregate shows `STUDENT_EXPORT_SUCCESSFUL / success` count `2` and prior `STUDENT_EXPORT_FAILED / failure` count `1`.
- Browser print preview: `PASS` بعد الإصلاح؛ أمر الطباعة ظاهر من داخل المعاينة، بينما نافذة النظام النهائية ليست شرط القبول الوحيد.
- Browser add/delete: not claimed yet. The form is prepared with a disposable non-sensitive record; no create request has been sent, and direct PostgreSQL verification found `TEST-UAT-ADD-01` count `0` before the action.

## Resume instruction

1. Keep `http://localhost:10004/` open in the visible Browser.
2. Dashboard → `شؤون الطلاب` using the already authorized session.
3. Execute Add with the prepared disposable non-sensitive record using a browser interaction that updates native date/select React state, verify reload and database persistence, then request action-time confirmation immediately before Delete and verify the count returns to baseline.
4. Complete Add → reload → database persistence → action-time-confirmed Delete → reload, then obtain SOL final acceptance.
