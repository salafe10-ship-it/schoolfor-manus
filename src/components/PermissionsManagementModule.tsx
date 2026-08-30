import { Award, Ban, BarChart3, Bell, BookOpen, Building2, Bus, CalendarCheck, Check, CheckSquare, ChevronDown, ChevronRight, Coins, Container, CreditCard, Database, DatabaseZap, Eye, FileText, GraduationCap, HelpCircle, Layers, Search, Settings, Settings2, Shield, ShieldAlert, ShieldCheck, Shirt, Sliders, Terminal, UserCheck, Users, WalletCards, Workflow } from 'lucide-react';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SecuritySimulationService } from '../modules/authorization/application/SecuritySimulationService';
import { FallbackStorage } from '../database/repositories/FallbackStorage';
// ==========================================================
// 1. TYPES & DATA DEFINITIONS
// ==========================================================

export const MODULES_SCHEMA: any[] = [];

export const DEFAULT_ROLES = [
  { id: 'admin', name: 'مدير النظام (كامل الصلاحيات)', permissions: ['*'] },
  { 
    id: 'financial_manager', 
    name: 'المدير المالي (كامل الصلاحيات المالية)', 
    permissions: [
      'dashboard:view', 'dashboard:refresh',
      'ledger:view', 'ledger:create_jv', 'ledger:post_jv', 'ledger:close_year',
      'fees:view', 'fees:create_receipt', 'fees:approve_receipt', 'fees:print',
      'assets:view', 'assets:depreciate', 'assets:create',
      'reports:view', 'reports:export',
      'settings:view', 'settings:edit',
      'permissions:view', 'permissions:edit', 'permissions:audit_logs',
      'view_reports', 'view_account_statement', 'view_jv', 'view_original_docs'
    ] 
  },
  { 
    id: 'accountant', 
    name: 'كبير المحاسبين (ترحيل مالي)', 
    permissions: [
      'dashboard:view',
      'ledger:view', 'ledger:create_jv', 'ledger:post_jv',
      'fees:view', 'fees:create_receipt', 'fees:print',
      'assets:view',
      'reports:view', 'reports:export',
      'view_reports', 'view_account_statement', 'view_jv', 'view_original_docs'
    ] 
  },
  { 
    id: 'cashier', 
    name: 'أمين الصندوق (القبض والتحصيل)', 
    permissions: [
      'dashboard:view',
      'fees:view', 'fees:create_receipt', 'fees:print',
      'view_reports'
    ] 
  },
  { 
    id: 'student_affairs', 
    name: 'مسئول شئون الطلاب والقبول', 
    permissions: [
      'dashboard:view',
      'students:view', 'students:create', 'students:edit', 'students:import',
      'attendance:view', 'attendance:edit'
    ] 
  },
  { 
    id: 'hr_manager', 
    name: 'مسئول شئون العاملين والرواتب', 
    permissions: [
      'dashboard:view',
      'hr:view', 'hr:create', 'hr:edit', 'hr:attendance',
      'attendance:view', 'attendance:edit'
    ] 
  },
  { 
    id: 'control', 
    name: 'مسئول الكنترول والنتائج', 
    permissions: [
      'dashboard:view',
      'exams:view', 'exams:edit', 'exams:recalculate', 'exams:publish'
    ] 
  },
  { 
    id: 'warehouse_keeper', 
    name: 'أمين المخزن والمستودع', 
    permissions: [
      'dashboard:view',
      'warehouse:view', 'warehouse:create', 'warehouse:audit'
    ] 
  },
  { 
    id: 'assets_manager', 
    name: 'مسئول الأصول والتجهيزات', 
    permissions: [
      'dashboard:view',
      'assets:view', 'assets:create', 'assets:depreciate'
    ] 
  },
  { 
    id: 'auditor', 
    name: 'مدقق مالي مساعد (رقابة فقط)', 
    permissions: [
      'dashboard:view',
      'ledger:view', 'fees:view', 'students:view', 'hr:view', 'reports:view',
      'view_reports', 'view_account_statement', 'view_jv'
    ] 
  }
];

export const INITIAL_USERS = [
  { 
    id: 'user_001', 
    name: 'سليمان غازي', 
    roleId: 'financial_manager', 
    role: 'المدير المالي (كامل الصلاحيات)', 
    department: 'الإدارة المالية', 
    jobTitle: 'المدير المالي العام',
    permissions: [
      'dashboard:view', 'dashboard:refresh',
      'ledger:view', 'ledger:create_jv', 'ledger:post_jv', 'ledger:close_year',
      'fees:view', 'fees:create_receipt', 'fees:approve_receipt', 'fees:print',
      'assets:view', 'assets:depreciate', 'assets:create',
      'reports:view', 'reports:export',
      'settings:view', 'settings:edit',
      'permissions:view', 'permissions:edit', 'permissions:audit_logs',
      'view_reports', 'view_account_statement', 'view_jv', 'view_original_docs'
    ], 
    maxLimit: 100000 
  },
  { 
    id: 'user_002', 
    name: 'منصور خلف', 
    roleId: 'accountant', 
    role: 'كبير المحاسبين (ترحيل مالي)', 
    department: 'الحسابات العامة', 
    jobTitle: 'رئيس قسم الأستاذ العام',
    permissions: [
      'dashboard:view',
      'ledger:view', 'ledger:create_jv', 'ledger:post_jv',
      'fees:view', 'fees:create_receipt', 'fees:print',
      'assets:view',
      'reports:view', 'reports:export',
      'view_reports', 'view_account_statement', 'view_jv', 'view_original_docs'
    ], 
    maxLimit: 50000 
  }
];

export type PermissionType =
  | 'full'
  | 'manager'
  | 'operator'
  | 'viewer'
  | 'auditor'
  | 'finance_operator'
  | 'inventory_operator'
  | 'academic_operator'
  | 'hr_operator'
  | 'it_operator'
  | 'custom';

export const PERMISSION_TYPE_LABELS: Record<PermissionType, string> = {
  full: 'كامل الصلاحيات',
  manager: 'مدير واعتماد',
  operator: 'تشغيل وإدخال',
  viewer: 'عرض فقط',
  auditor: 'رقابة وتدقيق',
  finance_operator: 'تشغيل مالي',
  inventory_operator: 'تشغيل المخزون والمشتريات',
  academic_operator: 'تشغيل أكاديمي وكنترول',
  hr_operator: 'تشغيل الموارد البشرية والرواتب',
  it_operator: 'إدارة تقنية',
  custom: 'مخصص يدوياً'
};

export interface Employee {
  id: string;
  name: string;
  jobTitle: string;
  department: string;
  status: 'active' | 'inactive';
  permissions: string[]; // List of enabled "screenId:action" codes or "*" for Super Admin
  permissionType?: PermissionType;
  avatar?: string;
}

function resolvePermissionType(user: any): PermissionType {
  const explicitType = user?.permissionType as PermissionType | undefined;
  if (explicitType && explicitType in PERMISSION_TYPE_LABELS) return explicitType;
  if (Array.isArray(user?.permissions) && user.permissions.includes('*')) return 'full';

  const roleText = `${user?.roleId || ''} ${user?.role || ''} ${user?.jobTitle || ''} ${user?.department || ''}`.toLocaleLowerCase();
  if (/(مراجع|تدقيق|رقاب|مدقق|auditor)/.test(roleText)) return 'auditor';
  if (/(تقنية|دعم تقني|it|بيانات)/.test(roleText)) return 'it_operator';
  if (/(مخزن|مستودع|تموين|مشتريات|مخزون)/.test(roleText)) return 'inventory_operator';
  if (/(موارد بشرية|شؤون الموظفين|عاملين|رواتب|hr)/.test(roleText)) return 'hr_operator';
  if (/(مال|حساب|خزينة|مالية|محاسب|accountant|cashier)/.test(roleText)) return 'finance_operator';
  if (/(كنترول|امتحان|أكاديم|معلم|تدريس|control)/.test(roleText)) return 'academic_operator';
  if (/(مدير|رئيس|مشرف|manager)/.test(roleText)) return 'manager';
  if (/(عرض|استعلام|viewer|قراءة)/.test(roleText)) return 'viewer';
  return 'custom';
}

function employeePermissionTypeLabel(employee: Pick<Employee, 'permissionType' | 'permissions'>): string {
  const type = employee.permissionType || (employee.permissions.includes('*') ? 'full' : 'custom');
  return PERMISSION_TYPE_LABELS[type] || PERMISSION_TYPE_LABELS.custom;
}

function normalizeEmployee(user: any): Employee {
  const permissions = Array.isArray(user?.permissions) ? user.permissions.filter((permission: unknown): permission is string => typeof permission === 'string') : [];
  const permissionType = resolvePermissionType({ ...user, permissions });
  return {
    id: String(user?.id || user?.name || `employee_${Date.now()}`),
    name: String(user?.name || user?.displayName || 'مستخدم'),
    jobTitle: String(user?.jobTitle || user?.role || 'مستخدم النظام'),
    department: String(user?.department || 'غير مصنف'),
    status: user?.status === 'inactive' ? 'inactive' : 'active',
    permissions,
    permissionType
  };
}

// 24 Real, high-fidelity Arabic employees to match the 24 count in the screenshot
const INITIAL_EMPLOYEES_LIST: Employee[] = [
  // Page 1
  { id: 'emp_1', name: 'أحمد محمد علي', jobTitle: 'مدير شئون الطلاب', department: 'شئون الطلاب', status: 'active', permissions: [] },
  { id: 'emp_2', name: 'سارة عبدالله حسن', jobTitle: 'أخصائي شئون الطلاب', department: 'شئون الطلاب', status: 'active', permissions: [] },
  { id: 'emp_3', name: 'محمد إبراهيم يوسف', jobTitle: 'موظف تسجيل', department: 'القبول والتسجيل', status: 'active', permissions: [] },
  { id: 'emp_4', name: 'فاطمة علي أحمد', jobTitle: 'موظف ملف', department: 'القبول والتسجيل', status: 'active', permissions: [] },
  { id: 'emp_5', name: 'يوسف حسن عبدالله', jobTitle: 'موظف وثائق', department: 'القبول والتسجيل', status: 'active', permissions: [] },
  { id: 'emp_6', name: 'مريم خالد سعيد', jobTitle: 'موظف استقبال', department: 'الاستقبال', status: 'active', permissions: [] },
  { id: 'emp_7', name: 'عبدالله محمد حسين', jobTitle: 'موظف بيانات', department: 'تقنية المعلومات', status: 'active', permissions: [] },
  { id: 'emp_8', name: 'نورة صالح محمد', jobTitle: 'أمين مكتبة', department: 'المكتبة', status: 'active', permissions: [] },
  { id: 'emp_9', name: 'صالح أحمد علي', jobTitle: 'مسؤول نقل', department: 'الخدمات المساندة', status: 'active', permissions: [] },
  { id: 'emp_10', name: 'هند عبد العزيز', jobTitle: 'مسؤول تواصل', department: 'العلاقات العامة', status: 'active', permissions: [] },

  // Page 2
  { id: 'emp_11', name: 'سليمان غازي', jobTitle: 'المدير المالي العام', department: 'الإدارة المالية', status: 'active', permissions: ['*'] },
  { id: 'emp_12', name: 'منصور خلف', jobTitle: 'رئيس قسم الأستاذ العام', department: 'الإدارة المالية', status: 'active', permissions: [] },
  { id: 'emp_13', name: 'رنا جودت', jobTitle: 'مشرف شئون الطلاب والقبول', department: 'القبول والتسجيل', status: 'active', permissions: [] },
  { id: 'emp_14', name: 'عمر الخطيب', jobTitle: 'رئيس وحدة الموظفين ورواتب الكادر', department: 'الموارد البشرية', status: 'active', permissions: [] },
  { id: 'emp_15', name: 'سالم الوحيشي', jobTitle: 'مفتش تدقيق حسابات مساعد', department: 'التفتيش الداخلي', status: 'active', permissions: [] },
  { id: 'emp_16', name: 'عبد المطلب الزاوي', jobTitle: 'أمين مخزن الكتب والزي المدرسي', department: 'التموين والمستودعات', status: 'active', permissions: [] },
  { id: 'emp_17', name: 'فدوى البوسيفي', jobTitle: 'مسئول كنترول الفروع الموحد', department: 'شئون الطلاب', status: 'active', permissions: [] },
  { id: 'emp_18', name: 'خالد عبد الرحمن', jobTitle: 'مسئول الدعم التقني', department: 'تقنية المعلومات', status: 'inactive', permissions: [] },
  { id: 'emp_19', name: 'عبير السقاف', jobTitle: 'سكرتيرة الإدارة العامة', department: 'الاستقبال', status: 'active', permissions: [] },
  { id: 'emp_20', name: 'سلطان الحربي', jobTitle: 'مشرف علاقات عامة', department: 'العلاقات العامة', status: 'active', permissions: [] },

  // Page 3
  { id: 'emp_21', name: 'فيصل محمد العتيبي', jobTitle: 'أخصائي شؤون إدارية', department: 'الخدمات المساندة', status: 'active', permissions: [] },
  { id: 'emp_22', name: 'سعاد أحمد الجابر', jobTitle: 'أخصائي جودة وتدريب', department: 'الجودة والتطوير', status: 'active', permissions: [] },
  { id: 'emp_23', name: 'ماجد بن عون', jobTitle: 'منسق النقل المدرسي', department: 'الخدمات المساندة', status: 'active', permissions: [] },
  { id: 'emp_24', name: 'وفاء الرويلي', jobTitle: 'أمين مركز مصادر التعلم', department: 'المكتبة', status: 'active', permissions: [] }
];

