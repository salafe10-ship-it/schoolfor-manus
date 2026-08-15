export interface Employee {
  id: string;
  department: string;
  jobTitle: string;
  permissions: string[];
}

export class PermissionsCalculationService {
  static calculatePermissions(emp: Employee): string[] {
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
    if (emp.department === 'الحسابات' || emp.department === 'الخزينة' || emp.department === 'شؤون الموظفين') {
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
    if (emp.department === 'المخازن' || emp.department === 'النقل') {
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
    
    return perms;
  }
}
