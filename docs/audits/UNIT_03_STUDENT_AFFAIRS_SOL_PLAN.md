# UNIT 03 — Student Affairs — SOL 5.6 Review & Implementation Plan

الحالة: `LUNA IMPLEMENTATION IN PROGRESS / SOL FINAL REVIEW BLOCKED FOR FULL UAT`

## Evidence from visible Browser UAT

| ID | Problem | Root Cause | Impact | Severity |
|---|---|---|---|---|
| STU-SOL-001 | Dashboard يعرض اختصار «شؤون الطلاب» لحساب لا يملك `Student.View`. | `ModernSchoolDashboard` يبني قائمة الاختصارات من قائمة ثابتة، و`ClientAuthorization` لا يملك الصلاحيات الفعلية من قاعدة البيانات. | المستخدم يدخل مسارًا سيُرفض من الخادم؛ عدم اتساق بين UX وAPI. | High |
| STU-SOL-002 | Student Affairs تُركّب ثم تعرض `403 Student.View` داخل جدول البيانات. | `App` يربط `activeSection === 'students'` مباشرة بالبوابة دون حارس صلاحية موثوق قبل mount، والبوابة تبدأ القراءة فورًا. | تجربة مضللة وتسريب مسار فشل متكرر؛ لا ينبغي بدء القراءة غير المصرح بها. | High |
| STU-SOL-003 | مؤشرات Student Affairs قد تبدأ طلبًا مستقلًا بعد mount رغم رفض القراءة. | لا يوجد gate مشترك يعتمد على effective permissions التي قررها الخادم. | طلب زائد وتنبيه فشل بدل صفحة رفض مفهومة. | Medium |
| STU-SOL-004 | لا يمكن إكمال Add/Edit/Delete/Search/Export في هذه الجلسة. | صلاحية الحساب الحالية لا تشمل `Student.View`، وأي تجاوز سيكون خطأ أمنيًا. | UAT لبقية دورة الوحدة محجوب إلى أن تُمنح الصلاحية أو يُستخدم حساب مناسب. | High |
| STU-SOL-005 | API/tenant/RLS path | `server.ts` وmiddleware يفرضان `authenticateRequest` ثم `requirePermissionOnly(Student.View)`، والـ403 من الخادم هو السلوك الصحيح. | لا تعديل مطلوب لتخفيف حماية الخادم. | PASS |
| STU-SOL-006 | الحذف الجماعي كان يعلن النجاح بعد `Promise.all(fetch(...))` دون فحص `response.ok`. | المسار يتجاوز `StudentRepository` ويعتبر اكتمال الشبكة نجاحًا حتى مع رد 4xx/5xx. | اختفاء محلي كاذب وفقدان تطابق UI مع الخادم، مع احتمال نجاح جزئي غير معلن. | High |
| STU-SOL-007 | أزرار التعديل/الحذف/التصدير/الاستيراد كانت تعتمد على الدور أو بلا permission hint صريح. | `StudentAffairsPortal` لا يمرر effective action permissions إلى controls؛ server authorization وحده كان يمنع الطلب بعد الضغط. | واجهة توحي بقدرة غير موجودة وتزيد محاولات 403. | High |
| STU-SOL-008 | تعديل طالب موجود فشل من الواجهة عند غياب بيانات ولي الأمر، رغم أن العملية لا تغيّر ولي الأمر. | تحقق ولي الأمر كان يطبق على الإضافة والتعديل معًا، بينما بيانات UAT القديمة لا تحتوي guardian. | منع تعديل بيانات الطالب المشروع، مع رسالة مضللة قبل وصول الطلب للخادم. | Medium |
| STU-SOL-009 | نموذج التعديل أرسل تاريخ الميلاد بصيغة timestamp بدل `YYYY-MM-DD`. | قيمة التاريخ الكانونية لم تُطبّع عند فتح نموذج التعديل، وعقد الخادم يقبل تاريخًا تقويميًا فقط. | رفض API لتعديل صحيح ظاهريًا؛ لا persistence. | High |
| STU-SOL-010 | تصدير XLSX فشل قبل تنزيل الملف وسجل تحذيرًا عن fallback غير الكانوني. | `StudentExportService` كان يستدعي `AuditRepository.create` القديم قبل أن يسجل route سجل `audit_events` الكانوني؛ fallback مرفوض في الإنتاج أوقف التصدير. | فشل وظيفة تصدير حقيقية واحتمال تعطل مسار الطلب بدل نتيجة واضحة. | Critical |
| STU-SOL-011 | نموذج إضافة الطالب يفرض `status` في الحفظ لكنه لا يعرض حقلًا لاختياره. | حالة النموذج تُصفّر إلى قيمة فارغة، والتحقق يمنع الحفظ، بينما JSX لم يكن يرسم select للحالة. | تعذر تسجيل أي طالب جديد من الواجهة حتى مع اكتمال الاسم والتاريخ وولي الأمر. | High |
| STU-SOL-012 | بعد نجاح القراءة، بطاقات ومؤشر سجل الطلاب كانت تعرض `0` ورسالة «لا توجد سجلات» رغم ظهور 10 صفوف حقيقية. | مسار `/api/student-affairs/metrics` اعتمد على `Supabase count` غير موثوق وأعاد الصفر؛ كما خلطت الواجهة بين KPI العام ونتيجة الاستعلام. | تضليل مباشر للمستخدم، وإمكانية اعتبار الوحدة فارغة رغم وجود بيانات كانونـية. | Critical |
| STU-SOL-013 | عند البحث عن طالب واحد كان تذييل الجدول يعرض إجمالي المدرسة بدل إجمالي نتيجة البحث. | التذييل استخدم `studentMetrics.totalCount` بدل `studentQueryMeta.totalCount`. | ترقيم وملخص بحث غير صحيحان رغم أن API أعاد النتيجة الصحيحة. | Medium |
| STU-SOL-014 | اختبار الطباعة كان يعتمد على نافذة منبثقة لا يمكن إثبات ظهورها في Browser UAT. | `window.open` ونافذة `window.print` خارج سطح الرصد الحالي؛ نجاح الإشعار وحده لا يثبت المعاينة. | لا يمكن قبول الطباعة كاختبار حي أمام المستخدم. | High |
| STU-SOL-015 | إضافة الطالب من الواجهة كانت تستخدم مسار التوافق `/api/students` وصلاحية `Student.Write` مع مفتاح idempotency مولّد على الخادم عند غيابه. | `handleSaveStudent` كان يستدعي `saveStudent` لكل من الإضافة والتعديل؛ ومسار التسجيل الكانوني لم يكن يستقبل payload الواجهة بعد تطبيع `toCanonicalRegistrationCommand`. | حدّ أضعف لصلاحية التسجيل واحتمال إنشاء سجل مكرر عند إعادة المحاولة بعد نتيجة شبكة غير معروفة. | High |