// Auto-seed realistic permissions for all 24 employees based on department and title
INITIAL_EMPLOYEES_LIST.forEach((emp) => {
  if (emp.permissions && emp.permissions.length > 0 && emp.permissions[0] === '*') {
    return; // Keep Super Admin
  }
  
  const perms: string[] = [];
  
  // Common permissions (Dashboard and AI Assistant are always visible/viewable)
  perms.push('dashboard:main:view');
  perms.push('dashboard:ai_assistant:view');
  
  // 1. Student Affairs & Admissions
  if (emp.department === 'شئون الطلاب' || emp.department === 'القبول والتسجيل' || emp.department === 'الاستقبال' || emp.department === 'العلاقات العامة') {
    perms.push('dashboard:branches:view');
    // Student screens
    const studentScreens = ['register_student', 'browse_students', 'edit_student_data', 'delete_student', 'transfer_students', 'archive_students', 'restore_students'];
    studentScreens.forEach(scr => {
      perms.push(`students:${scr}:view`);
      perms.push(`students:${scr}:insert`);
      perms.push(`students:${scr}:edit`);
      if (emp.jobTitle.includes('مدير')) {
        perms.push(`students:${scr}:delete`);
        perms.push(`students:${scr}:export`);
      }
      perms.push(`students:${scr}:print`);
    });
    // Parent screens
    perms.push('parent:parent_directory:view', 'parent:parent_directory:insert', 'parent:parent_directory:edit');
    perms.push('parent:link_students:view', 'parent:link_students:insert', 'parent:link_students:edit');
    // Attendance screens
    perms.push('attendance:daily_roll:view', 'attendance:daily_roll:insert', 'attendance:daily_roll:edit');
    perms.push('attendance:absence_reports:view', 'attendance:absence_reports:export');
    // Transport screens
    perms.push('buses:bus_routes:view');
    perms.push('buses:bus_subscribers:view', 'buses:bus_subscribers:insert');
  }
  
  // 2. Finance, Accounting & HR
  if (emp.department === 'الإدارة المالية' || emp.department === 'الحسابات العامة' || emp.department === 'الموارد البشرية' || emp.department === 'التفتيش الداخلي' || emp.department === 'الجودة والتطوير') {
    // Accounts screens
    perms.push('accounts:chart_of_accounts:view');
    perms.push('accounts:journal_entries:view', 'accounts:journal_entries:insert', 'accounts:journal_entries:edit');
    if (emp.jobTitle.includes('المدير') || emp.jobTitle.includes('رئيس')) {
      perms.push('accounts:journal_entries:approve', 'accounts:journal_entries:post');
    }
    perms.push('accounts:cost_centers:view', 'accounts:cost_centers:insert');
    // Treasury screens
    perms.push('treasury:treasury_vault:view', 'treasury:treasury_vault:insert');
    perms.push('treasury:bank_transfers:view', 'treasury:bank_transfers:insert');
    // Financial reports
    perms.push('financial_reports:trial_balance:view', 'financial_reports:trial_balance:print', 'financial_reports:trial_balance:export');
    perms.push('financial_reports:financial_statements:view', 'financial_reports:financial_statements:print');
    // Fees and Installments
    perms.push('fees:define_fees:view', 'fees:define_fees:insert', 'fees:define_fees:edit');
    perms.push('fees:discounts:view', 'fees:discounts:insert');
    perms.push('fees:receipts:view', 'fees:receipts:insert', 'fees:receipts:print');
    perms.push('fees:installment_schedule:view', 'fees:installment_schedule:insert');
    // Teachers & HR
    perms.push('teachers:teachers_directory:view');
    perms.push('teachers:payroll_processing:view', 'teachers:payroll_processing:insert');
    if (emp.jobTitle.includes('المدير') || emp.jobTitle.includes('رئيس')) {
      perms.push('teachers:payroll_processing:approve', 'teachers:payroll_processing:post');
    }
    perms.push('teachers:staff_attendance:view', 'teachers:staff_attendance:insert');
  }
  
  // 3. Library
  if (emp.department === 'المكتبة') {
    perms.push('library:book_catalog:view', 'library:book_catalog:insert', 'library:book_catalog:edit');
    perms.push('library:borrow_transactions:view', 'library:borrow_transactions:insert');
  }
  
  // 4. Inventory, Warehouses & Transport Support
  if (emp.department === 'التموين والمستودعات' || emp.department === 'الخدمات المساندة') {
    perms.push('inventory:inventory_stock:view', 'inventory:inventory_stock:insert');
    perms.push('inventory:procurement_vouchers:view', 'inventory:procurement_vouchers:insert');
    perms.push('uniform_management:uniform_sales:view', 'uniform_management:uniform_sales:insert');
    perms.push('uniform_management:uniform_orders:view', 'uniform_management:uniform_orders:insert');
    perms.push('buses:bus_routes:view', 'buses:bus_routes:insert');
    perms.push('buses:bus_subscribers:view', 'buses:bus_subscribers:insert');
  }
  
  // 5. IT & System Admins (Full Tech control)
  if (emp.department === 'تقنية المعلومات') {
    perms.push('audit_logs:audit_logs:view');
    perms.push('permissions_admin:permissions_matrix:view', 'permissions_admin:permissions_matrix:insert', 'permissions_admin:permissions_matrix:edit');
    perms.push('system_health:system_monitoring:view');
    perms.push('db_schema:database_editor:view');
  }
  
  emp.permissions = perms;
});

export interface ColumnDefinition {
  id: string; // e.g. 'view', 'add', 'edit'
  label: string;
}

const MATRIX_COLUMNS: ColumnDefinition[] = [
  { id: 'view', label: 'عرض (View)' },
  { id: 'insert', label: 'إدخال (Insert)' },
  { id: 'edit', label: 'تعديل (Edit)' },
  { id: 'delete', label: 'حذف (Delete)' },
  { id: 'approve', label: 'اعتماد (Approve)' },
  { id: 'cancel', label: 'إلغاء (Cancel)' },
  { id: 'post', label: 'ترحيل (Post)' },
  { id: 'reverse', label: 'عكس القيد (Reverse)' },
  { id: 'export', label: 'تصدير (Export)' },
  { id: 'print', label: 'طباعة (Print)' }
];

export interface ScreenItem {
  id: string; // e.g. 'register_student'
  label: string;
  limitedPermissionColumns?: string[]; // Columns to show as orange dashed (صلاحية محدودة)
}

export interface ModuleCategory {
  id: string; // e.g. 'students'
  label: string;
  icon: any;
  screens: ScreenItem[];
}

export const PERMISSIONS_CATEGORIES_TREE: ModuleCategory[] = [
  {
    id: 'dashboard',
    label: 'الرئيسية والإشراف',
    icon: BarChart3,
    screens: [
      { id: 'main', label: 'لوحة التحكم العامة' },
      { id: 'ai_assistant', label: 'المساعد الذكي للذكاء الاصطناعي (AI)' },
      { id: 'branches', label: 'إدارة الفروع والمدارس والـ Tenants' }
    ]
  },
  {
    id: 'students',
    label: 'شئون الطلاب والقبول',
    icon: GraduationCap,
    screens: [
      { id: 'register_student', label: 'تسجيل طالب جديد', limitedPermissionColumns: ['approve'] },
      { id: 'browse_students', label: 'استعراض الطلاب ودليل القبول' },
      { id: 'edit_student_data', label: 'تعديل بيانات الطلاب', limitedPermissionColumns: ['delete'] },
      { id: 'delete_student', label: 'حذف أو إلغاء قيد طالب' },
      { id: 'transfer_students', label: 'نقل الطلاب بين الفروع والصفوف', limitedPermissionColumns: ['import'] },
      { id: 'archive_students', label: 'أرشفة سجلات الطلاب القدامى' },
      { id: 'restore_students', label: 'استعادة الطلاب المؤرشفين', limitedPermissionColumns: ['export'] }
    ]
  },
  {
    id: 'admissions',
    label: 'القبول والتسجيل والاستفسارات',
    icon: UserCheck,
    screens: [
      { id: 'admission_inquiries', label: 'صندوق استفسارات وطلبات القبول' },
      { id: 'admission_workflow', label: 'دورة اعتماد طلبات التسجيل' }
    ]
  },
  {
    id: 'academic',
    label: 'الأكاديمية والجداول الدراسية',
    icon: BookOpen,
    screens: [
      { id: 'academic_classes', label: 'الفصول والمراحل والشعب الدراسية' },
      { id: 'academic_timetable', label: 'الجداول الدراسية وتوزيع الحصص' },
      { id: 'academic_calendar', label: 'التقويم والفترات الدراسية' }
    ]
  },
  {
    id: 'parent',
    label: 'شؤون أولياء الأمور',
    icon: UserCheck,
    screens: [
      { id: 'parent_directory', label: 'دليل بيانات أولياء الأمور' },
      { id: 'link_students', label: 'ربط الطلاب بأولياء الأمور' }
    ]
  },
  {
    id: 'attendance',
    label: 'الحضور والانصراف والغياب',
    icon: CalendarCheck,
    screens: [
      { id: 'daily_roll', label: 'تحضير ورصد غياب الطلاب اليومي' },
      { id: 'absence_reports', label: 'توليد تقارير وإحصائيات الغياب' }
    ]
  },
  {
    id: 'exams',
    label: 'الامتحانات والكنترول والشهادات',
    icon: Award,
    screens: [
      { id: 'exams_dashboard', label: 'لوحة تحكم رصد نتائج الفروع الموحدة' },
      { id: 'exam_templates', label: 'نماذج وبناء جداول الاختبارات' },
      { id: 'exam_certs', label: 'توليد وطباعة شهادات التميز الأكاديمي' }
    ]
  },
  {
    id: 'library',
    label: 'المكتبة المدرسية والمصادر',
    icon: BookOpen,
    screens: [
      { id: 'book_catalog', label: 'دليل وفهرسة المراجع والكتب' },
      { id: 'borrow_transactions', label: 'عمليات الاستعارة وسجلات الذمم' }
    ]
  },
  {
    id: 'teachers',
    label: 'المعلمون والكوادر البشرية',
    icon: Users,
    screens: [
      { id: 'teachers_directory', label: 'دليل المعلمين ومسؤولي الفروع' },
      { id: 'payroll_processing', label: 'مسيرات الرواتب والمستحقات المالية' },
      { id: 'staff_attendance', label: 'الحضور والغياب والعمل الإضافي للكادر' }
    ]
  },
  {
    id: 'accounts',
    label: 'الحسابات العامة والأستاذ العام',
    icon: WalletCards,
    screens: [
      { id: 'chart_of_accounts', label: 'شجرة الحسابات والدليل المحاسبي' },
      { id: 'journal_entries', label: 'سندات القيد والترحيل المالي للأستاذ' },
      { id: 'cost_centers', label: 'مراكز التكلفة والموازنات التشغيلية' }
    ]
  },
  {
    id: 'treasury',
    label: 'الخزانة والمدفوعات البنكية',
    icon: Coins,
    screens: [
      { id: 'treasury_vault', label: 'صناديق الخزنة الفرعية والتحصيلات النقدية' },
      { id: 'bank_transfers', label: 'التسويات البنكية والتحويلات المعتمدة' }
    ]
  },
  {
    id: 'financial_reports',
    label: 'التقارير والقوائم المالية',
    icon: FileText,
    screens: [
      { id: 'trial_balance', label: 'تقرير ميزان المراجعة والأرصدة الختامية' },
      { id: 'financial_statements', label: 'قائمة الدخل والميزانية العمومية والتدفقات' }
    ]
  },
  {
    id: 'fees',
    label: 'الرسوم المدرسية والأقساط',
    icon: CreditCard,
    screens: [
      { id: 'define_fees', label: 'تعريف الرسوم والخدمات الدراسية' },
      { id: 'discounts', label: 'تخصيص الخصومات والإعفاءات' },
      { id: 'receipts', label: 'سندات قبض رسوم الطلاب' },
      { id: 'installment_schedule', label: 'جدولة الأقساط والمستحقات المدرسية' }
    ]
  },
  {
    id: 'inventory',
    label: 'المستودعات وإدارة العهد',
    icon: Container,
    screens: [
      { id: 'inventory_stock', label: 'مخزون العهد والأدوات والكتب المدرسية' },
      { id: 'procurement_vouchers', label: 'أوامر التوريد والشراء والاتصال بالموردين' }
    ]
  },
  {
    id: 'fixed_assets',
    label: 'الأصول الثابتة والعهد',
    icon: Database,
    screens: [
      { id: 'asset_register', label: 'سجل الأصول والعهد ومواقعها' },
      { id: 'asset_movements', label: 'نقل وتسليم واستلام العهد' },
      { id: 'asset_depreciation', label: 'الإهلاك وإعادة التقييم والإقفال' }
    ]
  },
  {
    id: 'buses',
    label: 'النقل والمواصلات المدرسية',
    icon: Bus,
    screens: [
      { id: 'bus_routes', label: 'توزيع المسارات وحافلات النقل المدرسي' },
      { id: 'bus_subscribers', label: 'توزيع الطلاب والمشرفين ومستحقات النقل' }
    ]
  },
  {
    id: 'uniform_management',
    label: 'إدارة الزي والمستلزمات',
    icon: Shirt,
    screens: [
      { id: 'uniform_sales', label: 'مبيعات الزي المدرسي وتسليم المشتريات' },
      { id: 'uniform_orders', label: 'أوامر توريد ومخزون الألبسة والقياسات' }
    ]
  },
  {
    id: 'audit_logs',
    label: 'الرقابة وتتبع العمليات',
    icon: Workflow,
    screens: [
      { id: 'audit_logs', label: 'سجلات تتبع العمليات والرقابة الأمنية' }
    ]
  },
  {
    id: 'permissions_admin',
    label: 'حوكمة الصلاحيات والمستخدمين',
    icon: ShieldCheck,
    screens: [
      { id: 'permissions_matrix', label: 'مصفوفة الصلاحيات وإدارة أدوار الـ RBAC' }
    ]
  },
  {
    id: 'system_health',
    label: 'مركز مراقبة أداء الخوادم',
    icon: Settings2,
    screens: [
      { id: 'system_monitoring', label: 'مركز مراقبة أداء الخوادم والأجهزة النشطة' }
    ]
  },
  {
    id: 'db_schema',
    label: 'مخطط قاعدة البيانات والـ SQL',
    icon: DatabaseZap,
    screens: [
      { id: 'database_editor', label: 'مخطط قاعدة بيانات Supabase وأدوات SQL' }
    ]
  },
  {
    id: 'settings',
    label: 'إعدادات النظام والبيانات المرجعية',
    icon: Settings2,
    screens: [
      { id: 'system_settings', label: 'الإعدادات العامة والعملة والبيانات المرجعية' },
      { id: 'configuration_audit', label: 'تدقيق تغييرات إعدادات النظام' }
    ]
  }
];

