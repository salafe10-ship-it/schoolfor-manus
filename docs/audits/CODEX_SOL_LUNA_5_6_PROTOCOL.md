# CODEX — SOL 5.6 / LUNA 5.6 Audit and Repair Protocol

الحالة: `IN PROGRESS`

هذا المستند يثبت أمر التشغيل الإلزامي المضاف إلى بروتوكول مراجعة SchoolForManus:

> SOL 5.6 يراجع ويكتشف ويصنف الفجوات ويضع خطة الإصلاح التفصيلية.  
> LUNA 5.6 ينفذ الإصلاحات الآمنة داخل نطاق المشروع.  
> بعد التنفيذ يعود SOL 5.6 للمراجعة المستقلة وإصدار قرار البوابة.

## الفصل الإلزامي للأدوار — النسخة المعتمدة

### SOL 5.6 — Audit / Plan / Gate

يتولى SOL، قبل أي تغيير:

- مراجعة البنية والكود وقاعدة البيانات وواجهات API والصلاحيات والعزل متعدد المستأجرين.
- مراجعة الأزرار وسير العمل والوظائف الناقصة وتجربة المستخدم.
- تحديد الدليل لكل نتيجة بالتصنيف `PASS` أو `FAIL` أو `FIXED` أو `UNVERIFIED` أو `NOT APPLICABLE`.
- إعداد خطة إصلاح قابلة للتنفيذ، محددة بالملف والسبب ونطاق التغيير والاختبارات ومعايير القبول والمخاطر.
- منع إغلاق الوحدة إذا بقيت فجوة حرجة/عالية أو اختبار أساسي غير مثبت.
- تنفيذ مراجعة نهائية مستقلة بعد تغييرات LUNA.
- عدم تعديل كود الوحدة أثناء مرحلة Review؛ مخرجه هو `Review & Implementation Plan` فقط.
- صياغة كل مشكلة بصيغة: `PROBLEM → ROOT CAUSE → IMPACT → REQUIRED FIX → FILES → IMPLEMENTATION STEPS → TESTS → ACCEPTANCE CRITERIA`.
- تصنيف الخطورة: `Critical / High / Medium / Low`.

### LUNA 5.6 — Implement / Test / Record

يتولى LUNA، بعد خطة SOL:

- تنفيذ الإصلاحات الآمنة الواضحة فقط، من الجذر، دون bypass أو تعطيل Authentication/Authorization/RBAC/RLS.
- عدم حذف Validation أو تغيير Business Rules الصحيحة أو تعديل بيانات إنتاجية لمجرد نجاح اختبار.
- تنفيذ التغييرات في مساحة العمل، ثم تشغيل الاختبارات المتأثرة و`lint` و`build` و`git diff --check` بقدر ما يسمح به نطاق التغيير.
- عدم اختلاق نتائج Runtime UAT أو Persistence؛ يسجلها `UNVERIFIED` إذا لم تكن البيئة متاحة.
- تسجيل الملفات والتغييرات والاختبارات والمخاطر المتبقية ونقطة الاستقرار.
- مراجعة خطة SOL مقابل الكود الحالي قبل التنفيذ والتأكد من توافقها مع Architecture.
- عدم تغيير Architecture أو Business Rules من تلقاء نفسه؛ أي احتياج معماري جديد يعود إلى SOL كـ`ARCHITECTURAL FINDING`.
- إذا ظهرت مشكلة جديدة أثناء التنفيذ: يوقف الجزء المتأثر فقط، يسجل Root Cause، ويصلحها إن كانت آمنة أو يرفع قرارًا معماريًا، ثم يعيد الاختبار ويضيفها للتقرير النهائي.

## الحلقة المغلقة الإلزامية للوحدة

لا تنتقل الدورة إلى وحدة أخرى قبل إتمام التسلسل الآتي:

