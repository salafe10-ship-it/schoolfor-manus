# وحدة رسوم الطلاب — مسار العمليات الكانوني

## قاعدة التشغيل

الـ Snapshot القديم أصبح نموذج قراءة/توافق فقط. العمليات الجديدة تكتب إلى PostgreSQL في جداول موحدة داخل معاملة واحدة، مع عزل المدرسة، مفتاح تكرار، وسجل تدقيق.

## المسارات

| المسار | الغرض |
|---|---|
| `GET /api/financial/fee-templates` | قراءة قوالب الرسوم من المصدر المركزي |
| `POST /api/financial/fee-templates` | إنشاء قالب رسم بإصدار وسنة وفترة وحساب إيراد |
| `POST /api/financial/fee-assignments/bulk` | توزيع رسم جماعي آمن من التكرار، مع خيار إصدار المطالبات |
| `POST /api/financial/invoices/issue` | إصدار مطالبة واحدة بمفتاح idempotency |
| `POST /api/financial/invoices/:invoiceId/installment-plan` | إنشاء خطة أقساط محفوظة مع معالجة كسور المبالغ |
| `POST /api/financial/concessions` | طلب منحة/إعفاء يحتاج اعتمادًا |
| `POST /api/financial/concessions/:id/approve` | اعتماد المنحة أو الإعفاء وتسجيل القرار |
| `GET /api/financial/students/:studentId/account` | كشف حساب الطالب من الفواتير والدفعات المركزية |
| `POST /api/financial/payment-intents` | إنشاء محاولة دفع مرتبطة بمزود خارجي |
| `POST /api/financial/payment-webhooks/:provider` | استقبال Webhook موقّع وبشكل idempotent |
| `POST /api/financial/payment-attempts/:id/settle` | تحويل محاولة دفع ناجحة إلى سند قبض موثق |
| `POST /api/financial/receipts/:receiptId/allocate` | تخصيص السند على فاتورة وقسط محدد |

## الضوابط

- لا توجد كتابة مالية جديدة إلى `FallbackStorage` أو ملفات JSON في staging/production.
- لا يمكن إعادة توزيع نفس الرسم للطالب في نفس السنة والفترة والقالب.
- لا يمكن أن تتجاوز الدفعة رصيد السند أو الفاتورة.
- لا يمنح السلوك أو اسم ولي الأمر خصمًا تلقائيًا؛ يجب وجود سياق أسري ومنحة معتمدة.
- Webhook يحدّث حالة محاولة الدفع فقط؛ إنشاء السند والترحيل يتطلبان مستخدمًا ماليًا موثقًا.
- جميع عمليات الإنشاء والتعديل مرتبطة بـ `tenant_id` و`school_id`.

## متطلبات النشر

1. تطبيق migration `202609081500_canonical_student_fee_operations.sql`.
2. ضبط `EDUPRO_ENVIRONMENT=staging|production`.
3. ضبط `PAYMENT_WEBHOOK_SECRET` قبل استقبال Webhooks.
4. تشغيل اختبارات RLS على الجداول الجديدة.
5. عدم تفعيل بوابة الدفع قبل اختبار التسوية والتخصيص ورد المبالغ في بيئة staging.