const ALL_PERMISSION_KEYS = PERMISSIONS_CATEGORIES_TREE.reduce<string[]>((keys, category) => {
  category.screens.forEach(screen => {
    MATRIX_COLUMNS.forEach(column => keys.push(`${category.id}:${screen.id}:${column.id}`));
  });
  return keys;
}, []);

const DATA_SCOPE_CATALOG = [
  { id: 'organization', label: 'المؤسسة والمدارس', description: 'نطاق المؤسسة والمدارس التابعة لها' },
  { id: 'branch', label: 'الفروع', description: 'فرع واحد أو مجموعة فروع مصرح بها' },
  { id: 'academic', label: 'المراحل والصفوف', description: 'مراحل وصفوف وشعب محددة' },
  { id: 'warehouse', label: 'المخازن والعهد', description: 'مخازن وعهد ومواقع تسليم محددة' },
  { id: 'treasury', label: 'الخزائن والحسابات البنكية', description: 'خزائن وحسابات بنكية ضمن النطاق المالي' },
  { id: 'personal', label: 'السجلات المنشأة بواسطة الموظف', description: 'السجلات التي أنشأها الموظف فقط' }
] as const;

const DATA_SCOPE_ACTIONS: ColumnDefinition[] = [
  { id: 'view', label: 'عرض' },
  { id: 'edit', label: 'تعديل' },
  { id: 'export', label: 'تصدير' }
];

const REPORT_PERMISSION_CATALOG = [
  { id: 'financial', label: 'التقارير والقوائم المالية' },
  { id: 'students', label: 'تقارير الطلاب والحضور' },
  { id: 'hr', label: 'تقارير العاملين والرواتب' },
  { id: 'inventory', label: 'تقارير المخزون والمشتريات' },
  { id: 'audit', label: 'تقارير الرقابة وسجل العمليات' }
] as const;

const REPORT_PERMISSION_ACTIONS: ColumnDefinition[] = [
  { id: 'view', label: 'عرض' },
  { id: 'export', label: 'تصدير' },
  { id: 'print', label: 'طباعة' },
  { id: 'approve', label: 'اعتماد' }
];

const DATA_SCOPE_KEYS = DATA_SCOPE_CATALOG.flatMap(scope => DATA_SCOPE_ACTIONS.map(action => `data_scope:${scope.id}:${action.id}`));
const REPORT_PERMISSION_KEYS = REPORT_PERMISSION_CATALOG.flatMap(report => REPORT_PERMISSION_ACTIONS.map(action => `report:${report.id}:${action.id}`));
const ALL_AUTHORIZATION_KEYS = [...ALL_PERMISSION_KEYS, ...DATA_SCOPE_KEYS, ...REPORT_PERMISSION_KEYS];

const TEST_PERMISSION_PROFILE_ACTIONS: Record<PermissionType, string[]> = {
  full: [],
  manager: ['view', 'insert', 'edit', 'delete', 'approve', 'cancel', 'export', 'print'],
  operator: ['view', 'insert', 'edit', 'print'],
  viewer: ['view'],
  auditor: ['view', 'export', 'print'],
  finance_operator: ['view', 'insert', 'edit', 'approve', 'post', 'export', 'print'],
  inventory_operator: ['view', 'insert', 'edit', 'export', 'print'],
  academic_operator: ['view', 'insert', 'edit', 'approve', 'export', 'print'],
  hr_operator: ['view', 'insert', 'edit', 'approve', 'export', 'print'],
  it_operator: ['view', 'insert', 'edit', 'approve', 'export', 'print'],
  custom: ['view']
};

function buildTestEmployeePermissions(permissionType: PermissionType, moduleIds: string[]): string[] {
  if (permissionType === 'full') return ['*'];

  const allowedActions = new Set(TEST_PERMISSION_PROFILE_ACTIONS[permissionType]);
  const permissions = moduleIds.flatMap(moduleId => {
    const category = PERMISSIONS_CATEGORIES_TREE.find(item => item.id === moduleId);
    if (!category) return [];
    return category.screens.flatMap(screen => MATRIX_COLUMNS
      .filter(column => allowedActions.has(column.id))
      .map(column => `${category.id}:${screen.id}:${column.id}`));
  });

  permissions.push('dashboard:main:view', 'dashboard:ai_assistant:view');
  if (moduleIds.includes('financial_reports')) {
    REPORT_PERMISSION_ACTIONS
      .filter(action => allowedActions.has(action.id))
      .forEach(action => permissions.push(`report:financial:${action.id}`));
  }
  if (moduleIds.includes('inventory')) {
    REPORT_PERMISSION_ACTIONS
      .filter(action => allowedActions.has(action.id))
      .forEach(action => permissions.push(`report:inventory:${action.id}`));
    DATA_SCOPE_ACTIONS
      .filter(action => allowedActions.has(action.id))
      .forEach(action => permissions.push(`data_scope:warehouse:${action.id}`));
  }
  if (moduleIds.includes('audit_logs')) {
    REPORT_PERMISSION_ACTIONS
      .filter(action => allowedActions.has(action.id))
      .forEach(action => permissions.push(`report:audit:${action.id}`));
  }
  return Array.from(new Set(permissions.filter(permission => ALL_AUTHORIZATION_KEYS.includes(permission))));
}

interface TestEmployeeBlueprint {
  id: string;
  name: string;
  jobTitle: string;
  department: string;
  permissionType: PermissionType;
  modules: string[];
}

const TEST_EMPLOYEE_BLUEPRINTS: TestEmployeeBlueprint[] = [
  { id: 'perm_test_001', name: 'أحمد ناصر عبد الله', jobTitle: 'مدير الإدارة العامة', department: 'الإدارة العامة', permissionType: 'manager', modules: ['dashboard', 'admissions', 'students', 'accounts', 'settings'] },
  { id: 'perm_test_002', name: 'سارة محمد عثمان', jobTitle: 'نائب مدير المدرسة', department: 'الإدارة العامة', permissionType: 'manager', modules: ['dashboard', 'students', 'academic', 'attendance', 'financial_reports'] },
  { id: 'perm_test_003', name: 'خالد حسن إبراهيم', jobTitle: 'مدير شؤون الطلاب', department: 'شؤون الطلاب', permissionType: 'manager', modules: ['dashboard', 'admissions', 'students', 'parent', 'attendance'] },
  { id: 'perm_test_004', name: 'ريم عبد الرحمن صالح', jobTitle: 'أخصائي قبول وتسجيل', department: 'القبول والتسجيل', permissionType: 'operator', modules: ['admissions', 'students', 'parent'] },
  { id: 'perm_test_005', name: 'محمد علي يوسف', jobTitle: 'موظف تسجيل طلاب', department: 'القبول والتسجيل', permissionType: 'operator', modules: ['admissions', 'students'] },
  { id: 'perm_test_006', name: 'فاطمة أحمد نور', jobTitle: 'موظف ملفات ووثائق', department: 'القبول والتسجيل', permissionType: 'viewer', modules: ['students', 'parent'] },
  { id: 'perm_test_007', name: 'مريم عبد القادر', jobTitle: 'مسؤول استقبال', department: 'الاستقبال', permissionType: 'operator', modules: ['dashboard', 'admissions', 'students'] },
  { id: 'perm_test_008', name: 'عمر عبد الجليل', jobTitle: 'سكرتير الإدارة', department: 'الإدارة المدرسية', permissionType: 'viewer', modules: ['dashboard', 'admissions', 'students', 'settings'] },
  { id: 'perm_test_009', name: 'سليمان غازي', jobTitle: 'المدير المالي العام', department: 'الإدارة المالية', permissionType: 'full', modules: ['accounts', 'treasury', 'financial_reports', 'fees'] },
  { id: 'perm_test_010', name: 'منصور خلف', jobTitle: 'رئيس قسم الحسابات', department: 'الحسابات العامة', permissionType: 'finance_operator', modules: ['accounts', 'treasury', 'financial_reports', 'fees'] },
  { id: 'perm_test_011', name: 'هند عبد العزيز', jobTitle: 'محاسب عام', department: 'الحسابات العامة', permissionType: 'finance_operator', modules: ['accounts', 'financial_reports', 'fees'] },
  { id: 'perm_test_012', name: 'يوسف حمدان', jobTitle: 'أمين خزينة', department: 'الخزينة والبنوك', permissionType: 'operator', modules: ['accounts', 'treasury', 'fees'] },
  { id: 'perm_test_013', name: 'نجلاء محمود', jobTitle: 'مراقب مالي', department: 'الرقابة المالية', permissionType: 'auditor', modules: ['accounts', 'treasury', 'financial_reports', 'audit_logs'] },
  { id: 'perm_test_014', name: 'سالم الوحيشي', jobTitle: 'مراجع داخلي', department: 'التفتيش الداخلي', permissionType: 'auditor', modules: ['accounts', 'financial_reports', 'audit_logs', 'inventory'] },
  { id: 'perm_test_015', name: 'عبد المطلب الزاوي', jobTitle: 'مسؤول المشتريات', department: 'المخازن والمشتريات', permissionType: 'inventory_operator', modules: ['inventory', 'fixed_assets', 'accounts'] },
  { id: 'perm_test_016', name: 'فدوى البوسيفي', jobTitle: 'أمين المخزن الرئيسي', department: 'المخازن والمستودعات', permissionType: 'inventory_operator', modules: ['inventory', 'uniform_management'] },
  { id: 'perm_test_017', name: 'طارق إسماعيل', jobTitle: 'مراقب مخزون', department: 'المخازن والمستودعات', permissionType: 'viewer', modules: ['inventory', 'fixed_assets'] },
  { id: 'perm_test_018', name: 'ليلى عوض', jobTitle: 'مسؤول الأصول والتجهيزات', department: 'الأصول الثابتة', permissionType: 'operator', modules: ['fixed_assets', 'inventory', 'accounts'] },
  { id: 'perm_test_019', name: 'عمر الخطيب', jobTitle: 'مدير الموارد البشرية', department: 'الموارد البشرية', permissionType: 'hr_operator', modules: ['teachers', 'attendance', 'settings'] },
  { id: 'perm_test_020', name: 'أماني فضل', jobTitle: 'أخصائي شؤون العاملين', department: 'الموارد البشرية', permissionType: 'hr_operator', modules: ['teachers', 'attendance'] },
  { id: 'perm_test_021', name: 'حسن التوم', jobTitle: 'مسؤول الرواتب', department: 'الرواتب', permissionType: 'operator', modules: ['teachers', 'accounts', 'financial_reports'] },
  { id: 'perm_test_022', name: 'إيمان بشير', jobTitle: 'مسؤول حضور وانصراف الموظفين', department: 'الموارد البشرية', permissionType: 'viewer', modules: ['teachers', 'attendance'] },
  { id: 'perm_test_023', name: 'عبد الله إبراهيم', jobTitle: 'مشرف أكاديمي', department: 'الشؤون الأكاديمية', permissionType: 'academic_operator', modules: ['academic', 'students', 'attendance', 'exams'] },
  { id: 'perm_test_024', name: 'نور الهدى حسن', jobTitle: 'معلم لغة عربية', department: 'الهيئة التدريسية', permissionType: 'operator', modules: ['academic', 'attendance', 'exams'] },
  { id: 'perm_test_025', name: 'مصعب أحمد', jobTitle: 'معلم رياضيات', department: 'الهيئة التدريسية', permissionType: 'operator', modules: ['academic', 'attendance', 'exams'] },
  { id: 'perm_test_026', name: 'فاطمة الزهراء', jobTitle: 'رئيس الكنترول', department: 'الكنترول والامتحانات', permissionType: 'academic_operator', modules: ['exams', 'academic', 'students', 'financial_reports'] },
  { id: 'perm_test_027', name: 'عبد الرحيم عمر', jobTitle: 'مسؤول نتائج وامتحانات', department: 'الكنترول والامتحانات', permissionType: 'operator', modules: ['exams', 'academic'] },
  { id: 'perm_test_028', name: 'خالد عبد الرحمن', jobTitle: 'مدير تقنية المعلومات', department: 'تقنية المعلومات', permissionType: 'it_operator', modules: ['permissions_admin', 'system_health', 'db_schema', 'audit_logs', 'settings'] },
  { id: 'perm_test_029', name: 'نورة صالح', jobTitle: 'مسؤول الدعم الفني', department: 'تقنية المعلومات', permissionType: 'it_operator', modules: ['system_health', 'audit_logs'] },
  { id: 'perm_test_030', name: 'مازن الطيب', jobTitle: 'محلل بيانات وتقارير', department: 'تقنية المعلومات', permissionType: 'viewer', modules: ['dashboard', 'financial_reports', 'audit_logs'] },
  { id: 'perm_test_031', name: 'نجلاء حامد', jobTitle: 'أمين المكتبة', department: 'المكتبة', permissionType: 'operator', modules: ['library', 'students'] },
  { id: 'perm_test_032', name: 'صلاح الدين علي', jobTitle: 'أخصائي مصادر التعلم', department: 'المكتبة ومصادر التعلم', permissionType: 'viewer', modules: ['library', 'academic'] },
  { id: 'perm_test_033', name: 'صالح أحمد', jobTitle: 'مشرف النقل المدرسي', department: 'الخدمات المساندة والنقل', permissionType: 'manager', modules: ['buses', 'students', 'settings'] },
  { id: 'perm_test_034', name: 'محمود يوسف', jobTitle: 'مسؤول الصيانة والخدمات', department: 'الخدمات المساندة', permissionType: 'operator', modules: ['fixed_assets', 'inventory'] },
  { id: 'perm_test_035', name: 'سعاد أحمد', jobTitle: 'أخصائي جودة وتطوير', department: 'الجودة والتطوير', permissionType: 'auditor', modules: ['audit_logs', 'financial_reports', 'students', 'settings'] }
];

