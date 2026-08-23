# UNIT 01 — Login — SOL 5.6 Audit and Remediation Plan

الحالة: `SOL FINAL REVIEW COMPLETE / ACCEPTED WITH NON-BLOCKING ITEMS`

## A. Evidence-based findings

| ID | المجال | النتيجة | الدليل | الأولوية |
|---|---|---|---|---|
| LOGIN-SOL-001 | Identity / Tenant | `FAIL` | `src/App.tsx` يهيّئ `selectedSchool` من `schoolsSeed[0]` قبل وجود جلسة، ويدير كتالوج `saasSchools` ببيانات مدرسية وإحصاءات ثابتة. | High |
| LOGIN-SOL-002 | Tenant isolation / URL | `FAIL` | معالج `?school` يبحث في الكتالوج المحلي ويغيّر المدرسة المعروضة قبل التحقق؛ الرابط يجب أن يكون إشارة عرض فقط لا مصدر نطاق. | High |
| LOGIN-SOL-003 | Identity fallback | `FAIL` | `applyTrustedSessionUser` يدمج الهوية الموثوقة مع `seededSchool` ويضع سنة افتراضية ثابتة عند غيابها. | High |
| LOGIN-SOL-004 | Pre-auth state | `FAIL` | حالات `loginSchoolId`, `loginRole`, `loginUsername`, `loginPassword`, `adminUsername`, `adminPassword` تحتوي قيمًا تعريفية ثابتة غير لازمة لتدفق الدخول. | Medium |
| LOGIN-SOL-005 | Security/UX claim | `FAIL` | شاشة الدخول تعرض ادعاء `256-bit SSL` دون دليل runtime أو مصدر canonical داخل هذه الوحدة. | Medium |
| LOGIN-SOL-006 | Production diagnostics | `FAIL` | `setCurrentPortal` يطبع stack trace إلى console عند كل تغيير حالة. | Medium |
| LOGIN-SOL-007 | Server authentication | `PASS` | `server.ts` يتحقق من Supabase Auth ويعيد `identity.school`, `identity.branch`, `identity.role` من الخادم؛ لا يقبل school/role من body. | — |
| LOGIN-SOL-008 | Identifier/recovery contract | `PASS` | `SchoolClientLogin` يرسل identifier، وخدمة recovery تعيد رسالة عامة ولا تكشف وجود الحساب. | — |
| LOGIN-SOL-009 | Runtime UAT | `PASS — bounded UAT` | المستخدم أدخل اعتماد UAT مؤقتًا في المتصفح؛ ظهرت مدرسة UAT-B ولوحة التحكم، ثم بقيت الجلسة بعد Reload. لا تُحفظ الاعتمادات في التقرير. | — |

## B. LUNA 5.6 implementation plan — لا يبدأ قبل اعتماد خطة SOL

1. استبدال حالة المدرسة الابتدائية بكائن محايد غير قابل للاستخدام كنطاق، وعدم كتابة `active_school_id` قبل جلسة موثوقة.
2. حذف كتالوج المدارس التجريبي من `App.tsx` وعدم استخدام fallback محلي في `applyTrustedSessionUser`.
3. جعل URL parameter إشارة غير موثوقة لا تغيّر `selectedSchool`، والاعتماد على الهوية التي يعيدها الخادم.
4. حذف حالات بيانات الدخول التعريفية غير المستخدمة.
5. إزالة ادعاء SSL الثابت واستبداله برسالة تصف ما يثبت فعليًا: المصادقة المركزية وحماية الجلسة.
6. إزالة stack trace التشخيصي من التنقل.
7. إضافة اختبارات عقدية تمنع عودة synthetic identity/catalog/claim، ثم تشغيل الاختبارات ذات الصلة وlint/build.

## C. Acceptance criteria for SOL gate

- لا توجد مدرسة أو دور أو اسم مستخدم أو كلمة مرور ثابتة في حالة ما قبل الدخول.
- لا يستطيع query parameter اختيار tenant أو branch.
- لا تُعرض بيانات المدرسة إلا من `TrustedSessionUser.school` بعد نجاح الخادم.
- فشل الخادم يبقي التطبيق على شاشة الدخول بحالة محايدة.
- اختبارات Login/Auth/Tenant وlint وbuild ناجحة؛ Browser UAT المرئي للدخول ولوحة التحكم وإعادة التحميل ناجح.
- يبقى API method/status trace وقراءة قاعدة البيانات المباشرة `UNVERIFIED` بسبب حدود قناة المتصفح الحالية، ولا تُستخدم هذه الفجوة لادعاء نجاح إضافي.
- Browser UAT مرئي؛ عند عدم توفر اعتماد canonical صالح: `RUNTIME UAT BLOCKED` ولا إغلاق Runtime.
