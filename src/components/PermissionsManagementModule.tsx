import { Award, Ban, BarChart3, Bell, BookOpen, Building2, Bus, CalendarCheck, Check, CheckSquare, ChevronDown, ChevronRight, Coins, Container, CreditCard, Database, DatabaseZap, Eye, FileText, GraduationCap, HelpCircle, Layers, Search, Settings, Settings2, Shield, ShieldAlert, ShieldCheck, Shirt, Sliders, Terminal, UserCheck, Users, WalletCards, Workflow } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { SecuritySimulationService } from '../modules/authorization/application/SecuritySimulationService';
import { PermissionsCalculationService, Employee as ServiceEmployee } from '../modules/authorization/application/PermissionsCalculationService';
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

export interface Employee {
  id: string;
  name: string;
  jobTitle: string;
  department: string;
  status: 'active' | 'inactive';
  permissions: string[]; // List of enabled "screenId:action" codes or "*" for Super Admin
  avatar?: string;
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

const PERMISSIONS_CATEGORIES_TREE: ModuleCategory[] = [
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
  }
];

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
  // Local high-fidelity state to track selected employee, searches, and configurations
  const [employees, setEmployees] = useState<Employee[]>(() => {
    // Sync with existing props or localStorage, otherwise default to high fidelity
    const saved = localStorage.getItem('edupro_employees_permissions_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return INITIAL_EMPLOYEES_LIST;
  });

  const [activeEmployeeId, setActiveEmployeeId] = useState<string>('emp_1');
  const [employeeSearch, setEmployeeSearch] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [activeTab, setActiveTab] = useState<'modules' | 'data' | 'reports'>('modules');

  // Expanded categories state (Student Affairs is expanded by default)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    students: true
  });

  // Track active changes to highlight save button
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

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

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchDept = selectedDept === 'all' || emp.department === selectedDept;
      const matchStatus = selectedStatus === 'all' || emp.status === selectedStatus;
      const matchSearch = emp.name.includes(employeeSearch) || 
                          emp.jobTitle.includes(employeeSearch) || 
                          emp.id.includes(employeeSearch);
      return matchDept && matchStatus && matchSearch;
    });
  }, [employees, selectedDept, selectedStatus, employeeSearch]);

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

  // Check if a permission is enabled for active employee
  const isPermissionEnabled = (catId: string, screenId: string, actionId: string) => {
    if (!activeEmployee) return false;
    if (activeEmployee.permissions.includes('*')) return true;
    const permKey = `${catId}:${screenId}:${actionId}`;
    return activeEmployee.permissions.includes(permKey);
  };

  // Toggle single permission checkbox
  const handleTogglePermission = (catId: string, screenId: string, actionId: string) => {
    if (!activeEmployee) return;
    
    const permKey = `${catId}:${screenId}:${actionId}`;
    let newPermissions = [...activeEmployee.permissions];
    
    if (newPermissions.includes('*')) {
      // Expand wildcard * to all possible keys EXCEPT the toggled one
      const allPossibleKeys: string[] = [];
      PERMISSIONS_CATEGORIES_TREE.forEach(cat => {
        cat.screens.forEach(scr => {
          MATRIX_COLUMNS.forEach(col => {
            allPossibleKeys.push(`${cat.id}:${scr.id}:${col.id}`);
          });
        });
      });
      newPermissions = allPossibleKeys.filter(k => k !== permKey);
    } else if (newPermissions.includes(permKey)) {
      newPermissions = newPermissions.filter(p => p !== permKey);
    } else {
      newPermissions.push(permKey);
    }

    setEmployees(prev => prev.map(emp => {
      if (emp.id === activeEmployee.id) {
        return { ...emp, permissions: newPermissions };
      }
      return emp;
    }));

    setHasUnsavedChanges(true);
  };

  // Save changes to localStorage and synchronize with context props
  const handleSaveChanges = () => {
    localStorage.setItem('edupro_employees_permissions_v1', JSON.stringify(employees));
    setHasUnsavedChanges(false);

    // Sync with global simulated users state to keep the ERP in total sync
    const syncedUsers = users.map(u => {
      // Try to find matching employee
      const match = employees.find(e => e.name === u.name || e.id === u.id);
      if (match) {
        return { ...u, permissions: match.permissions };
      }
      return u;
    });
    setUsers(syncedUsers);
    
    // Update active drill down user if matched
    if (currentDrillDownUser) {
      const match = employees.find(e => e.id === activeEmployeeId);
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
      action: `تعديل وحفظ مصفوفة الصلاحيات بالكامل لموظف: ${activeEmployee.name}`,
      device: 'متصفح الإدارة الموحد',
      ip: '192.168.1.104'
    };
    setPermissionsAuditLog([newAuditLog, ...permissionsAuditLog]);

    triggerNotification(`تم حفظ التغييرات ومزامنة الصلاحيات بنجاح للموظف: ${activeEmployee.name}`, 'success');
  };

  // Check all / Select all permissions for active employee
  const handleSelectAll = () => {
    if (!activeEmployee) return;
    const allKeys: string[] = [];
    PERMISSIONS_CATEGORIES_TREE.forEach(cat => {
      cat.screens.forEach(scr => {
        MATRIX_COLUMNS.forEach(col => {
          allKeys.push(`${cat.id}:${scr.id}:${col.id}`);
        });
      });
    });

    setEmployees(prev => prev.map(emp => {
      if (emp.id === activeEmployee.id) {
        return { ...emp, permissions: allKeys };
      }
      return emp;
    }));
    setHasUnsavedChanges(true);
    triggerNotification('تم تحديد كافة الخيارات والصلاحيات للموظف النشط', 'info');
  };

  // Clear all / Deselect all permissions for active employee
  const handleDeselectAll = () => {
    if (!activeEmployee) return;
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
    if (!activeEmployee) return;
    let templatePerms: string[] = [];

    if (roleType === 'admin') {
      templatePerms = ['*'];
    } else if (roleType === 'staff') {
      // Visibility, View, Save, Edit, Print
      PERMISSIONS_CATEGORIES_TREE.forEach(cat => {
        cat.screens.forEach(scr => {
          templatePerms.push(`${cat.id}:${scr.id}:visibility`);
          templatePerms.push(`${cat.id}:${scr.id}:view`);
          templatePerms.push(`${cat.id}:${scr.id}:save`);
          templatePerms.push(`${cat.id}:${scr.id}:edit`);
          templatePerms.push(`${cat.id}:${scr.id}:print`);
        });
      });
    } else {
      // Visibility and Read/view only
      PERMISSIONS_CATEGORIES_TREE.forEach(cat => {
        cat.screens.forEach(scr => {
          templatePerms.push(`${cat.id}:${scr.id}:visibility`);
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
              placeholder="البحث في الموظفين أو الصلاحيات..."
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
            <Shield className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>إدارة الصلاحيات</span>
            </h2>
            <div className="text-xs text-slate-400 font-semibold mt-1 flex items-center gap-1.5 select-none">
              <span>الرئيسية</span>
              <span>•</span>
              <span>إدارة المستخدمين</span>
              <span>•</span>
              <span className="text-slate-500 font-bold">إدارة الصلاحيات</span>
            </div>
          </div>
        </div>

        {/* Action Buttons exactly matching the screenshot layout */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Apply template with dropdown or single trigger */}
          <div className="relative group">
            <button 
              type="button"
              className="px-4 py-2 hover:bg-transparent text-slate-700 font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4 text-slate-400" />
              <span>تطبيق قالب</span>
            </button>
            <div className="absolute left-0 top-full mt-1.5 w-48 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-1">
              <button 
                onClick={() => handleApplyTemplate('admin')} 
                className="w-full text-right px-3 py-2 text-xs font-semibold hover:bg-transparent rounded-lg text-slate-800 flex items-center gap-2"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                <span>كامل الصلاحيات (Super Admin)</span>
              </button>
              <button 
                onClick={() => handleApplyTemplate('staff')} 
                className="w-full text-right px-3 py-2 text-xs font-semibold hover:bg-transparent rounded-lg text-slate-800 flex items-center gap-2"
              >
                <Sliders className="w-3.5 h-3.5 text-orange-500" />
                <span>صلاحيات تشغيلية مخصصة</span>
              </button>
              <button 
                onClick={() => handleApplyTemplate('view_only')} 
                className="w-full text-right px-3 py-2 text-xs font-semibold hover:bg-transparent rounded-lg text-slate-800 flex items-center gap-2"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>عرض وتقارير فقط</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleSelectAll}
            className="px-4 py-2 hover:bg-transparent text-slate-700 font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <CheckSquare className="w-4 h-4 text-slate-400" />
            <span>تحديد الكل</span>
          </button>

          <button
            onClick={handleDeselectAll}
            className="px-4 py-2 hover:bg-transparent text-slate-700 font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Ban className="w-4 h-4 text-slate-400" />
            <span>إلغاء الكل</span>
          </button>

          <button
            onClick={() => triggerNotification('شاشة إعدادات الصلاحيات المتقدمة وقواعد الحماية', 'info')}
            className="px-4 py-2 hover:bg-transparent text-slate-700 font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>إعدادات الصلاحيات</span>
          </button>

          {/* Highlighted Save Changes Button */}
          <button
            onClick={handleSaveChanges}
            className={`px-5 py-2 flex items-center gap-2 text-xs font-extrabold transition-all cursor-pointer border ${
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

      {/* 3. CORE DUAL COLUMN SYSTEM LAYOUT */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 bg-slate-50/50">
        
        {/* COLUMN A: EMPLOYEE LIST PANEL (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-[680px]">
            {/* Header count label */}
            <div className="px-5 py-4 border-b border-slate-100 bg-white">
              <h3 className="text-sm font-black text-slate-900 select-none">
                الموظفون <span className="text-slate-400 font-bold">({filteredEmployees.length})</span>
              </h3>
            </div>

            {/* Sub-Header Column Labels */}
            <div className="px-5 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-black select-none">
              <span>الموظف</span>
              <span>الوظيفة</span>
            </div>

            {/* Table-like Employees List container */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {paginatedEmployees.map((emp) => {
                const isSelected = emp.id === activeEmployeeId;
                return (
                  <div
                    key={emp.id}
                    onClick={() => {
                      setActiveEmployeeId(emp.id);
                      triggerNotification(`عرض مصفوفة الصلاحيات لـ: ${emp.name}`, 'info');
                    }}
                    className={`px-5 py-3.5 border-b border-slate-100/60 flex items-center justify-between cursor-pointer transition-all duration-150 select-none ${
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
                  </div>
                );
              })}

              {filteredEmployees.length === 0 && (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <Users className="w-8 h-8 text-slate-300" />
                  <span className="text-xs font-bold">لا توجد سجلات تطابق البحث</span>
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
                  <h4 className="text-xs font-black text-slate-900">أنت تقوم بتعديل صلاحيات: {activeEmployee.name}</h4>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">الدور: {activeEmployee.jobTitle} • قسم: {activeEmployee.department}</p>
                </div>
              </div>
              <div className="border border-orange-200/50 px-3 py-1 text-[10px] text-orange-700 font-black">
                {activeEmployee.permissions.includes('*') ? 'صلاحية كاملة مقيدة' : `تخصيص يدوي (${activeEmployee.permissions.length} صلاحية)`}
              </div>
            </div>
          )}

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          </div>

          {/* Matrix Card containing Tabs and Table */}
          <div className="border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden flex flex-col h-[580px]">
            
            {/* Tab Headers Row */}
            <div className="flex border-b border-slate-100 select-none">
              <button
                onClick={() => setActiveTab('modules')}
                className={`flex-1 py-4.5 text-xs font-black transition-all flex items-center justify-center gap-2 border-b-2 ${
                  activeTab === 'modules'
                    ? 'border-orange-600 text-orange-600 bg-slate-50/20'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>صلاحيات الوحدات</span>
              </button>
              
              <button
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
              {activeTab === 'modules' ? (
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
                    {PERMISSIONS_CATEGORIES_TREE.map((cat) => {
                      const isExpanded = !!expandedCategories[cat.id];
                      const IconComponent = cat.icon;
                      
                      return (
                        <React.Fragment key={cat.id}>
                          {/* Module Main Category Row */}
                          <tr className="bg-slate-50/45 border-b border-slate-100 select-none">
                            <td colSpan={10} className="px-4 py-3">
                              <div 
                                onClick={() => toggleCategory(cat.id)}
                                className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-all"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                                    <IconComponent className="w-4 h-4" />
                                  </div>
                                  <span className="text-xs font-black text-slate-800">{cat.label}</span>
                                </div>
                                <div className="text-slate-400 pl-2">
                                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
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
                                    <span>{scr.label}</span>
                                  </div>
                                </td>

                                {/* 9 Operations Checkbox cells */}
                                {MATRIX_COLUMNS.map((col) => {
                                  const checked = isPermissionEnabled(cat.id, scr.id, col.id);
                                  const isLimited = scr.limitedPermissionColumns?.includes(col.id);

                                  return (
                                    <td key={col.id} className="p-2 text-center">
                                      <div className="flex items-center justify-center">
                                        {isLimited ? (
                                          // Limited Permission (Dashed Orange border)
                                          <div 
                                            onClick={() => {
                                              handleTogglePermission(cat.id, scr.id, col.id);
                                              triggerNotification(`تم تعيين صلاحية محدودة مشروطة لـ [${col.label}] على شاشة [${scr.label}]`, 'info');
                                            }}
                                            className="w-5 h-5 rounded-md border-2 border-dashed border-amber-500 bg-amber-50/30 flex items-center justify-center cursor-pointer hover:bg-amber-50 transition-all"
                                            title="صلاحية محدودة"
                                          >
                                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                          </div>
                                        ) : checked ? (
                                          // Full Permission (Blue box with checkmark)
                                          <div 
                                            onClick={() => handleTogglePermission(cat.id, scr.id, col.id)}
                                            className="w-5 h-5 rounded-md bg-orange-600 text-white flex items-center justify-center cursor-pointer shadow-xs scale-100 active:scale-90 transition-all"
                                          >
                                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                                          </div>
                                        ) : (
                                          // No Permission (Gray outline box)
                                          <div 
                                            onClick={() => handleTogglePermission(cat.id, scr.id, col.id)}
                                            className="w-5 h-5 rounded-md border border-slate-300 hover:border-slate-400 cursor-pointer scale-100 active:scale-90 transition-all"
                                          />
                                        )}
                                      </div>
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
                        <span className="text-2xl font-black text-slate-800">18</span>
                        <span className="text-xs font-semibold text-slate-400">وحدة برمجية</span>
                      </div>
                    </div>
                    <div className="bg-emerald-50/50 border border-emerald-100 p-4 flex flex-col justify-between">
                      <span className="text-[11px] font-black text-slate-500">أزرار العمليات المحمية</span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-2xl font-black text-slate-800">180</span>
                        <span className="text-xs font-semibold text-slate-400">زر تفاعلي</span>
                      </div>
                    </div>
                    <div className="bg-violet-50/50 border border-violet-100 p-4 flex flex-col justify-between">
                      <span className="text-[11px] font-black text-slate-500">مسارات الـ API الخلفية المؤمنة</span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-2xl font-black text-slate-800">45</span>
                        <span className="text-xs font-semibold text-slate-400">نقطة اتصال</span>
                      </div>
                    </div>
                    <div className="bg-emerald-50/50 border border-emerald-150 p-4 flex flex-col justify-between">
                      <span className="text-[11px] font-black text-slate-500">ثغرات ومسارات تسريب نشطة</span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-2xl font-black text-emerald-600">0</span>
                        <span className="text-xs font-semibold text-emerald-500">حالة آمنة بالكامل</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Heatmap Visualizer */}
                  <div className="border border-slate-200/85 p-5 space-y-4 shadow-2xs">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2">
                      <div>
                        <strong className="text-xs font-black text-slate-800">مصفوفة الامتثال للوظائف والصلاحيات الـ 10 (Zero Trust Matrix)</strong>
                        <p className="text-[10px] text-slate-400">خارطة الامتثال الحرارية تظهر الصلاحيات المسندة لكل دور وظيفي على الخادم الخلفي بشكل قاطع.</p>
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
                          {[
                            { r: 'مدير النظام / مالك المؤسسة', e: 'superadmin', perms: ['view','insert','edit','delete','approve','cancel','post','reverse','export','print'] },
                            { r: 'المدير المالي (Financial Manager)', e: 'financial_manager', perms: ['view','insert','edit','delete','approve','cancel','post','reverse','export','print'] },
                            { r: 'المحاسب العام (Accountant)', e: 'accountant', perms: ['view','insert','edit','post','export','print'] },
                            { r: 'أمين الصندوق (Cashier)', e: 'cashier', perms: ['view','insert','print'] },
                            { r: 'شؤون الطلاب والقبول (Student Affairs)', e: 'student_affairs', perms: ['view','insert','edit','export','print'] },
                            { r: 'مسؤول الكنترول والنتائج (Control Room)', e: 'control', perms: ['view','insert','edit','delete','approve','cancel','post','export','print'] },
                            { r: 'شؤون الموظفين والرواتب (HR Manager)', e: 'hr_manager', perms: ['view','insert','edit','delete','approve','cancel','post','export','print'] },
                            { r: 'المعلم الأكاديمي (Teacher)', e: 'teacher', perms: ['view','insert','edit'] },
                            { r: 'المدقق المالي المساعد (Auditor)', e: 'auditor', perms: ['view','export','print'] },
                            { r: 'ولي الأمر / الطالب (Parent/Student)', e: 'parent', perms: ['view'] }
                          ].map((roleRow, idx) => (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                              <td className="p-2.5 font-bold text-slate-850">
                                <div className="flex flex-col">
                                  <span>{roleRow.r}</span>
                                  <span className="text-[9px] text-slate-400 font-mono">{roleRow.e}</span>
                                </div>
                              </td>
                              {['view','insert','edit','delete','approve','cancel','post','reverse','export','print'].map((actionId) => {
                                const hasPerm = roleRow.perms.includes(actionId);
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
                <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                  <Database className="w-12 h-12 text-slate-300 animate-pulse" />
                  <h4 className="text-sm font-bold text-slate-700 font-sans">شاشة عزل وحماية البيانات الحساسة</h4>
                  <p className="text-xs text-slate-500 max-w-md leading-relaxed font-sans bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
                    تم تكوين حظر عزل تام للفرع. لا توجد قنوات اتصال مشتركة لتسريب بيانات كشوف الحسابات والمبيعات مع الفروع الخارجية للمؤسسة.
                  </p>
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