export const PERMISSIONS_TEST_FIXTURE_SIZE = TEST_EMPLOYEE_BLUEPRINTS.length;
export const PERMISSIONS_TEST_FIXTURE: Employee[] = TEST_EMPLOYEE_BLUEPRINTS.map(blueprint => ({
  id: blueprint.id,
  name: blueprint.name,
  jobTitle: blueprint.jobTitle,
  department: blueprint.department,
  status: 'active',
  permissionType: blueprint.permissionType,
  permissions: buildTestEmployeePermissions(blueprint.permissionType, blueprint.modules)
}));

function employeeGroupLabel(employee: Employee): string {
  const department = `${employee.department} ${employee.jobTitle}`.toLocaleLowerCase();
  if (/(مال|حساب|خزينة|مالية|محاسب)/.test(department)) return 'الماليون والحسابات';
  if (/(طالب|قبول|تسجيل|استقبال|علاقات)/.test(department)) return 'الإداريون وشؤون الطلاب';
  if (/(موارد بشرية|شؤون الموظفين|عاملين|رواتب)/.test(department)) return 'الموارد البشرية والرواتب';
  if (/(مخزن|مستودع|تموين|مشتريات)/.test(department)) return 'المخازن والمشتريات';
  if (/(تقنية|دعم تقني|it)/.test(department)) return 'تقنية المعلومات';
  if (/(مكتبة|مصادر تعلم)/.test(department)) return 'المكتبة ومصادر التعلم';
  if (/(نقل|خدمات|مساندة)/.test(department)) return 'الخدمات المساندة والنقل';
  if (/(كنترول|امتحان|أكاديم|معلم|تدريس)/.test(department)) return 'الهيئة الأكاديمية والكنترول';
  return employee.department || 'الإداريون';
}

interface PermissionsModuleProps {
  users: any[];
  setUsers: React.Dispatch<React.SetStateAction<any[]>>;
  roles: any[];
  setRoles: React.Dispatch<React.SetStateAction<any[]>>;
  permissionsAuditLog: any[];
  setPermissionsAuditLog: React.Dispatch<React.SetStateAction<any[]>>;
  currentDrillDownUser: any;
  setDrillDownUser: (user: any) => void;
  triggerNotification: (msg: string, type: 'info' | 'warning' | 'success') => void;
}

