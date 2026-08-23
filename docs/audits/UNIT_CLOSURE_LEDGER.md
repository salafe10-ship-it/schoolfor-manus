# SchoolForManus — Unit Closure Ledger

الحالة العامة: `IN PROGRESS`

هذا السجل لا يمنح أي وحدة حالة إغلاق تلقائية. كل وحدة تحتاج دورة `SOL → LUNA → SOL` وتقرير إغلاق نهائي مستقل.

| الترتيب | الوحدة | الحالة | ملاحظة بوابة الحالة |
|---:|---|---|---|
| 01 | Login | `ACCEPTED WITH NON-BLOCKING ITEMS` | Browser UAT المرئي Login → Dashboard → Reload ناجح؛ API trace وDB read-only موثقـان كـUNVERIFIED. |
| 02 | Dashboard | `ACCEPTED WITH NON-BLOCKING ITEMS` | Browser UAT وReload والحالات الحية/غير المتاحة والحراسة نجحت؛ API trace وDB read-only موثقـان كـUNVERIFIED. |
| 03 | Student Affairs | `NOT CLOSED — RUNTIME UAT BLOCKED` | القراءة/التعديل/التصدير/المؤشرات/البحث/المعاينة المرئية للطباعة وإعادة التحميل مثبتة حيًا مع PostgreSQL؛ أصلح STU-SOL-012 إلى STU-SOL-015. Add/Delete/Persistence لم تُثبت بعد. |
| 04 | Academics / Academic Structure | `PENDING` | — |
| 05 | Admissions / Registration | `PENDING` | — |
| 06 | Attendance | `PENDING` | — |
| 07 | Exams & Results | `PENDING SOL GATE` | توجد إصلاحات واختبارات سابقة؛ يلزم تقرير الوحدة الكامل. |
| 08 | Fees / Student Finance | `PENDING SOL GATE` | توجد إصلاحات واختبارات سابقة؛ يلزم تقرير الوحدة الكامل. |
| 09 | General Finance / Accounting | `PENDING` | — |
| 10 | General Ledger | `PENDING SOL GATE` | توجد إصلاحات واختبارات سابقة؛ يلزم تقرير الوحدة الكامل. |
| 11 | HR | `PENDING SOL GATE` | توجد إصلاحات واختبارات سابقة؛ يلزم تقرير الوحدة الكامل. |
| 12 | Payroll | `PENDING` | — |
| 13 | Inventory | `PENDING SOL GATE` | توجد إصلاحات واختبارات سابقة؛ يلزم تقرير الوحدة الكامل. |
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