## Required fix

لا يجوز جعل الواجهة مصدر سلطة بديلًا. المطلوب مزامنة effective permissions التي يحددها الخادم إلى جلسة العميل للعرض والحراسة فقط، مع بقاء middleware الخادم هو صاحب القرار النهائي.

## Files expected to change

- `src/middleware/trustedAuthentication.ts`
- `src/middleware/trustedSessionManager.ts`
- `src/authorization/ClientAuthorization.ts`
- `server.ts`
- `src/components/ModernSchoolDashboard.tsx`
- `src/App.tsx`
- `src/components/StudentAffairsPortal.tsx`
- `src/components/student-affairs/repository/StudentRepository.ts`
- `src/modules/student-export/application/StudentExportService.ts`
- `src/database/repositories/CanonicalStudentReadRepository.ts`
- `src/database/services/StudentService.ts`
- `src/__tests__/stuAffairsP1Export.test.ts`
- `src/__tests__/canonicalStudentRead.test.ts`
- `src/__tests__/studentAffairsQueryMetaContract.test.ts`
- `src/__tests__/stuAffairsP2StudentListPrint.test.ts`
- `src/__tests__/studentRegistrationClientRouteContract.test.ts`
- tests for trusted session permissions, Dashboard action gating, and Student Affairs preflight.

## Implementation steps for LUNA

1. يضيف الخادم effective tenant permissions الناتجة من `roleResolver` إلى identity/session response دون قبولها من العميل.
2. يطبع العميل هذه الصلاحيات كإشارة حراسة، ويفشل مغلقًا إذا كانت القائمة موجودة ولا تحتوي الصلاحية المطلوبة.
3. يحجب Dashboard الاختصارات والأزرار غير المصرح بها، مع guard إضافي عند navigation.
4. يعرض App صفحة رفض صلاحية قبل mount لـStudent Affairs ولا يطلق طلب الطلاب عند غياب `Student.View`.
5. يبقي كل حمايات الخادم وRLS كما هي؛ لا يضيف wildcard ولا يغير Business Rule.
6. يجعل مسار التصدير يسجل في `public.audit_events` الكانوني فقط داخل معاملة PostgreSQL، ولا يستدعي fallback قديمًا من طبقة إنشاء ملف XLSX.
7. ينقل مؤشرات Student Affairs إلى استعلام PostgreSQL الكانوني بنفس `TenantContext`، ويرفض مصدرًا إحصائيًا غير موثوق بدل إرجاع أصفار وهمية.
8. يفصل KPI المدرسة عن `meta.totalCount` الخاص بالبحث/الصفحة في التذييل وحالة القائمة.
9. يستبدل نافذة الطباعة غير القابلة للرصد بمعاينة داخلية مرئية، مع إبقاء البيانات الحساسة خارج الكشف وإتاحة أمر الطباعة من المعاينة.
10. يوجه إنشاء الطالب الجديد إلى `/api/student-registration` بصلاحية `Student.Registration.Create`، ويرسل مفتاح idempotency ثابتًا طوال محاولة التسجيل، بينما يبقى التعديل على مساره المستقل.