```text
SOL 5.6: REVIEW
  -> ROOT CAUSE ANALYSIS
  -> SOL 5.6: IMPLEMENTATION PLAN
  -> LUNA 5.6: IMPLEMENT
  -> LUNA 5.6: TEST + REGRESSION + CHECKPOINT
  -> LUNA 5.6: IMPLEMENTATION REPORT
  -> SOL 5.6: FINAL REVIEW
  -> (REPAIR REVISION إذا كان الإصلاح ناقصًا أو خاطئًا)
  -> LUNA 5.6: RETEST
  -> SOL 5.6: FINAL ACCEPTANCE
  -> UNIT FINAL CLOSURE REPORT
```

تنفيذ LUNA داخل هذه المهمة يعني تطبيق التغييرات الفعلية في ملفات المشروع بواسطة أدوات التعديل المراجعة، وليس الاكتفاء باقتراح patch نصي من خدمة خارجية. ولا تُعتبر استجابة API الخاصة بـ`/api/ai/sol-luna/review` دليلًا على تنفيذ محلي أو نجاح UAT.

لا تُغلق الوحدة بمجرد تقرير LUNA. سلطة القرار النهائي في المراجعة والإغلاق هي SOL فقط:

- `ACCEPTED`
- `ACCEPTED WITH NON-BLOCKING ITEMS`
- `REJECTED — REPAIR REQUIRED`

ولا تنتقل الوحدة التالية قبل `SOL FINAL ACCEPTANCE` و`LUNA TEST PASS` و`REGRESSION PASS` و`UNIT FINAL CLOSURE REPORT`.

## بوابة الإغلاق

قرار الوحدة واحد من:

- `UNIT CLOSED — DELIVERY READY`
- `UNIT CLOSED WITH DOCUMENTED NON-BLOCKING ITEMS`
- `UNIT NOT CLOSED — BLOCKERS REMAIN`

ولا يجوز إعلان جاهزية المشروع قبل مرور كل الوحدات، نجاح اختبارات الأمان والانحدار والاختبارات الكاملة والبناء، وإثبات وظائف الحفظ والتعديل والحذف والاستعلام والأزرار الأساسية، مع توثيق كل عنصر `UNVERIFIED`.

## Browser UAT المرئي — شرط إلزامي

لكل وحدة، متى كانت بيئة المتصفح متاحة، يجب تنفيذ دورة مرئية أمام المستخدم:

```text
Browser → Login → Dashboard → Module → Screen → Button → Action → Result
        → Reload → Search/Verify → Complete Workflow
```

يشمل ذلك الضغط الفعلي على الأزرار وإدخال بيانات اختبار غير حساسة، وفحص استمرار البيانات بعد إعادة التحميل. أثناء الاختبار يُسجل `HTTP Method` و`Endpoint` و`Status Code` ونجاح/فشل الطلب دون كشف Password أو JWT أو Cookies أو Authorization Header أو أي Secret.

إذا كان مسار القراءة الآمن متاحًا، تُثبت السلسلة `UI → API → Backend → Database → Reload → UI`. وإذا فشل الاختبار، يُحدد أول موضع فشل في السلسلة `Frontend → API → Authentication → Authorization → Tenant → Service → Repository → Database → Transaction → Response → UI` ويُعاد Browser Retest بعد الإصلاح.

إذا لم تتوفر بيئة متصفح أو اعتماد canonical صالح، يسجل التقرير صراحةً `RUNTIME UAT BLOCKED`، ولا تُمنح الوحدة حالة تسليم جاهزة.

## قواعد الحماية

- لا SQL destructive ولا حذف لبيانات إنتاجية.
- لا تجاوز للصلاحيات أو نطاق المدرسة/الفرع/المستأجر.
- لا رسائل نجاح بلا Persistence مثبتة.
- لا إخفاء للأخطاء ولا تحويل فشل الاتصال إلى بيانات وهمية.
- كل مجموعة إصلاح مستقرة تُختبر وتُراجع فروقها وتُحفظ كنقطة استقرار قابلة للاستعادة.
