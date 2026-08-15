# STU-AFFAIRS-P1-006-47 — تقرير التنفيذ

## الحالة

CODE-LEVEL CLOSED — STUDENT DOCUMENTS METADATA SUBMISSION CONCURRENCY GUARD

## النطاق

حارس إرسال على مستوى واجهة نموذج تسجيل metadata في Student Documents فقط. لا يوجد تعديل في API أو عقد idempotency أو الخادم.

## التغييرات

- إضافة guard متزامن باستخدام `useRef` لمنع دخول submission ثانٍ قبل انتهاء الأول، حتى قبل أن تكتمل إعادة تصيير React.
- إبقاء زر الحفظ معطلًا أثناء الطلب وإظهار `جارٍ الحفظ…`.
- إعادة تمكين الحفظ بعد النجاح أو 4xx أو 409 أو timeout/network/unknown outcome.
- عدم تنفيذ retry تلقائي لأي mutation.
- الحفاظ على dirty state والمدخلات عند الفشل أو النتيجة غير المؤكدة.
- السماح بإعادة المحاولة اليدوية بعد انتهاء الطلب.

## الملفات

- `src/modules/student-documents/presentation/StudentDocumentsPortal.tsx`
- `src/__tests__/studentDocumentsPortal.test.tsx`
- `docs/student-platform/stu-affairs-p1-006-47-implementation-report.md`
- `docs/student-platform/stu-affairs-p1-006-47-validation.md`

## النطاق المستبعد

لا تغييرات في API أو الخدمات أو المستودعات أو قاعدة البيانات أو SQL أو RLS أو Storage أو المصادقة أو العزل أو الرفع الثنائي.

