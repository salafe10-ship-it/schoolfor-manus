# Benchmark الفجوات — الحسابات العامة ورسوم الطلاب

تاريخ الجولة: 2026-08-24

## نطاق القرار

هذا المستند يحوّل تقرير المستشار المرفق إلى مقارنة قابلة للتدقيق على نطاق
وحدتي الحسابات العامة ورسوم الطلاب فقط. أسماء الأنظمة العشرة وخصائصها المرجعية
منقولة من التقرير المرفق، وليست ادعاءً باختبار مباشر لمنتجات الغير. عند غياب
دليل محدد نستخدم `NOT VERIFIED` بدل التخمين.

الحكم في عمود SchoolForManus:

- `VERIFIED`: يوجد مسار فعلي واختبار أو تحقق حي موثق.
- `INCOMPLETE`: يوجد جزء من المسار، لكن طبقة أو خطوة مطلوبة ما زالت ناقصة.
- `UNVERIFIED`: لم ننفذ العملية الحية لأنها تغيّر قيودًا مالية أو تحتاج بيانات اعتماد.
- `NOT VERIFIED`: لا يوجد دليل كافٍ داخل هذه الجولة.

## مصفوفة القدرات

| Capability | SchoolForManus | PowerSchool | Infinite Campus | Skyward | Veracross | Blackbaud K-12 | FACTS | Gradelink | Fedena | OpenEduCat | YemenSoft | Best Benchmark | Gap / القرار |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| دورة الطالب والرسوم | VERIFIED: فواتير، أرصدة، رسوم، تحصيل، تقارير | Student lifecycle | Student information / registration | Student management | Student lifecycle | School management | Tuition / enrollment | Student information | Student / fees | Student lifecycle | NOT VERIFIED | PowerSchool + FACTS | لا فجوة P1 في النطاق الحالي |
| إنشاء مطالبة رسوم وربط الإيراد | VERIFIED: حساب إيراد صريح لكل بند مع فحص النشاط والفرعية | NOT VERIFIED | NOT VERIFIED | Finance | Finance | Finance | Tuition / finance | NOT VERIFIED | Fees | Accounting | Financial accounting | FACTS + OpenEduCat | أُغلقت فجوة الربط الشكلي؛ يلزم ضبط دليل الحسابات لكل مدرسة |
| إثبات الذمم عند إصدار الفاتورة | VERIFIED: مدين ذمم الطلاب، دائن الإيراد عبر الخدمة الكانونية | NOT VERIFIED | NOT VERIFIED | Finance | Finance | Finance | Tuition / finance | NOT VERIFIED | Fees | Accounting | Financial accounting | FACTS + Skyward | لا فجوة P1 مثبتة |
| تحصيل الطالب وتسوية الذمم | VERIFIED: مدين نقدية/بنك، دائن ذمم الطلاب، مع منع التكرار | NOT VERIFIED | NOT VERIFIED | Finance | Finance | Finance | Tuition / finance | NOT VERIFIED | Fees | Accounting | Financial accounting | FACTS + YemenSoft | أُصلحت الفجوة: لم يعد التحصيل يضاعف الإيراد |
| اعتماد ثم ترحيل ثم عكس | INCOMPLETE: المسار والاختبارات موجودة؛ الاختبار الحي المغير للبيانات مؤجل | NOT VERIFIED | NOT VERIFIED | Administrative workflows | Workflow automation | NOT VERIFIED | Integrated financial operations | NOT VERIFIED | NOT VERIFIED | Workflow / extensibility | Workflows المؤسسية | يلزم UAT مصرح به ببيانات اختبار معتمدة |
| دفتر الأستاذ والقيد المزدوج | VERIFIED: خدمة ترحيل كانونية، توازن، قراءة دفتر وتقارير | NOT VERIFIED | NOT VERIFIED | Finance | Finance | Finance | Finance | NOT VERIFIED | Accounting | Accounting | Financial accounting | Skyward + OpenEduCat + YemenSoft | لا فجوة P1 داخل المسار المختبر |
| ربط الحسابات القابل للتهيئة | VERIFIED: حساب المستند ثم ربط المدرسة ثم افتراضي موثق | Integrations | District administration | Administrative workflows | Integrated operations | Integrated operations | Integrated finance | NOT VERIFIED | Multi-module operations | Extensibility / integrations | ERP | OpenEduCat + YemenSoft | يلزم استكمال mappings للمخزون والأصول والرواتب عند فتح تلك الوحدات |
| الاستيراد والتصدير والتقارير | VERIFIED: استيراد XLSX، قالب XLSX، CSV/XLSX/PDF، طباعة وتقارير بفلاتر | Reporting / analytics | Reporting | NOT VERIFIED | NOT VERIFIED | Analytics | NOT VERIFIED | Report cards | NOT VERIFIED | NOT VERIFIED | Reports | PowerSchool + Blackbaud | لا فجوة P1 مثبتة؛ يلزم تحقق طباعة فعلي في بيئة العميل |
| العمليات الجماعية | VERIFIED: توزيع رسوم جماعي مع فحص حساب الإيراد قبل الإنشاء | District-scale operations | District administration | Workflows | Workflow automation | NOT VERIFIED | Enrollment / tuition | NOT VERIFIED | Broad ERP operations | Modular ERP | Institutional workflows | PowerSchool + Infinite Campus | لا نضيف وظائف جماعية غير مرتبطة بمصدر مالي |
| الإلغاء والأثر العكسي | VERIFIED في الكود: سبب إلزامي، قيد عكسي، إعادة الذمم؛ غير منفذ حيًا | NOT VERIFIED | NOT VERIFIED | Finance workflows | Finance workflows | Finance workflows | Finance workflows | NOT VERIFIED | NOT VERIFIED | Accounting | Financial accounting | Skyward + YemenSoft | يلزم UAT غير مدمر أو نسخة اختبار قبل إغلاق الإنتاج |
| الصلاحيات، العزل، والتدقيق | VERIFIED على مستوى عقود المسارات واختبارات RBAC/tenant/audit؛ UAT يعتمد الحساب المصرح | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | Open architecture | Institutional administration | NOT VERIFIED | لا نعتبر تشابه المنتجين دليلًا؛ نكمل اختبار الدور على بيئة UAT |
| الأداء، الهاتف، والتوسع | NOT VERIFIED في هذه الجولة الوظيفية | District-scale operations | District administration | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | Simplicity / usability | Broad ERP | Extensibility | ERP | NOT VERIFIED | خارج إغلاق GL/Fees الحالي؛ يحتاج قياسًا مستقلًا |

