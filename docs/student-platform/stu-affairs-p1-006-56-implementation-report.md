# STU-AFFAIRS-P1-006-56 — تقرير التنفيذ

## الحالة

CODE-LEVEL CLOSED — DOCUMENT LIST COLUMN/DENSITY TRUTHFULNESS

## النطاق

مراجعة أعمدة جدول Student Documents metadata وتحسين كثافته وصدق القيم المعروضة داخل الواجهة فقط.

## التغييرات

- الأعمدة الحالية تعتمد على الحقول الكانونية الموجودة: العنوان، المرجع، `student_id`، التصنيف، lifecycle status، verification status، current version، والإجراء المرتبط بـdocumentId.
- تغيير عنوان العمود إلى «الطالب / المعرّف» لتوضيح أن الاسم المعروض lookup من قائمة الطلاب الموثوقة، مع استخدام `student_id` الحقيقي عند غياب الاسم.
- استبدال قيمة التصنيف الافتراضية غير الدلالية بحالة صريحة «غير متوفر» عند غياب `category_name` و`category_code`.
- عدم إضافة owner أو upload status أو binary availability أو scan status أو download count أو storage location أو أي metadata غير موجودة في العقد.
- الحفاظ على responsive horizontal scroll وmin-width، دون إخفاء action أو field ضروري.
- الحفاظ على search/filter/sort، Error ≠ Empty، no-match، sequence guards، selection/details consistency، canonical refresh، accessibility، وno false-success.

## حدود العقد الحالي

تم التحقق من أن `student_id`, `title`, `document_reference`, `category_name/category_code`, `lifecycle_status`, `verification_status`, `current_version_number`, `id` موجودة في canonical list response. الاسم المعروض للطالب ليس قيمة ملفقة؛ هو lookup من `students` الموثوقة، مع fallback إلى المعرّف الكانوني نفسه.

## النطاق المستبعد

لا تغييرات في API أو backend أو الخدمات أو المستودعات أو قاعدة البيانات أو SQL أو RLS أو Storage أو المصادقة أو العزل.

