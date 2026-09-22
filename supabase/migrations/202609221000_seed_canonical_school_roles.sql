-- Canonical school identity roles. Idempotent and scoped to existing tenants.
-- This is production data required by the Users & Permissions module, not test data.
BEGIN;

WITH role_specs(role_key, name, description) AS (
  VALUES
    ('schooladmin', 'مدير المدرسة', 'إدارة التشغيل اليومي للمدرسة ضمن نطاقها الموثوق.'),
    ('accountant', 'المحاسب المالي', 'قراءة الحسابات وإدخال العمليات المالية المعتمدة.'),
    ('teacher', 'المعلم', 'الوصول إلى السجلات الأكاديمية المصرح بها.'),
    ('hr', 'مسؤول الموارد البشرية', 'إدارة ملفات الموارد البشرية ضمن المدرسة.')
)
INSERT INTO public.roles
  (tenant_id, school_id, branch_id, role_key, name, description, is_system, status, created_by, updated_by)
SELECT t.id, NULL, NULL, s.role_key, s.name, s.description, true, 'active', NULL, NULL
FROM public.tenants t
CROSS JOIN role_specs s
WHERE t.deleted_at IS NULL
ON CONFLICT (tenant_id, role_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_system = true,
  status = 'active',
  deleted_at = NULL,
  deleted_by = NULL,
  updated_at = now();

INSERT INTO public.permissions (tenant_id, permission_key, resource, action, description, status, created_by, updated_by)
VALUES
  (NULL, 'Dashboard.View', 'Dashboard', 'View', 'Dashboard.View', 'active', NULL, NULL),
  (NULL, 'School.Branding.Write', 'School.Branding', 'Write', 'School.Branding.Write', 'active', NULL, NULL),
  (NULL, 'Student.View', 'Student', 'View', 'Student.View', 'active', NULL, NULL),
  (NULL, 'Student.Write', 'Student', 'Write', 'Student.Write', 'active', NULL, NULL),
  (NULL, 'Exam.View', 'Exam', 'View', 'Exam.View', 'active', NULL, NULL),
  (NULL, 'Exam.Write', 'Exam', 'Write', 'Exam.Write', 'active', NULL, NULL),
  (NULL, 'Hr.View', 'Hr', 'View', 'Hr.View', 'active', NULL, NULL),
  (NULL, 'Hr.Edit', 'Hr', 'Edit', 'Hr.Edit', 'active', NULL, NULL),
  (NULL, 'Financial.Read', 'Financial', 'Read', 'Financial.Read', 'active', NULL, NULL),
  (NULL, 'Financial.Write', 'Financial', 'Write', 'Financial.Write', 'active', NULL, NULL),
  (NULL, 'Inventory.View', 'Inventory', 'View', 'Inventory.View', 'active', NULL, NULL),
  (NULL, 'Inventory.Write', 'Inventory', 'Write', 'Inventory.Write', 'active', NULL, NULL),
  (NULL, 'Identity.Users.Read', 'Identity.Users', 'Read', 'Identity.Users.Read', 'active', NULL, NULL),
  (NULL, 'Identity.Users.Write', 'Identity.Users', 'Write', 'Identity.Users.Write', 'active', NULL, NULL),
  (NULL, 'Identity.Users.Assign', 'Identity.Users', 'Assign', 'Identity.Users.Assign', 'active', NULL, NULL),
  (NULL, 'Identity.Users.Audit', 'Identity.Users', 'Audit', 'Identity.Users.Audit', 'active', NULL, NULL)
ON CONFLICT (permission_key) DO UPDATE SET
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  description = EXCLUDED.description,
  status = 'active',
  deleted_at = NULL,
  deleted_by = NULL,
  updated_at = now();

WITH desired(role_key, permission_key) AS (
  VALUES
    ('schooladmin','Dashboard.View'), ('schooladmin','Student.View'), ('schooladmin','Student.Write'),
    ('schooladmin','Hr.View'), ('schooladmin','Hr.Edit'), ('schooladmin','Financial.Read'),
    ('schooladmin','Inventory.View'), ('schooladmin','Inventory.Write'), ('schooladmin','Identity.Users.Read'),
    ('schooladmin','Identity.Users.Write'), ('schooladmin','Identity.Users.Assign'), ('schooladmin','Identity.Users.Audit'),
    ('schooladmin','School.Branding.Write'),
    ('accountant','Dashboard.View'), ('accountant','Financial.Read'), ('accountant','Financial.Write'),
    ('teacher','Dashboard.View'), ('teacher','Student.View'), ('teacher','Exam.View'), ('teacher','Exam.Write'),
    ('hr','Dashboard.View'), ('hr','Hr.View'), ('hr','Hr.Edit')
)
INSERT INTO public.role_permissions (tenant_id, role_id, permission_id, status, created_by, updated_by)
SELECT r.tenant_id, r.id, p.id, 'active', NULL, NULL
FROM public.roles r
JOIN desired d ON d.role_key = r.role_key
JOIN public.permissions p ON p.permission_key = d.permission_key
WHERE r.school_id IS NULL AND r.branch_id IS NULL
  AND r.status = 'active' AND r.deleted_at IS NULL
  AND p.status = 'active' AND p.deleted_at IS NULL
ON CONFLICT (role_id, permission_id) DO UPDATE SET
  status = 'active', deleted_at = NULL, deleted_by = NULL, updated_at = now();

COMMIT;