## الفجوات الجذرية التي عولجت

1. كان مسار سند تحصيل الطالب في واجهة رسوم الطلاب ينشئ قيدًا دائنًا على
   `4101` مباشرة، حتى عندما كانت الفاتورة قد أثبتت ذمم الطالب. هذا يؤدي إلى
   تضخيم الإيراد وعدم تسوية الذمم. أصبح الطرف الدائن `1201` (ذمم الطلاب)
   افتراضيًا صريحًا، مع حفظ `receivableAccount` في سند القبض وعرضه في دفتر
   الأستاذ.
2. كان حساب الإيراد في إعدادات الرسوم يقبل نصًا حرًا دون فحص كافٍ. أصبحت
   الشاشة تستخدم الحسابات النشطة والفرعية من دليل الحسابات عندما تكون متاحة،
   وتمنع الحفظ والاستيراد والتوزيع الجماعي إذا كان الحساب مفقودًا أو غير نشط
   أو تجميعيًا.
3. أصبحت الفاتورة الجماعية تحفظ `revenueAccount` المختار كي يستخدمه الترحيل
   الكانوني بدل إسقاط الاختيار والعودة إلى حساب افتراضي غير مقصود.
4. تم تصحيح عرض سند التحصيل في شاشة الأستاذ حتى لا تُعرض سندات التحصيل العامة
   على أنها ذمم طلاب، مع إبقاء الذمم لسندات الطالب فقط.

## ما لم يُضف عمدًا

لم نضف وظائف شكلية مثل شاشة جديدة أو زر بلا أثر محاسبي. كما لم ننفذ قيدًا أو
إلغاءً أو اعتمادًا حقيقيًا على بيانات المدرسة في هذه الجولة؛ تقرير المستشار
يمنع العمليات المالية الحقيقية غير المصرح بها. لذلك تبقى دورة UAT الحية
للكتابة/الإلغاء `UNVERIFIED` إلى أن تتوفر بيئة اختبار مستقلة أو تأكيد صريح
لبيانات اختبار قابلة للعكس.

## أدلة التحقق الحالية

- `npm run lint` يمر بعد التعديلات.
- حزمة اختبارات الحسابات والرسوم المختارة: 14 ملفًا، 20 اختبارًا ناجحًا.
- اختبار الخدمة الكانونية يثبت أن الفاتورة تستخدم الذمم/الإيراد المربوطين،
  وأن التحصيل يستخدم النقدية/الذمم، وأن القيود متوازنة ولا تتكرر.
- تحقق المتصفح السابق لوحدتي الحسابات والرسوم أثبت فتح الشاشات، التقارير،
  الفلاتر، التصدير، الطباعة، وقالب الاستيراد دون خطأ ظاهر. لم تُنفذ عمليات
  مالية مدمرة أو حذف بيانات حقيقية.

## قرار هذه الجولة

تم إغلاق فجوة P1 المكتشفة في الربط بين رسوم الطلاب والحسابات العامة، مع إبقاء
الفجوات التي تحتاج دليلًا حيًا أو نطاقًا جديدًا معلّمة بوضوح. لا يُعلن إغلاق
الوحدتين إنتاجيًا قبل إعادة تشغيل UAT للكتابة في بيئة اختبار معتمدة، ثم فحص
القيد، الأستاذ، الرصيد، التقرير، إعادة التحميل، والتدقيق بعد كل عملية.
