# SchoolForManus — Unit Closure Ledger

الحالة العامة: `IN PROGRESS`

هذا السجل لا يمنح أي وحدة حالة إغلاق تلقائية. كل وحدة تحتاج دورة `SOL → LUNA → SOL` وتقرير إغلاق نهائي مستقل.

| الترتيب | الوحدة | الحالة | ملاحظة بوابة الحالة |
|---:|---|---|---|
| 01 | Login | `ACCEPTED WITH NON-BLOCKING ITEMS` | Browser UAT المرئي Login → Dashboard → Reload ناجح؛ API trace وDB read-only موثقـان كـUNVERIFIED. |
| 02 | Dashboard | `ACCEPTED WITH NON-BLOCKING ITEMS` | Browser UAT وReload والحالات الحية/غير المتاحة والحراسة نجحت؛ API trace وDB read-only موثقـان كـUNVERIFIED. |
| 03 | Student Affairs | `NOT CLOSED — BLOCKERS REMAIN` | القراءة/الحفظ/التحرير/الحارس/التصدير/الطباعة/المصادقة/الاختبارات مثبتة؛ الشهادات وExcel import والتخزين الثنائي والنقل/الترقية ومصدر stage/grade/section ما زالت تمنع الإغلاق. راجع `CODEX_STUDENT_AFFAIRS_FINAL_CLOSURE_REPORT.md`. |
| 04 | Academics / Academic Structure | `PENDING` | — |
| 05 | Admissions / Registration | `PENDING` | — |
| 06 | Attendance | `PENDING` | — |
| 07 | Exams & Results | `UNIT CLOSED` | UAT حي مكتمل: 3 دورات إلكترونية مؤرشفة، تصدير CSV/XLSX/RTL، اعتماد جدول ونتائج، ومحضر خادمي غير قابل للتعديل. راجع `UNIT_07_EXAMS_CHECKPOINT.md`. |
| 08 | Fees / Student Finance | `PENDING SOL GATE` | توجد إصلاحات واختبارات سابقة؛ يلزم تقرير الوحدة الكامل. |
| 09 | General Finance / Accounting | `BLOCKED — SOURCE OF TRUTH REQUIRED` | إعادة الفحص المحاسبي: 10 ملفات/10 اختبارات ناجحة، لكن لا يوجد مخطط PostgreSQL محاسبي كانوني أو عقد مالك معتمد. راجع `acc-002-general-accounting-discovery-audit.md`. |
| 10 | General Ledger | `BLOCKED — OWNER CONTRACT REQUIRED` | القراءة/الحواجز الأمنية مثبتة، بينما الترحيل والكتابة والإقفال والتقارير الكانونية غير قابلة للاعتماد قبل ACC-001/ACC-002. |
| 11 | HR | `UNIT CLOSED — ACCEPTED WITH NON-BLOCKING INTEGRATION ITEMS` | UAT حي مكتمل: حفظ وإعادة تحميل مركزيان، تحقق وتراجع ذري، اعتماد مسير، تدقيق تقرير، تنظيف بيانات الاختبار، وصحة Staging. تكامل الملفات الثنائية والبصمة واختبار العزل الحي المعزز غير مانعة. راجع `UNIT_11_HR_COMPREHENSIVE_AUDIT_2026-08-27.md`. |
| 12 | Payroll | `PENDING — ACCOUNT MAPPINGS REQUIRED` | اعتماد المسير داخل HR مثبت، لكن الدفع والترحيل المالي لم ينفذا لأن خرائط الحسابات المطلوبة `0/4`. لم يُنشأ أي قيد مالي. |
| 13 | Inventory | `UNIT CLOSED — LIVE UAT-B OPERATIONAL; SCHOOLFOR-MANUS RENDER BOUNDARY VERIFIED` | migrations المالية/المخزون مطبقة، حماية القيود والدفتر العام فعالة، وUAT خادمي معزول أثبت 4 قيود متوازنة و8 أسطر دفتر عام وإعادة ترحيل idempotent. نُشر الإصدار `a9afacb` على خدمة `schoolfor-manus-staging` بحالة Live، ونُفذت دورة PR → RFQ → عرض → PO → GRN → فاتورة في UAT-B مع ظهور قيدي الاستلام والالتزام، واستمرارية PO بحالة `مستلم بالكامل` بعد إعادة التحميل. تم التحقق من أن خدمة `edupro-school-erp` في Production مرتبطة بمستودع وفرع مختلفين، وتُركت كما هي دون تعديل. تبقى السجلات محفوظة كأدلة داخل UAT-B، والسداد النقدي خارج نطاق الوحدة ضمن الخزينة. راجع `UNIT_13_INVENTORY_PROCUREMENT_COMPREHENSIVE_AUDIT_2026-08-29.md`. |
| 14 | Fixed Assets | `PENDING SOL GATE` | توجد إصلاحات واختبارات سابقة؛ يلزم تقرير الوحدة الكامل. |
| 15 | Administration | `PENDING` | — |
| 16 | Reports | `PENDING` | — |
| 17 | Permissions / RBAC | `PENDING` | — |
| 18 | Settings | `PENDING SOL GATE` | توجد إصلاحات واختبارات سابقة؛ يلزم تقرير الوحدة الكامل. |
| 19 | Notifications / Communication | `PENDING` | — |
| 20 | Documents / Attachments | `PENDING` | — |
| 21 | Parent / Student Portal | `PENDING` | التحقق من وجود النطاق الفعلي مطلوب. |
| 22+ | أي وحدات إضافية يكتشفها الفحص | `PENDING DISCOVERY` | لا تُعتبر القائمة نهائية قبل جرد المشروع. |

## سجل الدورة الحالية

- الدور الحالي: `SOL — GENERAL AUDIT / BASELINE REVIEW`
- نتيجة الإغلاق العام: `UNVERIFIED`
- الدور التالي: `SOL — UNIT 01 LOGIN FINAL AUDIT`
- تنفيذ LUNA: يبدأ فقط من خطة SOL موثقة لكل مجموعة إصلاح.
- قرار المشروع: `NOT READY FOR DELIVERY`