## Tests and acceptance criteria

- حساب بلا `Student.View` لا يرى أو لا يستطيع تفعيل Student Affairs action، ولا يُطلق طلب `/api/students` من Dashboard.
- حساب يملك `Student.View` يصل إلى Student Affairs ويبدأ القراءة الكانونية فقط بعد الحارس.
- الخادم يظل يرفض الطلبات غير المصرح بها حتى لو عُدلت الواجهة.
- Login/Dashboard/Student Affairs regression وlint وbuild ناجحة.
- Browser UAT يعاد من Login → Dashboard → Student Affairs؛ هذه الجلسة الحالية تبقى `UNVERIFIED/BLOCKED` لبقية العمليات حتى يتوفر حساب بصلاحية `Student.View`.

## LUNA implementation result and SOL gate

- `PASS`: صلاحيات tenant المشتقة من الخادم أصبحت جزءًا من جلسة العرض، مع fail-closed عند غيابها.
- `PASS`: Dashboard يخفي اختصار Student Affairs ويعطّل بحث الطلاب للحساب الحالي.
- `PASS`: App لا يركّب Student Affairs ولا يبدأ shared student hydration دون `Student.View`.
- `PASS`: الحماية الخادمية وRLS لم تُضعف.
- `FIXED`: الحذف الجماعي يستخدم `StudentRepository.softDeleteStudent` ويفحص كل نتيجة؛ الفشل الجزئي يعرض عدد النجاح/الفشل ولا يخفي السجلات غير المؤكدة.
- `FIXED`: أزرار Student.Write / Student.Delete / Student.Export أصبحت مرتبطة بـeffective permissions الموثوقة، مع حراسة handler إضافية.
- `FIXED`: تعديل طالب موجود لا يتطلب guardian جديدًا ما لم تكن العملية تسجيلًا جديدًا.
- `FIXED`: تاريخ الميلاد يُطبّع إلى `YYYY-MM-DD` قبل إرسال التعديل.
- `IMPLEMENTED / RETEST REQUIRED`: أزيل استدعاء audit fallback القديم من خدمة XLSX؛ route يسجل نجاح/فشل التصدير في `public.audit_events` داخل معاملة PostgreSQL الكانونية.
- `FIXED`: نموذج الإضافة يعرض اختيار حالة القيد الكانونية (`active`, `suspended`, `inactive`) ويربطه مباشرة بـ`formData.status`.
- `FIXED / VERIFIED`: مؤشرات Student Affairs أصبحت من استعلام PostgreSQL الكانوني؛ لم تعد تعتمد على `Supabase count` غير الموثوق، وحالات الانسحاب تُقرأ من الحالة الكانونية `withdrawn`.
- `FIXED / VERIFIED`: تذييل الجدول وحالة الفراغ يستخدمان `studentQueryMeta.totalCount`، مع إبقاء بطاقات KPI على إجمالي النطاق العام.
- `FIXED / LIVE UAT PASS`: زر الطباعة يعرض معاينة داخلية مرئية من 10 صفوف؛ تحقق Browser UAT من ظهور رقم الطالب والاسم والحالة، وعدم ظهور هاتف ولي الأمر أو الهوية.
- `FIXED / REGRESSION PASS`: إنشاء الطالب الجديد أصبح يمر عبر المسار الكانوني مع `Student.Registration.Create` ومفتاح idempotency ثابت، والخادم يطبع payload الواجهة قبل استدعاء خدمة التسجيل الذرية.
- `RUNTIME UAT PENDING`: لم تُرسل عملية Add بعد في المتصفح؛ يلزم تنفيذها أمام المستخدم ثم إثبات PostgreSQL وReload، وبعدها Delete بتأكيد لحظي مستقل.

قرار SOL النهائي المؤقت: `🔴 REJECTED — REPAIR REQUIRED / RUNTIME UAT BLOCKED` للإغلاق الكامل للوحدة. إصلاح STU-SOL-012 إلى STU-SOL-015 مقبول مبدئيًا بعد الاختبارات الآلية؛ Add/Delete/Persistence الحية ما زالت بوابة الإغلاق الأخيرة.
