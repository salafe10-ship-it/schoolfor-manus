# تشغيل بيئة Staging على Windows

## جاهزية PowerShell

تحتاج هذه البيئة إلى Node.js وnpm وأدوات PostgreSQL 17.11. تُحفظ مساراتها في
`PATH` الخاص بمستخدم Windows، لذلك أغلق نافذة PowerShell القديمة وافتح نافذة
جديدة بعد إعدادها. تحقق من الإتاحة:

```powershell
node --version
npm --version
pg_dump --version
pg_restore --version
psql --version
```

إذا كانت نافذة PowerShell الحالية مفتوحة قبل تحديث `PATH`، أعد فتحها. ويمكن
للجلسة الحالية استخدام المسارين المسجلين للمستخدم مباشرة:

```powershell
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'User') + ';' + [Environment]::GetEnvironmentVariable('Path', 'Machine')
```

## استعادة الإعداد والتحقق

من مجلد العمل `fees-module-repair`:

```powershell
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
npm --version
pg_restore --version
npm run staging:restore
npm run staging:verify
npm run staging:backup
npm run staging:backup:restore-rehearsal
```

يستعيد الأمر الأول `.env.staging` من مخزن Windows DPAPI المحلي عند الحاجة،
ويتحقق الثاني من أن عنواني قاعدة البيانات يشيران إلى مشروع Staging المحدد.
ينشئ الأمر الثالث نسخة من مخطط `public` وبياناته، ويتحقق من أرشيفها، ثم
يحفظها مشفّرة خارج المستودع. تستخدم الاتصالات شهادة Supabase والتحقق الصارم
من TLS. تبقى الكتابة المالية مقفلة افتراضيًا.

بعد استعادة المخطط، يعطي `staging:backup:restore-rehearsal` اسم قاعدة محلية جديدة.
أكمل عليها التحقق المتكرر، دون لمس Staging:

```powershell
npm run staging:schema-replay -- <database-name>
npm run staging:rls-rehearsal -- <database-name>
npm run staging:schema-audit -- --rehearsal <database-name> --summary
```

تُنشأ قاعدة اختبار محلية على `127.0.0.1:63991`، ويُسجّل بيانها محليًا. اختبارات
العزل تستخدم صفوفًا اصطناعية داخل معاملة تُلغى في النهاية.

## اختبارات الوحدات عبر التطبيق

التحقق من قاعدة Staging واستعادة المخطط جاهزان. لاختبارات HTTP التي تكتب من خلال
التطبيق، يلزم أيضًا حساب اختبار محدود، ورمز دخول حالي، ومعرّفات fixtures اصطناعية
خاصة بمشروع Staging. أسماء إعدادات المالية وشؤون الطلاب موجودة في
`.env.staging.example`. املأها محليًا فقط، ثم شغّل `npm run staging:save` لحفظها
مشفّرة في مخزن Windows. تبقى قيم التأكيد فارغة والقفل المالي مفعّلًا افتراضيًا؛
لا تفعّل الاختبار قبل التأكد أن عنوان التطبيق وقاعدة البيانات كلاهما Staging.

بعد تعبئة fixtures صالحة، أوامر اختبارات التطبيق هي:

```powershell
npm run uat:student-fees:staging
npm run uat:student-affairs:staging
```

قد تنتهي صلاحية رمز الدخول؛ جدّده عند كل انتهاء واحفظ القيمة الجديدة محليًا.
لا تضع الرمز أو كلمات المرور أو مفاتيح الخدمة في Git أو في المحادثة. لا تستخدم
معرّفات طلاب حقيقيين كـfixtures.

المخزن المحلي مرتبط بحساب Windows الحالي على هذا الجهاز. بعد تغيير الجهاز أو
حساب Windows، أعد إدخال بيانات Staging من لوحة Supabase عبر نموذج الإعداد المحلي
ثم نفّذ `npm run staging:save`. لا تنقل ملف `.env.staging` أو ملف DPAPI إلى Git.

## النسخ والاستعادة

تُحفظ النسخ المنطقية في:

```text
%LOCALAPPDATA%\EduPro\schoolfor-manus\staging\backups
```

وتُحمى بصلاحيات مجلد المستخدم وتشفير DPAPI. نسخة `public` المنطقية تساعد على
التحقق والتراجع عن تغييرات مخطط التطبيق؛ أما استعادة المشروع الكامل فتتم من
نسخ Supabase الاحتياطية المجدولة. اختبر الاستعادة في قاعدة محلية معزولة قبل
اعتماد أي ترحيل على Staging.

ينشئ `staging:backup:restore-rehearsal` قاعدة محلية جديدة على `127.0.0.1:63991`
ويفك النسخة المشفّرة مؤقتًا داخل مجلد محمي، ثم يستعيد **المخطط فقط** باستخدام
`pg_restore --schema-only`. يستبعد بيانات الجداول، ويحذف الملف المؤقت بعد
التحقق، ويترك قاعدة مخطط فارغة وبيانًا محليًا يمكن تمريره إلى
`npm run staging:schema-replay -- <database-name>`. هذا يثبت استعادة مخطط
النسخة المنطقية؛ ولا يحل محل اختبار استعادة نسخة Supabase الكاملة إلى مشروع
استعادة منفصل.

## تدوير المفاتيح

- غيّر كلمة مرور دور `postgres` في مشروع Staging عند الحاجة، ثم أعد إكمال نموذج
  إعداد الاتصال المحلي.
- احتفظ بدور `edupro_staging_app` المحدود منفصلًا، ولا تمنحه صلاحيات تجاوز RLS.
- حدّث المفاتيح المحلية المشفّرة عبر `npm run staging:save`، ثم أعد
  `npm run staging:verify` و`npm run staging:restore`.
- لا تطبع كلمات المرور أو المفاتيح في الطرفية أو السجلات، ولا تضع مفتاح
  `service_role` في المتصفح أو ملفات البناء.