export const PermissionsManagementModule: React.FC<PermissionsModuleProps> = ({
  users,
  setUsers,
  roles,
  setRoles,
  permissionsAuditLog,
  setPermissionsAuditLog,
  currentDrillDownUser,
  setDrillDownUser,
  triggerNotification
}) => {
  const canonicalPersistenceRequired = FallbackStorage.isCanonicalPersistenceRequired();
  // Local high-fidelity state to track selected employee, searches, and configurations
  const [employees, setEmployees] = useState<Employee[]>(() => {
    if (canonicalPersistenceRequired) return [];
    // Sync with existing props or localStorage. In compatibility mode only,
    // existing users are projected into the editor; no synthetic employees are
    // created and canonical mode remains fail-closed.
    const saved = localStorage.getItem('edupro_employees_permissions_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.map(normalizeEmployee) : [];
      } catch (e) {
        // ignore
      }
    }
    return users
      .filter(user => user && (user.id || user.name))
      .map(normalizeEmployee);
  });

  const [activeEmployeeId, setActiveEmployeeId] = useState<string>('');
  const [employeeSearch, setEmployeeSearch] = useState<string>('');
  const [permissionSearch, setPermissionSearch] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [selectedPermissionType, setSelectedPermissionType] = useState<PermissionType | 'all'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [activeTab, setActiveTab] = useState<'employee_matrix' | 'modules' | 'data' | 'reports'>('employee_matrix');

  // Expanded categories state (Student Affairs is expanded by default)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    students: true
  });

  // Track active changes to highlight save button
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const preserveUnsavedOnNextEmployeeChange = useRef(false);

  // Interactive Security Simulator States
  const [simRole, setSimRole] = useState<string>('accountant');
  const [simResource, setSimResource] = useState<string>('invoice');
  const [simAction, setSimAction] = useState<string>('approve');
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [simResult, setSimResult] = useState<'idle' | 'allowed' | 'denied'>('idle');

  const runSecuritySimulation = () => {
    setSimResult('idle');
    setSimLogs([`[${new Date().toLocaleTimeString()}] [SecurityGatekeeper] 📥 استلام طلب تنفيذ عملية من المعرف الجغرافي للفرع الرئيسي...`]);
    
    setTimeout(() => {
      const result = SecuritySimulationService.runSimulation(simRole, simResource, simAction);
      setSimLogs(result.logs);
      setSimResult(result.isAllowed ? 'allowed' : 'denied');
    }, 600);
  };

  // Active highlighted employee details
  const activeEmployee = useMemo(() => {
    return employees.find(e => e.id === activeEmployeeId) || employees[0];
  }, [employees, activeEmployeeId]);

  // Synchronize on active employee changes
  useEffect(() => {
    if (preserveUnsavedOnNextEmployeeChange.current) {
      preserveUnsavedOnNextEmployeeChange.current = false;
      return;
    }
    setHasUnsavedChanges(false);
  }, [activeEmployeeId]);

  // Extract unique departments for filtering
  const departments = useMemo(() => {
    const list = new Set<string>();
    employees.forEach(u => {
      if (u.department) list.add(u.department);
    });
    return Array.from(list);
  }, [employees]);

  const permissionTypeOptions = useMemo(() => {
    const types = new Set<PermissionType>();
    employees.forEach(employee => types.add(employee.permissionType || resolvePermissionType(employee)));
    return Array.from(types);
  }, [employees]);

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    const search = employeeSearch.trim().toLocaleLowerCase();
    return employees.filter(emp => {
      const matchDept = selectedDept === 'all' || emp.department === selectedDept;
      const matchStatus = selectedStatus === 'all' || emp.status === selectedStatus;
      const matchPermissionType = selectedPermissionType === 'all'
        || (emp.permissionType || resolvePermissionType(emp)) === selectedPermissionType;
      const matchSearch = !search || [emp.name, emp.jobTitle, emp.id]
        .some(value => value.toLocaleLowerCase().includes(search));
      return matchDept && matchStatus && matchPermissionType && matchSearch;
    });
  }, [employees, selectedDept, selectedStatus, selectedPermissionType, employeeSearch]);

  const filteredPermissionCategories = useMemo(() => {
    const search = permissionSearch.trim().toLocaleLowerCase();
    if (!search) return PERMISSIONS_CATEGORIES_TREE;
    return PERMISSIONS_CATEGORIES_TREE
      .map(category => ({
        ...category,
        screens: category.screens.filter(screen =>
          `${category.label} ${category.id} ${screen.label} ${screen.id}`
            .toLocaleLowerCase()
            .includes(search)
        )
      }))
      .filter(category => category.screens.length > 0);
  }, [permissionSearch]);

  const permissionStats = useMemo(() => {
    const moduleCount = PERMISSIONS_CATEGORIES_TREE.length;
    const screenCount = PERMISSIONS_CATEGORIES_TREE.reduce((count, category) => count + category.screens.length, 0);
    const actionCount = ALL_AUTHORIZATION_KEYS.length;
    const assignedCount = !activeEmployee
      ? 0
      : activeEmployee.permissions.includes('*')
        ? actionCount
        : ALL_AUTHORIZATION_KEYS.filter(permission => activeEmployee.permissions.includes(permission)).length;
    return {
      moduleCount,
      screenCount,
      actionCount,
      assignedCount,
      coverage: actionCount === 0 ? 0 : Math.round((assignedCount / actionCount) * 100)
    };
  }, [activeEmployee]);

  const employeeGroups = useMemo(() => {
    const grouped = new Map<string, Employee[]>();
    filteredEmployees.forEach(employee => {
      const label = employeeGroupLabel(employee);
      const group = grouped.get(label) || [];
      group.push(employee);
      grouped.set(label, group);
    });
    return Array.from(grouped.entries()).map(([label, group]) => ({ label, employees: group }));
  }, [filteredEmployees]);

  const isTestFixtureActive = useMemo(
    () => employees.length === PERMISSIONS_TEST_FIXTURE_SIZE && employees.every(employee => employee.id.startsWith('perm_test_')),
    [employees]
  );

  const visibleScreenCount = useMemo(
    () => filteredPermissionCategories.reduce((count, category) => count + category.screens.length, 0),
    [filteredPermissionCategories]
  );

  // Paginated employees for left side
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  // Total pages
  const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1;

  // Toggle Category Expand/Collapse
  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const expandAllCategories = () => {
    setExpandedCategories(Object.fromEntries(PERMISSIONS_CATEGORIES_TREE.map(category => [category.id, true])));
  };

  const collapseAllCategories = () => {
    setExpandedCategories({});
  };

  const categoryPermissionKeys = (category: ModuleCategory) => category.screens.reduce<string[]>((keys, screen) => {
    MATRIX_COLUMNS.forEach(column => keys.push(`${category.id}:${screen.id}:${column.id}`));
    return keys;
  }, []);

  const categoryPermissionCount = (category: ModuleCategory) => {
    if (!activeEmployee) return 0;
    if (activeEmployee.permissions.includes('*')) return categoryPermissionKeys(category).length;
    return categoryPermissionKeys(category).filter(key => activeEmployee.permissions.includes(key)).length;
  };

  // Check if a permission is enabled for active employee
  const isPermissionEnabled = (catId: string, screenId: string, actionId: string) => {
    return activeEmployee ? isPermissionEnabledForEmployee(activeEmployee, catId, screenId, actionId) : false;
  };

  const isPermissionEnabledForEmployee = (employee: Employee, catId: string, screenId: string, actionId: string) => {
    if (employee.permissions.includes('*')) return true;
    const permKey = `${catId}:${screenId}:${actionId}`;
    return employee.permissions.includes(permKey);
  };

  // Toggle single permission checkbox
  const handleTogglePermission = (catId: string, screenId: string, actionId: string) => {
    if (!activeEmployee || canonicalPersistenceRequired) return;
    handleToggleEmployeePermission(activeEmployee.id, catId, screenId, actionId);
  };

  const handleToggleEmployeePermission = (employeeId: string, catId: string, screenId: string, actionId: string) => {
    if (canonicalPersistenceRequired) return;
    const permKey = `${catId}:${screenId}:${actionId}`;
    const selectedEmployee = employees.find(employee => employee.id === employeeId);
    if (!selectedEmployee) return;
    let newPermissions = [...selectedEmployee.permissions];
    
    if (newPermissions.includes('*')) {
      // Expand wildcard * to all possible keys EXCEPT the toggled one
      newPermissions = ALL_AUTHORIZATION_KEYS.filter(k => k !== permKey);
    } else if (newPermissions.includes(permKey)) {
      newPermissions = newPermissions.filter(p => p !== permKey);
    } else {
      newPermissions.push(permKey);
    }

    setEmployees(prev => prev.map(emp => {
      if (emp.id === employeeId) {
        return { ...emp, permissions: newPermissions };
      }
      return emp;
    }));

    setHasUnsavedChanges(true);
  };

  const handleToggleCategory = (category: ModuleCategory, enabled: boolean) => {
    if (!activeEmployee || canonicalPersistenceRequired) return;
    const categoryKeys = new Set(categoryPermissionKeys(category));
    const newPermissions = activeEmployee.permissions.includes('*')
      ? (enabled ? ALL_AUTHORIZATION_KEYS : ALL_AUTHORIZATION_KEYS.filter(key => !categoryKeys.has(key)))
      : enabled
        ? Array.from(new Set([...activeEmployee.permissions, ...categoryKeys]))
        : activeEmployee.permissions.filter(permission => !categoryKeys.has(permission));

    setEmployees(prev => prev.map(emp => emp.id === activeEmployee.id ? { ...emp, permissions: newPermissions } : emp));
    setHasUnsavedChanges(true);
  };

  const handleLoadTestFixture = () => {
    if (canonicalPersistenceRequired) {
      triggerNotification('بيانات الاختبار غير متاحة في الوضع المركزي حتى لا تختلط السجلات التجريبية بالإنتاج.', 'info');
      return;
    }

    const fixture = PERMISSIONS_TEST_FIXTURE.map(employee => ({
      ...employee,
      permissions: [...employee.permissions]
    }));
    preserveUnsavedOnNextEmployeeChange.current = true;
    setEmployees(fixture);
    setActiveEmployeeId(fixture[0]?.id || '');
    setEmployeeSearch('');
    setSelectedDept('all');
    setSelectedStatus('all');
    setSelectedPermissionType('all');
    setCurrentPage(1);
    setHasUnsavedChanges(true);
    triggerNotification(`تم تحميل ${PERMISSIONS_TEST_FIXTURE_SIZE} موظفاً اختبارياً من وظائف مختلفة. اضغط «حفظ التغييرات» لحفظ أنواع الصلاحيات.`, 'info');
  };

  // Save changes to the local compatibility workspace and synchronize with context props.
  // Canonical production remains fail-closed until a trusted RBAC writer is available.
  const handleSaveChanges = () => {
    if (canonicalPersistenceRequired) {
      triggerNotification('إدارة الصلاحيات متوقفة حتى يتم ربط مصفوفة RBAC بمصدر الهوية المركزي الموثوق.', 'info');
      return;
    }
    const normalizedEmployees = employees.map(normalizeEmployee);
    localStorage.setItem('edupro_employees_permissions_v1', JSON.stringify(normalizedEmployees));
    localStorage.setItem('edupro_permission_profile_types_v1', JSON.stringify(
      normalizedEmployees.map(employee => ({
        employeeId: employee.id,
        permissionType: employee.permissionType || 'custom',
        permissionTypeLabel: employeePermissionTypeLabel(employee)
      }))
    ));
    setHasUnsavedChanges(false);

    // Sync the complete directory in the local compatibility workspace.
    const syncedUsers = normalizedEmployees.map(employee => {
      const existingUser = users.find(user => user.id === employee.id || user.name === employee.name) || {};
      return {
        ...existingUser,
        id: employee.id,
        name: employee.name,
        jobTitle: employee.jobTitle,
        department: employee.department,
        status: employee.status,
        roleId: employee.permissionType || 'custom',
        role: employeePermissionTypeLabel(employee),
        permissionType: employee.permissionType || 'custom',
        permissions: employee.permissions
      };
    });
    setUsers(syncedUsers);
    
    // Update active drill down user if matched
    if (currentDrillDownUser) {
      const match = normalizedEmployees.find(e => e.id === activeEmployeeId);
      if (match) {
        setDrillDownUser({ ...currentDrillDownUser, permissions: match.permissions });
      }
    }

    // Add Audit Log
    const newAuditLog = {
      id: `audit_${Date.now()}`,
      modifier: currentDrillDownUser?.name || 'أحمد محمد علي',
      targetUser: activeEmployee.name,
      date: new Date().toLocaleDateString('ar-SA') + ' - ' + new Date().toLocaleTimeString('ar-SA'),
      action: `تعديل وحفظ نوع الصلاحيات ومصفوفة التحكم بالكامل لموظف: ${activeEmployee.name}`,
      device: 'متصفح الإدارة الموحد',
      ip: '192.168.1.104'
    };
    setPermissionsAuditLog([newAuditLog, ...permissionsAuditLog]);

    triggerNotification(`تم حفظ أنواع الصلاحيات ومزامنة المصفوفة بنجاح لـ ${normalizedEmployees.length} موظفاً`, 'success');
  };

  // Check all / Select all permissions for active employee
  const handleSelectAll = () => {
    if (!activeEmployee || canonicalPersistenceRequired) return;

    setEmployees(prev => prev.map(emp => {
      if (emp.id === activeEmployee.id) {
        return { ...emp, permissions: ALL_AUTHORIZATION_KEYS };
      }
      return emp;
    }));
    setHasUnsavedChanges(true);
    triggerNotification('تم تحديد كافة الخيارات والصلاحيات للموظف النشط', 'info');
  };

  // Clear all / Deselect all permissions for active employee
  const handleDeselectAll = () => {
    if (!activeEmployee || canonicalPersistenceRequired) return;
    setEmployees(prev => prev.map(emp => {
      if (emp.id === activeEmployee.id) {
        return { ...emp, permissions: [] };
      }
      return emp;
    }));
    setHasUnsavedChanges(true);
    triggerNotification('تم إلغاء وتصفير مصفوفة الصلاحيات للموظف النشط', 'warning');
  };

  // Preset Template loader
  const handleApplyTemplate = (roleType: 'admin' | 'staff' | 'view_only') => {
    if (!activeEmployee || canonicalPersistenceRequired) return;
    let templatePerms: string[] = [];

    if (roleType === 'admin') {
      templatePerms = ['*'];
    } else if (roleType === 'staff') {
      // Visibility, View, Save, Edit, Print
      PERMISSIONS_CATEGORIES_TREE.forEach(cat => {
        cat.screens.forEach(scr => {
          templatePerms.push(`${cat.id}:${scr.id}:view`);
          templatePerms.push(`${cat.id}:${scr.id}:insert`);
          templatePerms.push(`${cat.id}:${scr.id}:edit`);
          templatePerms.push(`${cat.id}:${scr.id}:print`);
        });
      });
    } else {
      // Visibility and Read/view only
      PERMISSIONS_CATEGORIES_TREE.forEach(cat => {
        cat.screens.forEach(scr => {
          templatePerms.push(`${cat.id}:${scr.id}:view`);
        });
      });
    }

    setEmployees(prev => prev.map(emp => {
      if (emp.id === activeEmployee.id) {
        return { ...emp, permissions: templatePerms };
      }
      return emp;
    }));
    setHasUnsavedChanges(true);
    triggerNotification(`تم تطبيق قالب الصلاحيات المقترح بنجاح لموظف: ${activeEmployee.name}`, 'success');
  };

  return (
    <div id="edupro_permissions_portal" className="w-full bg-[#f8fafc] text-slate-800 rounded-3xl overflow-hidden border border-slate-200/80 shadow-2xl flex flex-col font-sans select-none" dir="rtl">
      
      {/* 1. TOP SYSTEM NAVIGATION BAR (REPLICATING SCREENSHOT TOP BAR EXACTLY) */}
      <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        {/* Left Side: Brand & Quick Search */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-orange-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-orange-500/20">
              D
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 leading-none">EduPro ERP</h1>
              <span className="text-[10px] text-slate-400 font-bold mt-1 block">نظام إدارة المدارس</span>
            </div>
          </div>

          {/* Quick Search box */}
          <div className="relative hidden md:block">
            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="البحث السريع عن مستخدم..."
              value={employeeSearch}
              onChange={(event) => {
                setEmployeeSearch(event.target.value);
                setCurrentPage(1);
              }}
              aria-label="البحث السريع عن مستخدم"
              className="bg-transparent pr-10 pl-16 py-1.5 text-xs font-semibold outline-none focus:border-orange-500 focus:w-[300px] transition-all"
            />
            <span className="absolute inset-y-0 left-3 flex items-center text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-lg my-1.5" dir="ltr">
              Ctrl + K
            </span>
          </div>
        </div>

        {/* Right Side: Quick status / Avatar / Notifications */}
        <div className="flex items-center gap-4">
          {/* Quick Theme Toggle */}
          <button className="p-2 hover:bg-slate-100 text-slate-500 transition-all cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          </button>

          {/* Notification bell */}
          <div className="relative">
            <button className="p-2 hover:bg-slate-100 text-slate-500 transition-all cursor-pointer">
              <Bell className="w-5 h-5" />
            </button>
            <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-orange-600 text-[9px] font-black text-white flex items-center justify-center rounded-full border-2 border-white select-none">
              12
            </span>
          </div>

          {/* Help circle */}
          <button className="p-2 hover:bg-slate-100 text-slate-500 transition-all cursor-pointer">
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* User Profile Avatar */}
          <div className="flex items-center gap-2 border-r border-slate-100 pr-4">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80" 
              alt="User" 
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>

      {/* 2. PAGE HEADER ROW (TITLE, BREADCRUMBS, ACTIONS BAR) */}
      <div className="px-8 py-6 border-b border-slate-100/60 flex flex-col xl:flex-row items-center justify-between gap-6">
        
        {/* Title and Breadcrumbs */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shadow-orange-500/5">
            <ShieldCheck className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>مركز المستخدمين والصلاحيات</span>
            </h2>
            <div className="text-xs text-slate-400 font-semibold mt-1 flex items-center gap-1.5 select-none">
              <span>الرئيسية</span>
              <span>•</span>
              <span>المستخدمون</span>
              <span>•</span>
              <span className="text-slate-500 font-bold">المصفوفة الموحدة للصلاحيات</span>
            </div>
          </div>
        </div>

        {/* Action Buttons exactly matching the screenshot layout */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Apply template with dropdown or single trigger */}
          <div className="relative group">
            <button 
              type="button"
              disabled={!activeEmployee || canonicalPersistenceRequired}
              className="px-4 py-2 hover:bg-transparent text-slate-700 font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Layers className="w-4 h-4 text-slate-400" />
              <span>تطبيق قالب</span>
            </button>
            <div className="absolute left-0 top-full mt-1.5 w-48 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-1">
              <button 
                onClick={() => handleApplyTemplate('admin')} 
                disabled={canonicalPersistenceRequired}
                className="w-full text-right px-3 py-2 text-xs font-semibold hover:bg-transparent rounded-lg text-slate-800 flex items-center gap-2"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                <span>كامل الصلاحيات (Super Admin)</span>
              </button>
              <button 
                onClick={() => handleApplyTemplate('staff')} 
                disabled={canonicalPersistenceRequired}
                className="w-full text-right px-3 py-2 text-xs font-semibold hover:bg-transparent rounded-lg text-slate-800 flex items-center gap-2"
              >
                <Sliders className="w-3.5 h-3.5 text-orange-500" />
                <span>صلاحيات تشغيلية مخصصة</span>
              </button>
              <button 
                onClick={() => handleApplyTemplate('view_only')} 
                disabled={canonicalPersistenceRequired}
                className="w-full text-right px-3 py-2 text-xs font-semibold hover:bg-transparent rounded-lg text-slate-800 flex items-center gap-2"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>عرض وتقارير فقط</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLoadTestFixture}
            disabled={canonicalPersistenceRequired}
            title={canonicalPersistenceRequired ? 'بيانات الاختبار محجوبة في الوضع المركزي' : `تحميل عينة اختبارية من ${PERMISSIONS_TEST_FIXTURE_SIZE} موظفاً`}
            className="px-4 py-2 hover:bg-transparent text-slate-700 font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          >
            <DatabaseZap className="w-4 h-4 text-slate-400" />
            <span>اختبار {PERMISSIONS_TEST_FIXTURE_SIZE} موظفاً</span>
          </button>

          <button
            type="button"
            onClick={handleSelectAll}
            disabled={!activeEmployee || canonicalPersistenceRequired}
            className="px-4 py-2 hover:bg-transparent text-slate-700 font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CheckSquare className="w-4 h-4 text-slate-400" />
            <span>تحديد الكل</span>
          </button>

          <button
            type="button"
            onClick={handleDeselectAll}
            disabled={!activeEmployee || canonicalPersistenceRequired}
            className="px-4 py-2 hover:bg-transparent text-slate-700 font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Ban className="w-4 h-4 text-slate-400" />
            <span>إلغاء الكل</span>
          </button>

          <button
            type="button"
            onClick={() => triggerNotification('شاشة إعدادات الصلاحيات المتقدمة وقواعد الحماية', 'info')}
            className="px-4 py-2 hover:bg-transparent text-slate-700 font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>سياسة الأمان</span>
          </button>

          {/* Highlighted Save Changes Button */}
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={!activeEmployee || canonicalPersistenceRequired || !hasUnsavedChanges}
            title={canonicalPersistenceRequired ? 'الحفظ غير متاح قبل ربط مصدر الهوية المركزي' : 'حفظ التغييرات'}
            className={`px-5 py-2 flex items-center gap-2 text-xs font-extrabold transition-all cursor-pointer border disabled:cursor-not-allowed disabled:opacity-40 ${
              hasUnsavedChanges 
                ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-500 shadow-orange-500/10 animate-pulse' 
                : 'bg-orange-600 text-white border-orange-500 hover:bg-orange-700 shadow-orange-500/5'
            }`}
          >
            <Check className="w-4.5 h-4.5" />
            <span>حفظ التغييرات</span>
          </button>
        </div>
      </div>

      {/* Central authorization state: never imply that a browser-only change is production authority. */}
      <div
        role="status"
        className={`mx-6 mt-5 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
          canonicalPersistenceRequired
            ? 'border-amber-200 bg-amber-50 text-amber-950'
            : 'border-emerald-200 bg-emerald-50 text-emerald-950'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${canonicalPersistenceRequired ? 'bg-amber-200 text-amber-800' : 'bg-emerald-200 text-emerald-800'}`}>
            {canonicalPersistenceRequired ? <ShieldAlert className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-xs font-black">
              {canonicalPersistenceRequired
                ? 'وضع المراجعة الآمن — مصدر الهوية المركزي مطلوب للحفظ'
                : isTestFixtureActive
                  ? `عينة اختبارية — ${PERMISSIONS_TEST_FIXTURE_SIZE} موظفاً وأنواع صلاحيات محفوظة محلياً`
                  : 'وضع التشغيل المحلي — التغييرات قابلة للحفظ في بيئة التطوير'}
            </p>
            <p className="mt-1 text-[10px] font-semibold opacity-80">
              {canonicalPersistenceRequired
                ? 'الكتالوج معروض للمراجعة فقط. لا تُحفظ أي صلاحية في المتصفح ولا تُمنح صلاحيات إنتاجية من هذه الجلسة.'
                : isTestFixtureActive
                  ? 'هذه بيانات اختبارية منفصلة عن الإنتاج. عدّل الخانات ثم اضغط «حفظ التغييرات» لحفظ الصلاحيات ونوعها في مساحة الاختبار.'
                  : 'تُراجع الصلاحيات على مستوى الوحدة والشاشة والعملية، ثم تُحفظ بعد اعتماد المسؤول.'}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-current/20 px-3 py-1 text-[10px] font-black">
          {canonicalPersistenceRequired ? 'CENTRAL SOURCE: READ ONLY' : isTestFixtureActive ? 'TEST FIXTURE: 35 USERS' : 'LOCAL WORKSPACE: EDITABLE'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 px-6 pt-5 md:grid-cols-4">
        {[
          { label: 'الوحدات', value: permissionStats.moduleCount, detail: 'نطاقات وظيفية' },
          { label: 'الشاشات', value: permissionStats.screenCount, detail: 'شاشات قابلة للضبط' },
          { label: 'أزرار العمليات', value: permissionStats.actionCount, detail: 'لكل شاشة' },
          { label: 'تغطية المستخدم', value: `${permissionStats.coverage}%`, detail: activeEmployee ? `${permissionStats.assignedCount}/${permissionStats.actionCount} نقطة ممنوحة` : 'لا يوجد مستخدم محدد' }
        ].map(card => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <span className="block text-[10px] font-black text-slate-500">{card.label}</span>
            <span className="mt-1 block text-xl font-black text-slate-900">{card.value}</span>
            <span className="mt-0.5 block text-[9px] font-bold text-slate-400">{card.detail}</span>
          </div>
        ))}
      </div>

      {/* 3. CORE DUAL COLUMN SYSTEM LAYOUT */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 bg-slate-50/50">
        
        {/* COLUMN A: EMPLOYEE LIST PANEL (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-[680px]">
            {/* Header count label */}
            <div className="px-5 py-4 border-b border-slate-100 bg-white">
              <h3 className="text-sm font-black text-slate-900 select-none">
                المستخدمون <span className="text-slate-400 font-bold">({filteredEmployees.length})</span>
              </h3>
            </div>

            {/* Sub-Header Column Labels */}
            <div className="px-5 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-black select-none">
              <span>المستخدم</span>
              <span>الوظيفة</span>
            </div>

            {/* Table-like Employees List container */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {paginatedEmployees.map((emp) => {
                const isSelected = emp.id === activeEmployeeId;
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => {
                      setActiveEmployeeId(emp.id);
                      triggerNotification(`عرض مصفوفة الصلاحيات لـ: ${emp.name}`, 'info');
                    }}
                    aria-pressed={isSelected}
                    className={`w-full text-right px-5 py-3.5 border-b border-slate-100/60 flex items-center justify-between cursor-pointer transition-all duration-150 select-none ${
                      isSelected
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'hover:bg-transparent text-slate-800'
                    }`}
                  >
                    {/* Employee Info Block */}
                    <div className="flex flex-col gap-1 text-right">
                      <span className="text-xs font-black">{emp.name}</span>
                      <span className={`text-[10px] ${isSelected ? 'text-orange-100' : 'text-slate-400'} font-bold`}>
                        {emp.jobTitle}
                      </span>
                      <span className={`text-[9px] ${isSelected ? 'text-orange-100' : 'text-slate-400'} font-semibold`}>
                        نوع الصلاحية: {employeePermissionTypeLabel(emp)}
                      </span>
                    </div>

                    {/* Radio Indicator (Left aligned in Arabic / RTL) */}
                    <div className="flex items-center shrink-0 pr-2">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5 text-orange-600 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                );
              })}

              {filteredEmployees.length === 0 && (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <Users className="w-8 h-8 text-slate-300" />
                  <span className="text-xs font-bold">
                    {canonicalPersistenceRequired ? 'لم ترد قائمة مستخدمين من مصدر الهوية المركزي' : 'لا توجد سجلات تطابق البحث'}
                  </span>
                  {canonicalPersistenceRequired && (
                    <span className="max-w-[220px] text-[10px] font-semibold leading-relaxed text-slate-400">
                      الكتالوج متاح للمراجعة، وتظهر ملفات الموظفين بعد ربط مصدر RBAC الموثوق.
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Left Panel Footer Pagination (As seen in screenshot) */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between select-none">
              <span className="text-[10px] text-slate-400 font-bold">10 لكل صفحة</span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-xs hover:bg-transparent disabled:opacity-40 transition-all cursor-pointer"
                >
                  &lt;
                </button>
                
                {[...Array(totalPages)].map((_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-6 h-6 rounded-lg text-xs font-extrabold flex items-center justify-center transition-all cursor-pointer ${
                        currentPage === pNum
                          ? 'bg-orange-600 text-white'
                          : 'hover:bg-transparent text-slate-600'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-xs hover:bg-transparent disabled:opacity-40 transition-all cursor-pointer"
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN B: SEARCH, FILTERS, TABS & PERMISSIONS MATRIX TABLE (9 Cols) */}
        <div className="lg:col-span-9 flex flex-col gap-4">
          
          {/* Active Employee Banner summary badge */}
          {activeEmployee && (
            <div className="bg-orange-50/65 border border-orange-100 p-4 flex items-center justify-between select-none">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                  {activeEmployee.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">أنت تراجع صلاحيات المستخدم: {activeEmployee.name}</h4>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">الدور: {activeEmployee.jobTitle} • قسم: {activeEmployee.department} • النوع: {employeePermissionTypeLabel(activeEmployee)}</p>
                </div>
              </div>
              <div className="border border-orange-200/50 px-3 py-1 text-[10px] text-orange-700 font-black">
                {activeEmployee.permissions.includes('*') ? 'صلاحية كاملة مقيدة' : `تخصيص يدوي (${activeEmployee.permissions.length} صلاحية)`}
              </div>
            </div>
          )}

          {/* Filters Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* Filter 1: Department selector */}
            <div className="border border-slate-200/80 px-3.5 py-2.5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-orange-600" />
                <span className="text-[11px] font-black text-slate-400">اختيار القسم:</span>
              </div>
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">كل الأقسام</option>
                {departments.map((dept, idx) => (
                  <option key={idx} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Filter 2: Employee Status selector */}
            <div className="border border-slate-200/80 px-3.5 py-2.5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-black text-slate-400">حالة الموظف:</span>
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
                <option value="all">الكل</option>
              </select>
            </div>

            {/* Filter 3: Search Employee Input */}
            <div className="border border-slate-200/80 px-3.5 py-1.5 flex items-center gap-2 shadow-xs">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="البحث عن موظف..."
                value={employeeSearch}
                onChange={(e) => {
                  setEmployeeSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-transparent border-none text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>

            {/* Filter 4: Permission profile selector */}
            <div className="border border-slate-200/80 px-3.5 py-2.5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                <span className="text-[11px] font-black text-slate-400">نوع الصلاحية:</span>
              </div>
              <select
                value={selectedPermissionType}
                onChange={(event) => {
                  setSelectedPermissionType(event.target.value as PermissionType | 'all');
                  setCurrentPage(1);
                }}
                className="max-w-[150px] bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                aria-label="التصفية حسب نوع الصلاحية"
              >
                <option value="all">كل الأنواع</option>
                {permissionTypeOptions.map(type => (
                  <option key={type} value={type}>{PERMISSION_TYPE_LABELS[type]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex min-w-0 flex-1 items-center gap-2">
              <Search className="h-4 w-4 shrink-0 text-orange-500" />
              <input
                type="text"
                placeholder="ابحث داخل الوحدات والشاشات..."
                value={permissionSearch}
                onChange={(event) => setPermissionSearch(event.target.value)}
                aria-label="البحث داخل الوحدات والشاشات"
                className="w-full bg-transparent text-xs font-bold text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black text-slate-400">
                {filteredPermissionCategories.length} وحدة معروضة
              </span>
              <button
                type="button"
                onClick={expandAllCategories}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-black text-slate-600 transition hover:border-orange-300 hover:text-orange-600"
              >
                توسيع الكل
              </button>
              <button
                type="button"
                onClick={collapseAllCategories}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-black text-slate-600 transition hover:border-orange-300 hover:text-orange-600"
              >
                طي الكل
              </button>
            </div>
          </div>

          {/* Matrix Card containing Tabs and Table */}
          <div className="border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden flex flex-col h-[580px]">

            {/* Compact ERP-style command bar: fast actions stay visible above the matrix. */}
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="ml-2 text-[10px] font-black text-slate-500">أدوات المصفوفة</span>
                <button
                  type="button"
                  onClick={handleLoadTestFixture}
                  disabled={canonicalPersistenceRequired}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-black text-slate-600 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                  title="تحميل عينة اختبارية منفصلة من 35 موظفاً"
                >
                  عينة 35
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('modules')}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-black text-slate-600 transition hover:border-orange-300 hover:text-orange-600"
                >
                  تفاصيل الوظائف
                </button>
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={!activeEmployee || canonicalPersistenceRequired || !hasUnsavedChanges}
                  className="rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-[10px] font-black text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  حفظ المصفوفة
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold text-slate-500">
                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700">✓ ممنوح</span>
                <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-400">— غير ممنوح</span>
                <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-indigo-700">النوع = قالب الصلاحية</span>
              </div>
            </div>
            
            {/* Tab Headers Row */}
            <div className="flex flex-wrap border-b border-slate-100 select-none">
              <button
                type="button"
                onClick={() => setActiveTab('employee_matrix')}
                className={`min-w-[180px] flex-1 py-4.5 text-xs font-black transition-all flex items-center justify-center gap-2 border-b-2 ${
                  activeTab === 'employee_matrix'
                    ? 'border-orange-600 text-orange-600 bg-slate-50/20'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>مصفوفة الموظفين</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('modules')}
                className={`min-w-[150px] flex-1 py-4.5 text-xs font-black transition-all flex items-center justify-center gap-2 border-b-2 ${
                  activeTab === 'modules'
                    ? 'border-orange-600 text-orange-600 bg-slate-50/20'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>صلاحيات الوحدات</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setActiveTab('data');
                  triggerNotification('صلاحيات البيانات مخصصة لربط الموظف بالفروع والمستودعات والعهدة الجغرافية', 'info');
                }}
                className={`flex-1 py-4.5 text-xs font-black transition-all flex items-center justify-center gap-2 border-b-2 ${
                  activeTab === 'data'
                    ? 'border-orange-600 text-orange-600 bg-slate-50/20'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>صلاحيات البيانات</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('reports');
                  triggerNotification('صلاحيات التقارير مخصصة لاعتمادات القوائم الختامية والموازنات السنوية للفرع', 'info');
                }}
                className={`flex-1 py-4.5 text-xs font-black transition-all flex items-center justify-center gap-2 border-b-2 ${
                  activeTab === 'reports'
                    ? 'border-orange-600 text-orange-600 bg-slate-50/20'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>صلاحيات التقارير</span>
              </button>
            </div>

            {/* Matrix Table */}
            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {activeTab === 'employee_matrix' ? (
                <div className="min-w-max p-4">
                  <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-orange-100 bg-orange-50/50 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-800">مصفوفة الموظفين حسب الإدارة والمسمى</h4>
                      <p className="mt-1 text-[10px] font-semibold leading-relaxed text-slate-500">كل صف موظف داخل مجموعته الإدارية، وكل خلية شاشة تحتوي على مربع مستقل لكل زر برمجي. علامة الصح تعني صلاحية ممنوحة، والخانة الفارغة تعني عدم وجود الصلاحية.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {MATRIX_COLUMNS.map(column => (
                        <span key={column.id} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[9px] font-black text-slate-500" title={column.label}>
                          {column.label.split(' ')[0]}
                        </span>
                      ))}
                    </div>
                  </div>

                  {employeeGroups.length === 0 ? (
                    <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center">
                      <Users className="h-12 w-12 text-slate-300" />
                      <h4 className="text-sm font-black text-slate-700">لا توجد حسابات مستخدمين معروضة</h4>
                      <p className="max-w-md text-[10px] font-semibold leading-relaxed text-slate-400">
                        {canonicalPersistenceRequired
                          ? 'المصفوفة جاهزة، لكن بيانات المستخدمين يجب أن تصل من مصدر الهوية المركزي قبل منح أو تعديل أي صلاحية.'
                          : 'أضف مستخدمين إلى بيئة التشغيل أو أزل فلاتر البحث والحالة لعرض المجموعات.'}
                      </p>
                    </div>
                  ) : (
                    <table className="w-full border-collapse text-right text-[10px]">
                      <thead className="sticky top-0 z-20 bg-white shadow-sm">
                        <tr className="border-b border-slate-200">
                          <th rowSpan={2} className="sticky right-0 z-30 min-w-[230px] border-l border-slate-200 bg-slate-50 px-4 py-3 text-right text-xs font-black text-slate-800">المستخدم / المسمى / نوع الصلاحية</th>
                          {filteredPermissionCategories.map(category => (
                            <th key={category.id} colSpan={category.screens.length} className="border-l border-slate-200 bg-slate-100/80 px-3 py-2 text-center text-[10px] font-black text-slate-700">
                              {category.label}
                            </th>
                          ))}
                        </tr>
                        <tr className="border-b border-slate-200">
                          {filteredPermissionCategories.flatMap(category => category.screens.map(screen => (
                            <th key={`${category.id}:${screen.id}`} title={screen.label} className="min-w-[155px] border-l border-slate-100 bg-slate-50 px-2 py-2 text-center text-[9px] font-black text-slate-500">
                              <span className="block truncate">{screen.label}</span>
                              <span className="mt-1 block font-mono text-[8px] font-semibold text-slate-400">{category.id}:{screen.id}</span>
                              <span className="mt-1 grid grid-cols-5 gap-0.5 text-[8px] font-black text-slate-400" aria-label="ترتيب أزرار الصلاحيات">
                                {MATRIX_COLUMNS.map(column => <span key={column.id}>{column.label.split(' ')[0]}</span>)}
                              </span>
                            </th>
                          )))}
                        </tr>
                      </thead>
                      <tbody>
                        {employeeGroups.map(group => (
                          <React.Fragment key={group.label}>
                            <tr>
                              <th colSpan={visibleScreenCount + 1} className="border-y border-orange-100 bg-orange-50/70 px-4 py-3 text-right">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-600"><Users className="h-4 w-4" /></div>
                                  <span className="text-xs font-black text-orange-950">{group.label}</span>
                                  <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-black text-orange-700">{group.employees.length} مستخدم</span>
                                </div>
                              </th>
                            </tr>
                            {group.employees.map(employee => (
                              <tr key={employee.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                <td className="sticky right-0 z-10 min-w-[230px] border-l border-slate-200 bg-white px-3 py-3 align-top">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveEmployeeId(employee.id);
                                      triggerNotification(`تم اختيار المستخدم ${employee.name} لمراجعة تفاصيله`, 'info');
                                    }}
                                    aria-pressed={activeEmployeeId === employee.id}
                                    className={`w-full rounded-xl p-2 text-right transition focus:outline-none focus:ring-2 focus:ring-orange-300 ${activeEmployeeId === employee.id ? 'bg-orange-50' : 'hover:bg-slate-50'}`}
                                  >
                                    <span className="flex items-center justify-between gap-2">
                                      <span className="truncate text-xs font-black text-slate-800">{employee.name}</span>
                                      <span className={`h-2 w-2 shrink-0 rounded-full ${employee.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`} title={employee.status === 'active' ? 'نشط' : 'غير نشط'} />
                                    </span>
                                    <span className="mt-1 block truncate text-[9px] font-bold text-slate-500">{employee.jobTitle}</span>
                                    <span className="mt-1 block truncate text-[9px] font-black text-indigo-600">{employeePermissionTypeLabel(employee)}</span>
                                    <span className="mt-1 block text-[9px] font-black text-orange-600">
                                      {employee.permissions.includes('*') ? 'كامل الصلاحيات' : `${ALL_AUTHORIZATION_KEYS.filter(key => employee.permissions.includes(key)).length} نقطة ممنوحة`}
                                    </span>
                                  </button>
                                </td>
                                {filteredPermissionCategories.flatMap(category => category.screens.map(screen => (
                                  <td key={`${employee.id}:${category.id}:${screen.id}`} className="border-l border-slate-100 p-2 align-top">
                                    <div className="grid grid-cols-5 gap-1">
                                      {MATRIX_COLUMNS.map(column => {
                                        const checked = isPermissionEnabledForEmployee(employee, category.id, screen.id, column.id);
                                        return (
                                          <button
                                            key={column.id}
                                            type="button"
                                            role="checkbox"
                                            aria-checked={checked}
                                            aria-label={`${checked ? 'إلغاء' : 'منح'} ${column.label} — ${screen.label} — ${employee.name}`}
                                            disabled={canonicalPersistenceRequired}
                                            onClick={() => {
                                              setActiveEmployeeId(employee.id);
                                              handleToggleEmployeePermission(employee.id, category.id, screen.id, column.id);
                                            }}
                                            className={`flex h-6 min-w-6 items-center justify-center rounded-md border text-[9px] font-black transition active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 ${checked ? 'border-orange-500 bg-orange-600 text-white' : 'border-slate-200 bg-white text-slate-300 hover:border-orange-300'}`}
                                            title={`${employee.name} — ${category.label} — ${screen.label} — ${column.label} — ${checked ? 'ممنوحة' : 'غير ممنوحة'}`}
                                          >
                                            {checked ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : '—'}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </td>
                                )))}
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : activeTab === 'modules' ? (
                <table className="w-full text-right border-collapse min-w-[900px]">
                  {/* Table Header */}
                  <thead className="sticky top-0 bg-slate-50/80 backdrop-blur-md z-10 border-b border-slate-200 select-none">
                    <tr>
                      <th className="px-6 py-3.5 text-xs font-black text-slate-900 w-[28%]">الوحدات والشاشات</th>
                      {MATRIX_COLUMNS.map((col) => (
                        <th key={col.id} className="px-2 py-3.5 text-xs font-black text-slate-500 text-center w-[8%]">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  
                  {/* Table Body */}
                  <tbody>
                    {filteredPermissionCategories.map((cat) => {
                      const isExpanded = !!expandedCategories[cat.id];
                      const IconComponent = cat.icon;
                      const grantedCount = categoryPermissionCount(cat);
                      const categoryTotal = categoryPermissionKeys(cat).length;
                      const isCategoryFullyGranted = categoryTotal > 0 && grantedCount === categoryTotal;
                      
                      return (
                        <React.Fragment key={cat.id}>
                          {/* Module Main Category Row */}
                          <tr className="bg-slate-50/45 border-b border-slate-100 select-none">
                            <td colSpan={MATRIX_COLUMNS.length + 1} className="px-4 py-3">
                              <div className="flex items-center justify-between gap-3">
                                <div
                                  onClick={() => toggleCategory(cat.id)}
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                      event.preventDefault();
                                      toggleCategory(cat.id);
                                    }
                                  }}
                                  role="button"
                                  tabIndex={0}
                                  aria-expanded={isExpanded}
                                  aria-label={`${isExpanded ? 'طي' : 'توسيع'} وحدة ${cat.label}`}
                                  className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg py-1 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
                                >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                                    <IconComponent className="w-4 h-4" />
                                  </div>
                                  <span className="text-xs font-black text-slate-800">{cat.label}</span>
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black text-slate-500">
                                    {cat.screens.length} شاشات
                                  </span>
                                </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-3 pl-2">
                                  <button
                                    type="button"
                                    role="checkbox"
                                    aria-checked={isCategoryFullyGranted}
                                    aria-label={`${isCategoryFullyGranted ? 'إلغاء' : 'تحديد'} صلاحيات وحدة ${cat.label}`}
                                    disabled={!activeEmployee || canonicalPersistenceRequired}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleToggleCategory(cat, !isCategoryFullyGranted);
                                    }}
                                    className={`rounded-lg border px-2 py-1 text-[9px] font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                      isCategoryFullyGranted
                                        ? 'border-orange-200 bg-orange-50 text-orange-700'
                                        : 'border-slate-200 bg-white text-slate-500 hover:border-orange-300 hover:text-orange-600'
                                    }`}
                                  >
                                    {isCategoryFullyGranted ? 'الوحدة محددة' : 'تحديد الوحدة'}
                                  </button>
                                  <span className="text-[9px] font-black text-slate-400">{grantedCount}/{categoryTotal}</span>
                                  {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                </div>
                              </div>
                            </td>
                          </tr>

                          {/* Screens & Checkboxes under this Category */}
                          {isExpanded && cat.screens.map((scr, sIdx) => {
                            // Highlights some rows beautifully. E.g., the "الطلاب" node in screenshot has special highlight
                            const isFirstSubNode = cat.id === 'students' && sIdx === 1; // "استعراض الطلاب" acts like "الطلاب" main listing
                            
                            return (
                              <tr 
                                key={scr.id} 
                                className={`border-b border-slate-100/60 transition-all ${
                                  isFirstSubNode ? 'bg-orange-50/50 hover:bg-orange-50/70' : 'hover:bg-slate-50/30'
                                }`}
                              >
                                {/* Column 1: Screen Label with indent */}
                                <td className="px-8 py-3.5 text-xs font-bold text-slate-700">
                                  <div className="flex items-center gap-2 pr-4 border-r-2 border-slate-200">
                                    {isFirstSubNode && <Users className="w-3.5 h-3.5 text-orange-500" />}
                                    <span className="flex flex-col gap-0.5">
                                      <span>{scr.label}</span>
                                      <span className="font-mono text-[9px] font-semibold text-slate-400">{cat.id}:{scr.id}</span>
                                    </span>
                                  </div>
                                </td>

                                {/* Operations checkbox cells: every protected button is explicit and keyboard accessible. */}
                                {MATRIX_COLUMNS.map((col) => {
                                  const checked = isPermissionEnabled(cat.id, scr.id, col.id);
                                  const isLimited = scr.limitedPermissionColumns?.includes(col.id);

                                  return (
                                    <td key={col.id} className="p-2 text-center">
                                      <button
                                        type="button"
                                        role="checkbox"
                                        aria-checked={checked}
                                        aria-label={`${checked ? 'إلغاء' : 'منح'} ${col.label} — ${scr.label} — ${cat.label}`}
                                        disabled={!activeEmployee || canonicalPersistenceRequired}
                                        onClick={() => {
                                          handleTogglePermission(cat.id, scr.id, col.id);
                                          if (isLimited) {
                                            triggerNotification(`تم تعيين صلاحية محدودة مشروطة لـ [${col.label}] على شاشة [${scr.label}]`, 'info');
                                          }
                                        }}
                                        className={`mx-auto flex h-6 w-6 items-center justify-center rounded-md transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 ${
                                          isLimited
                                            ? checked
                                              ? 'border-2 border-dashed border-amber-500 bg-amber-100 text-amber-700'
                                              : 'border-2 border-dashed border-amber-400 bg-amber-50/30 hover:bg-amber-50'
                                            : checked
                                              ? 'bg-orange-600 text-white shadow-xs hover:bg-orange-700'
                                              : 'border border-slate-300 hover:border-orange-400'
                                        }`}
                                        title={isLimited ? 'صلاحية محدودة مشروطة' : checked ? 'صلاحية ممنوحة' : 'صلاحية غير ممنوحة'}
                                      >
                                        {isLimited ? <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> : checked ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
                                      </button>
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              ) : activeTab === 'reports' ? (
                <div className="p-6 space-y-6">
                  {/* Section 1: Dashboard and Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-orange-50/50 border border-orange-100 p-4 flex flex-col justify-between">
                      <span className="text-[11px] font-black text-slate-500">الشاشات والوحدات المراقبة</span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-2xl font-black text-slate-800">{permissionStats.moduleCount}</span>
                        <span className="text-xs font-semibold text-slate-400">وحدة برمجية</span>
                      </div>
                    </div>
                    <div className="bg-emerald-50/50 border border-emerald-100 p-4 flex flex-col justify-between">
                        <span className="text-[11px] font-black text-slate-500">أزرار العمليات المحمية</span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-2xl font-black text-slate-800">{permissionStats.actionCount}</span>
                        <span className="text-xs font-semibold text-slate-400">زر تفاعلي</span>
                      </div>
                    </div>
                    <div className="bg-violet-50/50 border border-violet-100 p-4 flex flex-col justify-between">
                      <span className="text-[11px] font-black text-slate-500">قوالب الأدوار المحملة</span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-2xl font-black text-slate-800">{roles.length}</span>
                        <span className="text-xs font-semibold text-slate-400">دور معرف</span>
                      </div>
                    </div>
                    <div className="bg-slate-50/80 border border-slate-200 p-4 flex flex-col justify-between">
                      <span className="text-[11px] font-black text-slate-500">حالة مصفوفة المستخدم</span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-2xl font-black text-slate-800">{permissionStats.coverage}%</span>
                        <span className="text-xs font-semibold text-slate-400">نسبة التغطية</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-[10px] font-semibold leading-relaxed text-slate-500">
                    النطاق المحسوب هنا هو كتالوج الصلاحيات المحمل من واجهة التطبيق: {permissionStats.moduleCount} وحدة، {permissionStats.screenCount} شاشة، و{permissionStats.actionCount} نقطة تحكم. أما الحماية الفعلية للـ API فتظل مفروضة من الخادم ومصدر الهوية المركزي.
                  </div>

                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {REPORT_PERMISSION_CATALOG.map(report => (
                      <div key={report.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-violet-600" />
                            <span className="text-xs font-black text-slate-800">{report.label}</span>
                          </div>
                          <span className="font-mono text-[9px] text-slate-400">report:{report.id}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {REPORT_PERMISSION_ACTIONS.map(action => {
                            const checked = isPermissionEnabled('report', report.id, action.id);
                            return (
                              <button
                                key={action.id}
                                type="button"
                                role="checkbox"
                                aria-checked={checked}
                                aria-label={`${checked ? 'إلغاء' : 'منح'} ${action.label} — ${report.label}`}
                                disabled={!activeEmployee || canonicalPersistenceRequired}
                                onClick={() => handleTogglePermission('report', report.id, action.id)}
                                className={`rounded-lg border px-2 py-2 text-[10px] font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                  checked ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-500 hover:border-violet-300 hover:text-violet-600'
                                }`}
                              >
                                {action.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Section 2: Heatmap Visualizer */}
                  <div className="border border-slate-200/85 p-5 space-y-4 shadow-2xs">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2">
                      <div>
                        <strong className="text-xs font-black text-slate-800">مصفوفة امتثال قوالب الأدوار (Zero Trust Matrix)</strong>
                        <p className="text-[10px] text-slate-400">مؤشر مراجعة للأدوار المحملة. قرار السماح النهائي يُحسم دائماً من الصلاحيات المشتقة على الخادم.</p>
                      </div>
                      <button
                        onClick={() => {
                          triggerNotification('تم تصدير تقرير الامتثال ومصفوفة الصلاحيات بصيغة Markdown وتهيئته للطباعة', 'success');
                          window.print();
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-black px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>تصدير وطباعة التقرير الفني</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-slate-150">
                      <table className="w-full text-right border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-transparent border-b border-slate-200 font-bold text-slate-700">
                            <th className="p-2.5">الدور الوظيفي (Role)</th>
                            <th className="p-2.5 text-center">عرض</th>
                            <th className="p-2.5 text-center">إدخال</th>
                            <th className="p-2.5 text-center">تعديل</th>
                            <th className="p-2.5 text-center">حذف</th>
                            <th className="p-2.5 text-center">اعتماد</th>
                            <th className="p-2.5 text-center">إلغاء</th>
                            <th className="p-2.5 text-center">ترحيل</th>
                            <th className="p-2.5 text-center">عكس القيد</th>
                            <th className="p-2.5 text-center">تصدير</th>
                            <th className="p-2.5 text-center">طباعة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roles.map((roleRow: any, idx) => (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                              <td className="p-2.5 font-bold text-slate-850">
                                <div className="flex flex-col">
                                  <span>{roleRow.name}</span>
                                  <span className="text-[9px] text-slate-400 font-mono">{roleRow.id}</span>
                                </div>
                              </td>
                              {['view','insert','edit','delete','approve','cancel','post','reverse','export','print'].map((actionId) => {
                                const rolePermissions = Array.isArray(roleRow.permissions) ? roleRow.permissions : [];
                                const hasPerm = rolePermissions.includes('*') || rolePermissions.some((permission: unknown) => {
                                  const normalized = String(permission).toLocaleLowerCase();
                                  return normalized.endsWith(`:${actionId}`) || normalized.endsWith(`.${actionId}`);
                                });
                                return (
                                  <td key={actionId} className="p-2.5 text-center">
                                    {hasPerm ? (
                                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 font-black" title="مسموح">✓</span>
                                    ) : (
                                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-rose-500/10 text-rose-500 font-bold" title="محجوب">✕</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <strong className="flex items-center gap-2 text-xs font-black text-slate-800">
                          <Workflow className="h-4 w-4 text-slate-500" />
                          سجل مراجعة تغييرات الصلاحيات
                        </strong>
                        <p className="mt-1 text-[10px] font-semibold text-slate-400">عرض آخر الأحداث المسلمة إلى الوحدة. لا يُنشئ هذا العرض سجلاً محلياً في الوضع الإنتاجي.</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500">{permissionsAuditLog.length} حدث</span>
                    </div>
                    {permissionsAuditLog.length > 0 ? (
                      <div className="space-y-2">
                        {permissionsAuditLog.slice(0, 5).map((audit: any) => (
                          <div key={audit.id} className="flex flex-col gap-1 rounded-xl bg-slate-50/80 p-3 text-[10px] sm:flex-row sm:items-center sm:justify-between">
                            <span className="font-bold text-slate-700">{audit.action || 'تغيير صلاحيات'}</span>
                            <span className="font-semibold text-slate-400">{audit.modifier || 'النظام'} • {audit.date || '—'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-[10px] font-semibold text-slate-400">لا توجد أحداث مراجعة محملة من المصدر الحالي.</p>
                    )}
                  </div>

                  {/* Section 3: Interactive Zero-Trust Simulation Sandbox */}
                  <div className="bg-slate-900 border border-slate-800 p-5 text-slate-200 space-y-4">
                    <div>
                      <strong className="text-xs font-black text-white flex items-center gap-1.5">
                        <Terminal className="w-4 h-4 text-emerald-500" />
                        <span>محاكي التحقق من الصلاحيات والتحصين ضد الاختراقات (Zero Trust Simulator)</span>
                      </strong>
                      <p className="text-[10px] text-slate-400">اختر دوراً وظيفياً وعملاً تفاعلياً لمحاكاة الفحص الفوري للسياسة الأمنية على الخادم الخلفي (Server-side Enforcement).</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 font-sans">الدور الوظيفي المستهدف (Target Role)</label>
                        <select 
                          value={simRole} 
                          onChange={(e) => setSimRole(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-200 outline-none cursor-pointer"
                        >
                          <option value="superadmin">مدير النظام (Super Admin)</option>
                          <option value="financial_manager">المدير المالي (Financial Manager)</option>
                          <option value="accountant">المحاسب العام (Accountant)</option>
                          <option value="cashier">أمين الصندوق (Cashier)</option>
                          <option value="student_affairs">شؤون الطلاب والقبول (Student Affairs)</option>
                          <option value="control">مسؤول الكنترول والامتحانات (Control Room)</option>
                          <option value="teacher">المعلم الأكاديمي (Teacher)</option>
                          <option value="auditor">المدقق المالي المساعد (Internal Auditor)</option>
                          <option value="parent">ولي الأمر (Parent)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 font-sans">الوحدة البرمجية / المستند المستهدف</label>
                        <select 
                          value={simResource} 
                          onChange={(e) => setSimResource(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-200 outline-none cursor-pointer"
                        >
                          <option value="student">بيانات الطلاب والشعب الدراسية (Students)</option>
                          <option value="invoice">الفواتير وسندات القبض المالية (Invoices & Receipts)</option>
                          <option value="attendance">تحضير الطلاب والغياب اليومي (Attendance)</option>
                          <option value="ledger">القيود اليومية والترحيل المالي (Journal Entries)</option>
                          <option value="exam">قوالب وشهادات الامتحانات والكنترول (Exams)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 font-sans">نوع العملية الحساسة المطلوبة</label>
                        <select 
                          value={simAction} 
                          onChange={(e) => setSimAction(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-200 outline-none cursor-pointer"
                        >
                          <option value="view">عرض تفصيلي (View)</option>
                          <option value="insert">إدخال سجل جديد (Insert)</option>
                          <option value="edit">تعديل سجل قائم (Edit)</option>
                          <option value="delete">حذف نهائي للسجل (Delete)</option>
                          <option value="approve">اعتماد المستند والعملية (Approve)</option>
                          <option value="cancel">إلغاء المستند أو القيد (Cancel)</option>
                          <option value="post">ترحيل نهائي إلى السجل (Post)</option>
                          <option value="reverse">تراجع أو عكس قيد مالي (Reverse)</option>
                          <option value="export">تصدير خارجي XLS/CSV (Export)</option>
                          <option value="print">طباعة المستند الرسمي (Print)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={runSecuritySimulation}
                        className="bg-emerald-600 hover:bg-emerald-750 text-slate-950 text-xs font-black px-4 py-2 rounded-lg transition-all cursor-pointer hover:shadow-xs flex items-center gap-1.5"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        <span>قم بمحاكاة التحقق من الخادم (Simulate Server-Side Check)</span>
                      </button>
                      <button
                        onClick={() => {
                          setSimLogs([]);
                          setSimResult('idle');
                        }}
                        className="border border-slate-750 hover:bg-slate-800 text-slate-300 text-xs font-semibold px-3 py-2 rounded-lg transition-all cursor-pointer"
                      >
                        تصفير اللوج
                      </button>
                    </div>

                    {simLogs.length > 0 && (
                      <div className="bg-slate-950 border border-slate-850 p-4 font-mono text-[10px] space-y-1.5 text-slate-300">
                        <div className="flex justify-between items-center text-slate-500 border-b border-slate-850 pb-1.5 mb-2 font-sans font-bold">
                          <span>Server Security Console Trace Logs:</span>
                          {simResult === 'allowed' ? (
                            <span className="text-[10px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800 font-sans">✅ ACCESS GRANTED (مسموح)</span>
                          ) : simResult === 'denied' ? (
                            <span className="text-[10px] text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded border border-rose-800 font-sans font-bold">❌ ACCESS DENIED (محجوب أمنياً)</span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-sans">RUNNING...</span>
                          )}
                        </div>
                        <div className="space-y-1 max-h-48 overflow-y-auto leading-relaxed text-right" dir="ltr">
                          {simLogs.map((logLine, idx) => (
                            <div key={idx} className={logLine.includes('ACCESS GRANTED') ? 'text-emerald-400 font-bold text-left' : logLine.includes('ACCESS DENIED') ? 'text-rose-400 font-bold text-left' : 'text-slate-300 text-left'}>
                              {logLine}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-5 space-y-5">
                  <div className="flex flex-col gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <Database className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
                      <div>
                        <h4 className="text-xs font-black text-slate-800">نطاق البيانات — أين يستطيع الموظف رؤية السجلات؟</h4>
                        <p className="mt-1 text-[10px] font-semibold leading-relaxed text-slate-500">افصل بين صلاحية تنفيذ العملية وبين نطاق البيانات التي تنطبق عليها. هذا يمنع منح موظف صلاحية واسعة لمجرد حاجته إلى فرع أو مخزن واحد.</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full border border-sky-200 bg-white px-3 py-1 text-[10px] font-black text-sky-700">{DATA_SCOPE_CATALOG.length} نطاقات</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {DATA_SCOPE_CATALOG.map(scope => (
                      <div key={scope.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h5 className="text-xs font-black text-slate-800">{scope.label}</h5>
                            <p className="mt-1 text-[10px] font-semibold text-slate-400">{scope.description}</p>
                          </div>
                          <span className="font-mono text-[9px] text-slate-400">data_scope:{scope.id}</span>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {DATA_SCOPE_ACTIONS.map(action => {
                            const checked = isPermissionEnabled('data_scope', scope.id, action.id);
                            return (
                              <button
                                key={action.id}
                                type="button"
                                role="checkbox"
                                aria-checked={checked}
                                aria-label={`${checked ? 'إلغاء' : 'منح'} ${action.label} — ${scope.label}`}
                                disabled={!activeEmployee || canonicalPersistenceRequired}
                                onClick={() => handleTogglePermission('data_scope', scope.id, action.id)}
                                className={`rounded-lg border px-2 py-2 text-[10px] font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                  checked ? 'border-sky-300 bg-sky-50 text-sky-700' : 'border-slate-200 text-slate-500 hover:border-sky-300 hover:text-sky-600'
                                }`}
                              >
                                {action.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {[
                      { title: 'مبدأ أقل صلاحية', text: 'ابدأ بعرض محدود ثم امنح الإدخال والتعديل عند الحاجة الفعلية.', icon: ShieldCheck },
                      { title: 'فصل المهام', text: 'لا تجمع الإدخال والاعتماد والترحيل لموظف واحد دون مبرر.', icon: Sliders },
                      { title: 'نطاق موثق', text: 'الفروع والمخازن والخزائن تُربط بالسياق الموثوق لا بإدخال المتصفح.', icon: Shield }
                    ].map(rule => {
                      const RuleIcon = rule.icon;
                      return (
                        <div key={rule.title} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                          <RuleIcon className="h-4 w-4 text-slate-500" />
                          <strong className="mt-2 block text-[10px] font-black text-slate-700">{rule.title}</strong>
                          <p className="mt-1 text-[9px] font-semibold leading-relaxed text-slate-400">{rule.text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Matrix Legend / Table Footer Exactly matching the screenshot */}
            <div className="p-4 border-t border-slate-100 bg-transparent flex items-center justify-center gap-8 select-none flex-wrap">
              {/* Full Permission */}
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <div className="w-5 h-5 rounded-md bg-orange-600 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span>صلاحية كاملة</span>
              </div>

              {/* Limited Permission */}
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <div className="w-5 h-5 rounded-md border-2 border-dashed border-amber-500 bg-amber-50/30 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                </div>
                <span>صلاحية محدودة</span>
              </div>

              {/* No Permission */}
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <div className="w-5 h-5 rounded-md border border-slate-300 bg-white" />
                <span>لا توجد صلاحية</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 4. FOOTER STATUS BAR (EXACTLY REPLICATING SCREENSHOT BOTTOM BAR) */}
      <div className="border-t border-slate-200/60 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 font-bold select-none gap-3">
        {/* Left Status Text */}
        <div className="flex items-center gap-2">
          <span>EduPro ERP v2.6.0</span>
          <span>|</span>
          <span>جميع الحقوق محفوظة</span>
        </div>

        {/* Right Status Badges */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>فرع الياسمين (رئيسي)</span>
          </div>
          <span>|</span>
          <div className="flex items-center gap-1.5 text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>متصل</span>
          </div>
          <span>|</span>
          <span className="text-slate-500">آخر دخول: 14/07/2026 - 09:42 AM</span>
        </div>
      </div>

    </div>
  );
};
