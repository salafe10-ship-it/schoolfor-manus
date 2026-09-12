/**
 * Canonical Arabic presentation for the identity and access-control surfaces.
 * Permission keys remain stable integration identifiers; labels and ordering do
 * not depend on the API returning English resource/action names.
 */
export type PresentedPermission = {
  permissionKey: string;
  resource: string;
  action: string;
};

type ModulePresentation = { label: string; order: number };

const MODULES: Record<string, ModulePresentation> = {
  Dashboard: { label: 'لوحة التحكم', order: 10 },
  Student: { label: 'شؤون الطلاب', order: 20 },
  StudentDocument: { label: 'مستندات الطلاب', order: 21 },
  Admission: { label: 'القبول والتسجيل', order: 22 },
  Exam: { label: 'الامتحانات والنتائج', order: 30 },
  Attendance: { label: 'الحضور والانصراف', order: 31 },
  Hr: { label: 'الموارد البشرية', order: 40 },
  Financial: { label: 'الحسابات والمالية', order: 50 },
  Ledger: { label: 'دفتر الأستاذ', order: 51 },
  Invoice: { label: 'الفواتير والتحصيل', order: 52 },
  Inventory: { label: 'إدارة المخزون والمشتريات', order: 60 },
  Procurement: { label: 'طلبات الشراء', order: 61 },
  Warehouse: { label: 'المستودعات', order: 62 },
  Assets: { label: 'إدارة الأصول', order: 70 },
  Fixed_assets: { label: 'سجل الأصول', order: 71 },
  Library: { label: 'المكتبة', order: 80 },
  Buses: { label: 'النقل المدرسي', order: 81 },
  Uniform_management: { label: 'الزي المدرسي', order: 82 },
  Branches: { label: 'الفروع', order: 90 },
  Identity: { label: 'المستخدمون والصلاحيات', order: 100 },
  Permissions: { label: 'إدارة الصلاحيات', order: 101 },
  Audit: { label: 'سجل الرقابة', order: 102 },
  Database: { label: 'إدارة قاعدة البيانات', order: 103 },
  Settings: { label: 'الإعدادات', order: 104 },
  Ai: { label: 'المساعد الذكي', order: 110 },
};

const ACTIONS: Record<string, string> = {
  View: 'عرض', Read: 'قراءة', Write: 'إضافة وتعديل', Insert: 'إضافة', Edit: 'تعديل',
  Delete: 'حذف', Export: 'تصدير', Print: 'طباعة', Import: 'استيراد', Create: 'إنشاء',
  Verify: 'تحقق', Archive: 'أرشفة', Approve: 'اعتماد', Cancel: 'إلغاء', Post: 'ترحيل',
  Reverse: 'عكس القيد', Forecast: 'تنبؤ', Chat: 'محادثة', Assign: 'إسناد', Audit: 'تدقيق',
  Link: 'ربط', Override: 'تجاوز مضبوط', Monitor: 'مراقبة', Settings: 'إعدادات',
  Simulate: 'محاكاة', Optimize: 'تحسين', Backup: 'نسخة احتياطية', Refresh: 'تحديث',
  Borrow: 'إعارة', Sales: 'المبيعات', Stock: 'المخزون', Users: 'المستخدمون',
  AccessLog: 'سجل الوصول', Version: 'الإصدار', Registration: 'التسجيل',
  Guardian: 'ولي الأمر', Number: 'الرقم', Duplicate: 'التكرار', Audit_logs: 'سجل التدقيق',
};

export function permissionModuleLabel(resource: string): string {
  return MODULES[resource]?.label || 'وحدة متخصصة';
}

export function permissionModuleOrder(resource: string): number {
  return MODULES[resource]?.order ?? 999;
}

export function comparePermissionResources(left: string, right: string): number {
  const byOrder = permissionModuleOrder(left) - permissionModuleOrder(right);
  return byOrder || permissionModuleLabel(left).localeCompare(permissionModuleLabel(right), 'ar');
}

export function permissionActionLabel(action: string): string {
  const parts = String(action || '').split('.').filter(Boolean);
  return parts.map((part) => ACTIONS[part] || 'إجراء مخصص').join(' — ') || 'إجراء مخصص';
}

export function permissionDisplayLabel(permission: PresentedPermission): string {
  return `${permissionModuleLabel(permission.resource)} — ${permissionActionLabel(permission.action)}`;
}
