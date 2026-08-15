# STU-AFFAIRS-P1-006-54 — تقرير التنفيذ

## الحالة

CODE-LEVEL CLOSED — STUDENT DOCUMENTS METADATA LIST SEARCH/FILTER TRUTHFULNESS

## النطاق

تحسين صدق البحث والفلاتر في قائمة مستندات الطلاب metadata داخل الواجهة فقط، اعتمادًا على عقد API الحالي الذي يدعم `search` والفلاتر المعتمدة ويعيد `meta.total`.

## التغييرات

- الاستمرار في إرسال حقول البحث والفلاتر التي يدعمها العقد الحالي فقط: `search`, `studentId`, `categoryId`, `lifecycleStatus`, `verificationStatus`, `classification`, و`retention`.
- إضافة حماية تسلسلية لقائمة النتائج حتى لا تستبدل استجابة بحث قديمة نتيجة بحث أحدث.
- مسح الاختيار والتفاصيل عند كل تغيير بحث أو فلتر، مع إبقاء التفاصيل الكانونية فقط للسجل الموجود في النتيجة الحالية.
- عند عدم وجود نتائج مع فلتر نشط، تعرض الواجهة حالة «لا توجد مستندات تطابق البحث والفلاتر الحالية» مع إجراء واضح لمسح الفلاتر.
- عدم خلط حالة عدم التطابق مع خطأ API، وعدم إعادة استخدام نتائج قديمة عند إزالة الفلتر.
- الحفاظ على حدود P1 السابقة: Error ≠ Empty، canonical refresh، retry قراءة فقط، dirty state، submission guard، accessibility، وعدم false-success.

## حدود العقد الحالي

تم التحقق من العقد القائم: endpoint القائمة يستقبل الحقول المذكورة ويعيد `data` و`meta.total`، كما أن طبقة الخدمة والمستودع تطبق البحث على `document_reference` و`title` وتطبق الفلاتر ضمن tenant/school/branch الموثوق. لم تتم إضافة query parameters أو API أو backend behavior جديد.

## النطاق المستبعد

لا تغييرات في API أو backend أو الخدمات أو المستودعات أو قاعدة البيانات أو SQL أو RLS أو Storage أو المصادقة أو العزل.

