# Deployment Integrity Rules

1. كل Production Build يجب أن يكون قابلاً للتتبع إلى Commit واضح.
2. لا يُعد البناء جاهزاً دون `npm run route-integrity` و`npm run verify:artifact`.
3. لا يُحذف Route أو Component قبل فحص المراجع وتحديث عقدة المسارات.
4. لا يتم تعديل Production مباشرة بطريقة تتجاوز Git وRender Blueprint.
5. لا يُستخدم Force Push أو نشر من فرع غير `master` للإنتاج.
6. يبقى `index.html` غير قابل للتخزين طويل الأجل، بينما الأصول ذات الأسماء المشتقة من المحتوى قابلة للتخزين الآمن.
7. لا يستخدم المشروع Service Worker حالياً؛ لذلك لا توجد طبقة Cache Storage قديمة تحتاج إلى تحديث.
8. يمكن تشغيل `PRODUCTION_URL=https://... npm run smoke:production` للتحقق بعد النشر من Health وBuild Identity وindex وأول أصل.

الفحوصات وقائية فقط ولا تستبدل مصادقة الخادم أو Authorization أو عزل المستأجرين وRLS.
