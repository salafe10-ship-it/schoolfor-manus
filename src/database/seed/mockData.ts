/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { School, Branch, User, Student, Teacher, Employee, Invoice, InventoryItem, BusRoute, AuditLog, SchoolClass, Exam, Attendance, Permission } from '../../types';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  status: 'connected' | 'disconnected' | 'configuring';
  syncedTables: string[];
}

export const initialSupabaseConfig: SupabaseConfig = {
  url: 'https://sahab-erp-v4.supabase.co',
  anonKey: '<public-anon-key-placeholder>',
  status: 'connected',
  syncedTables: [
    'schools', 'branches', 'users', 'students', 'teachers', 
    'employees', 'classes', 'exams', 'attendance', 
    'fees', 'invoices', 'inventory', 'buses', 'audit_logs'
  ]
};

export const schoolsSeed: School[] = [
  {
    id: 'school_1',
    name: 'مدارس النور الأهلية النموذجية',
    logo: '✨',
    type: 'private',
    licenseNumber: 'L-2024-8849',
    address: 'حي الياسمين، الرياض، المملكة العربية السعودية',
    phone: '+966 11 405 8899',
    email: 'info@alnoor.edu.sa',
    academicYear: '2026/2027 (الفصل الأول)'
  },
  {
    id: 'school_2',
    name: 'مدارس الفرسان العالمية',
    logo: '🛡️',
    type: 'international',
    licenseNumber: 'L-2023-1120',
    address: 'حي الروضة، جدة، المملكة العربية السعودية',
    phone: '+966 12 605 4422',
    email: 'contact@furssan.edu.sa',
    academicYear: '2026/2027 (الفصل الأول)'
  },
  {
    id: 'school_3',
    name: 'أكاديمية الرواد النموذجية',
    logo: '🎓',
    type: 'model',
    licenseNumber: 'L-2025-4491',
    address: 'حي النخيل، المنامة، البحرين',
    phone: '+973 17 888 222',
    email: 'admin@rowad.edu.bh',
    academicYear: '2026/2027 (الفصل الأول)'
  }
];

export const branchesSeed: Branch[] = [
  { id: 'branch_1_1', schoolId: 'school_1', name: 'فرع الياسمين (بنين)', city: 'الرياض', manager: 'د. عبد الرحمن السديري', studentCount: 650, teacherCount: 42 },
  { id: 'branch_1_2', schoolId: 'school_1', name: 'فرع النرجس (بنات)', city: 'الرياض', manager: 'أ. سارة الودعاني', studentCount: 580, teacherCount: 38 },
  { id: 'branch_2_1', schoolId: 'school_2', name: 'فرع جدة الرئيسي', city: 'جدة', manager: 'أ. دانيال سميث', studentCount: 820, teacherCount: 60 },
  { id: 'branch_3_1', schoolId: 'school_3', name: 'فرع المنامة الأساسي', city: 'المنامة', manager: 'أ. فاطمة العباسي', studentCount: 410, teacherCount: 30 }
];

export const classesSeed: SchoolClass[] = [
  { id: 'class_1', name: 'الصف الأول الابتدائي', level: 'primary', sections: ['أ', 'ب', 'ج'], capacity: 25 },
  { id: 'class_2', name: 'الصف الثاني الابتدائي', level: 'primary', sections: ['أ', 'ب'], capacity: 25 },
  { id: 'class_3', name: 'الصف الخامس الابتدائي', level: 'primary', sections: ['أ', 'ب', 'ج'], capacity: 30 },
  { id: 'class_4', name: 'الصف الأول المتوسط', level: 'middle', sections: ['أ', 'ب'], capacity: 30 },
  { id: 'class_5', name: 'الصف الثالث المتوسط', level: 'middle', sections: ['أ', 'ب', 'ج'], capacity: 30 },
  { id: 'class_6', name: 'الصف الأول الثانوي', level: 'high', sections: ['علمي أ', 'علمي ب', 'أدبي'], capacity: 35 },
  { id: 'class_7', name: 'الصف الثالث الثانوي', level: 'high', sections: ['علمي أ', 'علمي ب', 'أدبي'], capacity: 35 }
];

export const studentsSeed: Student[] = [
  { id: 'stud_1', schoolId: 'school_1', branchId: 'branch_1_1', name: 'خالد بن وليد الميمان', nationalId: '1092837483', classroom: 'الصف الأول الثانوي', section: 'علمي أ', parentName: 'وليد بن خالد الميمان', parentPhone: '+966 50 123 4567', registrationDate: '2024-09-01', status: 'active', feesPaid: 15000, feesRemaining: 5000, version: 1, isDeleted: false },
  { id: 'stud_2', schoolId: 'school_1', branchId: 'branch_1_1', name: 'يوسف بن أحمد الزهراني', nationalId: '1102938475', classroom: 'الصف الأول الثانوي', section: 'علمي أ', parentName: 'أحمد بن يوسف الزهراني', parentPhone: '+966 54 987 6543', registrationDate: '2024-09-02', status: 'active', feesPaid: 20000, feesRemaining: 0, version: 1, isDeleted: false },
  { id: 'stud_3', schoolId: 'school_1', branchId: 'branch_1_2', name: 'جوري بنت فهد الدوسري', nationalId: '1128374928', classroom: 'الصف الثالث المتوسط', section: 'أ', parentName: 'فهد بن عبد العزيز الدوسري', parentPhone: '+966 56 111 2222', registrationDate: '2025-09-01', status: 'active', feesPaid: 12000, feesRemaining: 3000, version: 1, isDeleted: false },
  { id: 'stud_4', schoolId: 'school_1', branchId: 'branch_1_1', name: 'زياد بن محمد العتيبي', nationalId: '1039485732', classroom: 'الصف الخامس الابتدائي', section: 'ب', parentName: 'محمد بن زياد العتيبي', parentPhone: '+966 55 444 3333', registrationDate: '2025-08-15', status: 'active', feesPaid: 8000, feesRemaining: 2000, version: 1, isDeleted: false },
  { id: 'stud_5', schoolId: 'school_1', branchId: 'branch_1_2', name: 'ريناد بنت رائد المطيري', nationalId: '1182746352', classroom: 'الصف الأول الابتدائي', section: 'أ', parentName: 'رائد بن سلمان المطيري', parentPhone: '+966 53 888 9999', registrationDate: '2026-06-10', status: 'active', feesPaid: 5000, feesRemaining: 15000, version: 1, isDeleted: false },
  { id: 'stud_6', schoolId: 'school_1', branchId: 'branch_1_1', name: 'sultan بن نايف الحربي', nationalId: '1082736451', classroom: 'الصف الثالث الثانوي', section: 'علمي ب', parentName: 'نايف بن سلطان الحربي', parentPhone: '+966 59 777 6666', registrationDate: '2023-09-01', status: 'suspended', feesPaid: 10000, feesRemaining: 10000, version: 1, isDeleted: false },
  
  // Other schools
  { id: 'stud_7', schoolId: 'school_2', branchId: 'branch_2_1', name: 'أيان توماس سمير', nationalId: '2283746251', classroom: 'الصف الخامس الابتدائي', section: 'أ', parentName: 'سمير توماس', parentPhone: '+966 50 222 3333', registrationDate: '2024-09-01', status: 'active', feesPaid: 35000, feesRemaining: 5000, version: 1, isDeleted: false },
  { id: 'stud_8', schoolId: 'school_3', branchId: 'branch_3_1', name: 'عبد الله بن عيسى آل خليفة', nationalId: '3029384712', classroom: 'الصف الثالث المتوسط', section: 'ب', parentName: 'عيسى بن عبد الله آل خليفة', parentPhone: '+973 39 444 555', registrationDate: '2025-09-01', status: 'active', feesPaid: 18000, feesRemaining: 2000, version: 1, isDeleted: false }
];

export const teachersSeed: Teacher[] = [
  { id: 'teach_1', schoolId: 'school_1', branchId: 'branch_1_1', name: 'أ. بندر بن عبد الله الشمري', specialization: 'الرياضيات المتقدمة', email: 'bandar.math@alnoor.edu.sa', phone: '+966 50 112 3344', hiringDate: '2020-08-15', salary: 14500, status: 'active', assignedClasses: ['الصف الأول الثانوي', 'الصف الثالث الثانوي'] },
  { id: 'teach_2', schoolId: 'school_1', branchId: 'branch_1_1', name: 'د. طه محمد عسكر', specialization: 'الفيزياء والعلوم العامة', email: 'taha.physic@alnoor.edu.sa', phone: '+966 54 445 6677', hiringDate: '2018-09-01', salary: 16000, status: 'active', assignedClasses: ['الصف الأول الثانوي', 'الصف الثالث الثانوي'] },
  { id: 'teach_3', schoolId: 'school_1', branchId: 'branch_1_2', name: 'أ. مها بنت سعد القرني', specialization: 'اللغة العربية والتربية الإسلامية', email: 'maha.arabic@alnoor.edu.sa', phone: '+966 56 889 0011', hiringDate: '2021-10-01', salary: 11200, status: 'active', assignedClasses: ['الصف الأول الابتدائي', 'الصف الثالث المتوسط'] },
  { id: 'teach_4', schoolId: 'school_1', branchId: 'branch_1_1', name: 'أ. فهد بن ناصر السبيعي', specialization: 'اللغة الإنجليزية الآيلتس', email: 'fahad.eng@alnoor.edu.sa', phone: '+966 55 990 1122', hiringDate: '2022-01-10', salary: 12500, status: 'on_leave', assignedClasses: ['الصف الخامس الابتدائي', 'الصف الأول المتوسط'] },
  { id: 'teach_5', schoolId: 'school_1', branchId: 'branch_1_2', name: 'أ. إيمان بنت علي الغامدي', specialization: 'الكيمياء الحيوية', email: 'iman.chem@alnoor.edu.sa', phone: '+966 53 112 2233', hiringDate: '2023-08-20', salary: 13000, status: 'active', assignedClasses: ['الصف الثالث الثانوي'] }
];

export const employeesSeed: Employee[] = [
  { id: 'emp_1', schoolId: 'school_1', name: 'أ. سليمان بن غازي الرويلي', role: 'رئيس وحدة شؤون الموظفين والمسجل العام', phone: '+966 54 332 1100', status: 'active', salary: 9800 },
  { id: 'emp_2', schoolId: 'school_1', name: 'أ. منصور بن خلف الجهني', role: 'كبير المحاسبين والمدير المالي العام', phone: '+966 55 221 4400', status: 'active', salary: 12000 },
  { id: 'emp_3', schoolId: 'school_1', name: 'أ. يحيى بن معجب الشهري', role: 'مشرف النظافة والصيانة الفنية', phone: '+966 50 334 5566', status: 'active', salary: 6500 },
  { id: 'emp_4', schoolId: 'school_1', name: 'أ. فيصل بن ماجد الرشيدي', role: 'مسؤول الأمن والسلامة المدرسية', phone: '+966 53 119 8811', status: 'active', salary: 7000 }
];

export const examTemplates: Exam[] = [
  { id: 'exam_1', title: 'اختبار الرياضيات الفتري الأول', subject: 'الرياضيات', classId: 'الصف الأول الثانوي', date: '2026-10-15', maxScore: 50 },
  { id: 'exam_2', title: 'اختبار الفيزياء النظري النهائي', subject: 'الفيزياء', classId: 'الصف الثالث الثانوي', date: '2026-12-20', maxScore: 100 },
  { id: 'exam_3', title: 'امتحان الإملاء والآداب والتربية', subject: 'اللغة العربية', classId: 'الصف الخامس الابتدائي', date: '2026-10-18', maxScore: 30 }
];

export const initialAttendance: Attendance[] = [
  { id: 'att_1', studentId: 'stud_1', studentName: 'خالد بن وليد الميمان', classroom: 'الصف الأول الثانوي', date: '2026-06-22', status: 'present' },
  { id: 'att_2', studentId: 'stud_2', studentName: 'يوسف بن أحمد الزهراني', classroom: 'الصف الأول الثانوي', date: '2026-06-22', status: 'present' },
  { id: 'att_3', studentId: 'stud_3', studentName: 'جوري بنت فهد الدوسري', classroom: 'الصف الثالث المتوسط', date: '2026-06-22', status: 'absent' },
  { id: 'att_4', studentId: 'stud_4', studentName: 'زياد بن محمد العتيبي', classroom: 'الصف الخامس الابتدائي', date: '2026-06-22', status: 'excused' },
  { id: 'att_5', studentId: 'stud_5', studentName: 'ريناد بنت رائد المطيري', classroom: 'الصف الأول الابتدائي', date: '2026-06-22', status: 'present' }
];

export const invoicesSeed: Invoice[] = [
  { id: 'inv_1001', studentId: 'stud_1', studentName: 'خالد بن وليد الميمان', amount: 5000, dueDate: '2026-11-01', status: 'unpaid', item: 'رسوم الفصل الدراسي الأول المقسطة', taxAmount: 750, invoiceDate: '2026-06-15' },
  { id: 'inv_1002', studentId: 'stud_2', studentName: 'يوسف بن أحمد الزهراني', amount: 20000, dueDate: '2026-09-01', status: 'paid', item: 'رسوم السنة الدراسية كاملة مقدمة', taxAmount: 3000, invoiceDate: '2026-06-10' },
  { id: 'inv_1003', studentId: 'stud_3', studentName: 'جوري بنت فهد الدوسري', amount: 3000, dueDate: '2026-10-15', status: 'partial', item: 'دفعة باص النقل الفصلي + كتب متطورة', taxAmount: 450, invoiceDate: '2026-06-12' },
  { id: 'inv_1004', studentId: 'stud_4', studentName: 'زياد بن محمد العتيبي', amount: 2000, dueDate: '2026-11-15', status: 'unpaid', item: 'رسوم الزي المدرسي والملابس الرياضية والأنشطة', taxAmount: 300, invoiceDate: '2026-06-21' }
];

export const inventorySeed: InventoryItem[] = [
  { 
    id: 'inv_item_1', schoolId: 'school_1', warehouseId: 'branch_1_1', branchId: 'branch_1_1', name: 'أجهزة بروجكتور فائقة الجودة سوني UHD', 
    sku: 'SKU-E-001', categoryId: 'cat_electronics', unitId: 'unit_pc', supplierId: 'sup_sony',
    quantity: 45, minLevel: 5, maxLevel: 100, reorderLevel: 10, costPrice: 3000, salePrice: 4000, vatRate: 15,
    status: 'active', inventoryAccountId: 'acc_inv', costOfGoodsAccountId: 'acc_cogs', adjustmentAccountId: 'acc_adj', costCenterId: 'cc_primary'
  },
  { 
    id: 'inv_item_2', schoolId: 'school_1', warehouseId: 'branch_1_1', branchId: 'branch_1_1', name: 'مقاعد دراسية مريحة مدمجة بخشب طبيعي', 
    sku: 'SKU-F-001', categoryId: 'cat_furniture', unitId: 'unit_pcs', supplierId: 'sup_local',
    quantity: 380, minLevel: 20, maxLevel: 500, reorderLevel: 50, costPrice: 200, salePrice: 350, vatRate: 15,
    status: 'active', inventoryAccountId: 'acc_inv', costOfGoodsAccountId: 'acc_cogs', adjustmentAccountId: 'acc_adj', costCenterId: 'cc_primary'
  },
  { 
    id: 'inv_item_3', schoolId: 'school_1', warehouseId: 'branch_1_2', branchId: 'branch_1_2', name: 'كتب المناهج البريطانية المعتمدة للأطفال', 
    sku: 'SKU-B-001', categoryId: 'cat_books', unitId: 'unit_books', supplierId: 'sup_publish',
    quantity: 1200, minLevel: 100, maxLevel: 2000, reorderLevel: 200, costPrice: 50, salePrice: 80, vatRate: 5,
    status: 'active', inventoryAccountId: 'acc_inv', costOfGoodsAccountId: 'acc_cogs', adjustmentAccountId: 'acc_adj', costCenterId: 'cc_primary'
  },
  { 
    id: 'inv_item_4', schoolId: 'school_1', warehouseId: 'branch_1_1', branchId: 'branch_1_1', name: 'أدوات ومجاهر كيميائية ثلاثية الأبعاد', 
    sku: 'SKU-L-001', categoryId: 'cat_lab', unitId: 'unit_set', supplierId: 'sup_sci',
    quantity: 30, minLevel: 2, maxLevel: 50, reorderLevel: 5, costPrice: 1500, salePrice: 2500, vatRate: 15,
    status: 'active', inventoryAccountId: 'acc_inv', costOfGoodsAccountId: 'acc_cogs', adjustmentAccountId: 'acc_adj', costCenterId: 'cc_high'
  }
];

export const busRoutesSeed: BusRoute[] = [
  { id: 'bus_1', routeNumber: 'باص-901', driverName: 'أبو أحمد السوري', driverPhone: '+966 50 445 2291', capacity: 30, currentStudents: 24, status: 'active', startPoint: 'حي الياسمين', endPoint: 'مقر المدرسة الرئيسي البنين' },
  { id: 'bus_2', routeNumber: 'باص-642', driverName: 'أبو خالد السوداني', driverPhone: '+966 53 112 0044', capacity: 30, currentStudents: 28, status: 'active', startPoint: 'حي الملقا والشباب', endPoint: 'مجمع البنات النرجس' },
  { id: 'bus_3', routeNumber: 'باص-303', driverName: 'أبو محمد المصري', driverPhone: '+966 55 991 3322', capacity: 25, currentStudents: 0, status: 'maintenance', startPoint: 'حي العقيق والغدير', endPoint: 'موقع الورشة وتعديل الصيانة' }
];

export const auditLogsSeed: AuditLog[] = [
  {
    id: 'log_1',
    schoolId: 'school_1',
    timestamp: '2026-07-04T08:12:33Z',
    userId: 'user_001',
    userName: 'سليمان غازي',
    userRole: 'SchoolAdmin',
    action: 'CREATE_STUDENT',
    module: 'شؤون الطلاب',
    ipAddress: '192.168.1.144',
    details: 'إضافة الطالب الجديد ريناد المطيري برقم وطني 1182746352 في الصف الأول الابتدائي.',
    browser: 'Chrome 126.0.0',
    device: 'macOS (Desktop)',
    sessionId: 'sess_994821a8c88f1',
    endpoint: '/api/students',
    httpMethod: 'POST',
    affectedRecord: 'student_9934',
    valuesBefore: null,
    valuesAfter: { id: 'student_9934', name: 'ريناد المطيري', nationalId: '1182746352', classroom: 'الصف الأول الابتدائي', status: 'active' },
    executionTime: 124,
    correlationId: 'corr_83bb94da-df9a-4e6c-bf93',
    result: 'success',
    severity: 'medium'
  },
  {
    id: 'log_2',
    schoolId: 'school_1',
    timestamp: '2026-07-04T09:24:01Z',
    userId: 'user_002',
    userName: 'منصور خلف',
    userRole: 'Accountant',
    action: 'GENERATE_INVOICE',
    module: 'الحسابات العامة',
    ipAddress: '192.168.1.12',
    details: 'أصدر فاتورة رقم inv_1004 للطالب زياد العتيبي بقيمة 2300 ريال سعودي شاملة الضريبة.',
    browser: 'Safari 17.4',
    device: 'iOS (iPad)',
    sessionId: 'sess_844917a1a24d2',
    endpoint: '/api/invoices',
    httpMethod: 'POST',
    affectedRecord: 'inv_1004',
    valuesBefore: null,
    valuesAfter: { id: 'inv_1004', studentId: 'student_002', amount: 2300, status: 'unpaid' },
    executionTime: 185,
    correlationId: 'corr_1a88bb44-4f01-44bb-99d8',
    result: 'success',
    severity: 'low'
  },
  {
    id: 'log_3',
    schoolId: 'school_1',
    timestamp: '2026-07-04T09:40:15Z',
    userId: 'user_003',
    userName: 'بندر الشمري',
    userRole: 'Teacher',
    action: 'SUBMIT_ATTENDANCE',
    module: 'الحضور والانصراف',
    ipAddress: '10.0.4.15',
    details: 'تم حفظ سجل حضور طلاب الصف الأول الثانوي للفصل الدراسي وحفظ الحضور لـ 5 طلاب.',
    browser: 'Firefox 125.0',
    device: 'Windows 11 (Desktop)',
    sessionId: 'sess_102837ff448c9',
    endpoint: '/api/attendance',
    httpMethod: 'POST',
    affectedRecord: 'att_class_01',
    valuesBefore: null,
    valuesAfter: { classId: 'cls_high1_a', date: '2026-07-04', presentCount: 22, absentCount: 3 },
    executionTime: 92,
    correlationId: 'corr_f10a88b1-3d0d-4fa0-82bb',
    result: 'success',
    severity: 'low'
  },
  {
    id: 'log_4',
    schoolId: 'school_1',
    timestamp: '2026-07-04T10:05:12Z',
    userId: 'user_001',
    userName: 'سليمان غازي',
    userRole: 'SchoolAdmin',
    action: 'UPDATE_SYSTEM_RBAC',
    module: 'المستخدمون والصلاحيات',
    ipAddress: '192.168.1.144',
    details: 'تعديل الصلاحية الخاصة بمحاسبي الفروع لتمكنهم من معاينة تقارير الفروع بشكل متزامن مع Supabase.',
    browser: 'Chrome 126.0.0',
    device: 'macOS (Desktop)',
    sessionId: 'sess_994821a8c88f1',
    endpoint: '/api/permissions',
    httpMethod: 'PUT',
    affectedRecord: 'role_accountant_permissions',
    valuesBefore: { role: 'Accountant', permissions: ['std_read', 'acc_read'] },
    valuesAfter: { role: 'Accountant', permissions: ['std_read', 'acc_read', 'acc_write'] },
    executionTime: 310,
    correlationId: 'corr_83889110-d8dd-4bbf-bbf0',
    result: 'success',
    severity: 'critical'
  }
];

export const defaultPermissions: Permission[] = [
  { code: 'std_read', title: 'معاينة شؤون الطلاب', module: 'شؤون الطلاب', description: 'يصرح للمستخدم بتصفح وعرض تفاصيل الطلاب والبحث' },
  { code: 'std_write', title: 'إضافة وتعديل الطلاب', module: 'شؤون الطلاب', description: 'يصرح بتسجيل طالب جديد أو تعديل معلوماته وحظر وعزل وتمديد السنوات' },
  { code: 'acc_read', title: 'الولوج المالي للحسابات', module: 'الحسابات العامة', description: 'دخول القيود اليومية والمستخلصات وكشوف الدخل الضريبي والسنوات الفائتة' },
  { code: 'acc_write', title: 'إصدار الفواتير والدفع', module: 'الحسابات العامة', description: 'إصدار أو تعديل أو عزل الفواتير وسداد المدفوعات والربط البنكي والموازنة' },
  { code: 'sys_settings', title: 'تعديل تهيئة النظام الكلي', module: 'إعدادات النظام', description: 'الوصول المتقدم لبيانات السحابة، تفاصيل الفروع، الصلاحيات الفائقة والربط' }
];

// Supabase Real Schema & Indices SQL generated directly for the user’s SQL Editor inside Supabase dashboard!
export const supabaseSchemaSQL = `-- ==========================================
-- سحابة نظام سحاب ERP لإدارة المدارس السحابي
-- PostgreSQL Schema & Multi-Tenant Isolated DB Design
-- ==========================================

-- تفعيل إضافات قاعدة البيانات الهامة للأمان والـ UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. جدول المدارس (المستأجر الرئيسي - Tenant)
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    logo TEXT,
    type VARCHAR(50) CHECK (type IN ('government', 'private', 'international', 'model')),
    license_number VARCHAR(100) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(100),
    academic_year VARCHAR(50) DEFAULT '2026/2027',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- إنشاء فهارس لتحسين سرعة فلترة وتصنيف المستندات
CREATE INDEX idx_schools_license ON schools(license_number);

-- 2. جدول الفروع التابعة (Branches)
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    manager VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_branches_school_id ON branches(school_id);

-- 3. جدول الطلاب (Students) مع عزل سحابي كامل
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    national_id VARCHAR(50) NOT NULL,
    classroom VARCHAR(100) NOT NULL,
    section VARCHAR(50) NOT NULL,
    parent_name VARCHAR(255) NOT NULL,
    parent_phone VARCHAR(50) NOT NULL,
    registration_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'graduated')),
    fees_paid NUMERIC(12, 2) DEFAULT 0.00,
    fees_remaining NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_students_school_branch ON students(school_id, branch_id);
CREATE INDEX idx_students_national_id ON students(national_id);

-- 4. جدول المعلمين (Teachers)
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(50),
    hiring_date DATE DEFAULT CURRENT_DATE,
    salary NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'inactive')),
    assigned_classes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_teachers_school_branch ON teachers(school_id, branch_id);

-- 5. جدول الفواتير والحسابات (Invoices)
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'unpaid' CHECK (status IN ('paid', 'partial', 'unpaid', 'Cancelled', 'Void')),
    item TEXT NOT NULL,
    invoice_date DATE DEFAULT CURRENT_DATE,
    voided_by VARCHAR(255),
    voided_at TIMESTAMP WITH TIME ZONE,
    void_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_invoices_student_id ON invoices(student_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- 6. جدول الرقابة وسير العمليات (Audit Logs) للامتثال الأمني للـ SaaS
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(100) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_audit_logs_school_timestamp ON audit_logs(school_id, timestamp DESC);

-- تفعيل سياسات الأمان على مستوى الصف (RLS) لعزل المدارس كليًا
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- سياسات شؤون الطلاب وسجل التدقيق: الهوية الوحيدة الموثوقة هي school_id
-- داخل app_metadata في JWT الصادر من Supabase Auth.
DROP POLICY IF EXISTS student_tenant_isolation_policy ON students;
CREATE POLICY student_tenant_isolation_policy ON students
    FOR ALL
    USING (school_id::text = (auth.jwt()->'app_metadata'->>'school_id'))
    WITH CHECK (school_id::text = (auth.jwt()->'app_metadata'->>'school_id'));

DROP POLICY IF EXISTS audit_logs_tenant_isolation_policy ON audit_logs;
CREATE POLICY audit_logs_tenant_isolation_policy ON audit_logs
    FOR ALL
    USING (school_id::text = (auth.jwt()->'app_metadata'->>'school_id'))
    WITH CHECK (school_id::text = (auth.jwt()->'app_metadata'->>'school_id'));

-- 7. جدول إعدادات النظام وتخصيص العملة (System Settings & Currency Config)
CREATE TABLE system_settings (
    key VARCHAR(50) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- بذر إعدادات العملة الافتراضية للبلد المعين تلقائياً عند التشغيل
INSERT INTO system_settings (key, value)
VALUES (
    'currency_config', 
    '{"name": "الريال السعودي", "symbol": "ر.س", "fractionName": "هللة", "decimalPlaces": 2, "symbolPosition": "after", "showSymbolInReports": true}'
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;`;

import { Stage, Grade, AcademicClass, CostCenter } from '../../types';

export const stagesSeed: Stage[] = [
  { id: 'stage_kg', schoolId: 'school_1', code: 'ST-KG', name: 'مرحلة رياض الأطفال والتمهيدي', type: 'kindergarten', costCenterId: 'cc_kg', order: 1, isActive: true },
  { id: 'stage_primary', schoolId: 'school_1', code: 'ST-PRI', name: 'المرحلة الابتدائية', type: 'primary', costCenterId: 'cc_primary', order: 2, isActive: true },
  { id: 'stage_middle', schoolId: 'school_1', code: 'ST-MID', name: 'المرحلة المتوسطة', type: 'middle', costCenterId: 'cc_middle', order: 3, isActive: true },
  { id: 'stage_high', schoolId: 'school_1', code: 'ST-HIGH', name: 'المرحلة الثانوية', type: 'secondary', costCenterId: 'cc_high', order: 4, isActive: true }
];

export const costCentersSeed: CostCenter[] = [
  { id: 'cc_kg', code: 'CC-KG', name: 'مركز تكلفة الروضة والتمهيدي', stageId: 'stage_kg', isActive: true },
  { id: 'cc_primary', code: 'CC-PRIMARY', name: 'مركز تكلفة الابتدائي', stageId: 'stage_primary', isActive: true },
  { id: 'cc_middle', code: 'CC-MIDDLE', name: 'مركز تكلفة المتوسط', stageId: 'stage_middle', isActive: true },
  { id: 'cc_high', code: 'CC-HIGH', name: 'مركز تكلفة الثانوي', stageId: 'stage_high', isActive: true }
];

export const gradesSeed: Grade[] = [
  // Kindergarten
  { id: 'grade_kg1', stageId: 'stage_kg', code: 'KG1', name: 'روضة أولى (KG1)', order: 1, isActive: true },
  { id: 'grade_kg2', stageId: 'stage_kg', code: 'KG2', name: 'تمهيدي ثانٍ (KG2)', order: 2, isActive: true },
  // Primary
  { id: 'grade_pri1', stageId: 'stage_primary', code: 'PRI1', name: 'الصف الأول الابتدائي', order: 1, isActive: true },
  { id: 'grade_pri2', stageId: 'stage_primary', code: 'PRI2', name: 'الصف الثاني الابتدائي', order: 2, isActive: true },
  { id: 'grade_pri3', stageId: 'stage_primary', code: 'PRI3', name: 'الصف الثالث الابتدائي', order: 3, isActive: true },
  { id: 'grade_pri4', stageId: 'stage_primary', code: 'PRI4', name: 'الصف الرابع الابتدائي', order: 4, isActive: true },
  { id: 'grade_pri5', stageId: 'stage_primary', code: 'PRI5', name: 'الصف الخامس الابتدائي', order: 5, isActive: true },
  { id: 'grade_pri6', stageId: 'stage_primary', code: 'PRI6', name: 'الصف السادس الابتدائي', order: 6, isActive: true },
  // Middle
  { id: 'grade_mid1', stageId: 'stage_middle', code: 'MID1', name: 'الصف الأول المتوسط', order: 1, isActive: true },
  { id: 'grade_mid2', stageId: 'stage_middle', code: 'MID2', name: 'الصف الثاني المتوسط', order: 2, isActive: true },
  { id: 'grade_mid3', stageId: 'stage_middle', code: 'MID3', name: 'الصف الثالث المتوسط', order: 3, isActive: true },
  // Secondary
  { id: 'grade_high1', stageId: 'stage_high', code: 'HIGH1', name: 'الصف الأول الثانوي', order: 1, isActive: true },
  { id: 'grade_high2', stageId: 'stage_high', code: 'HIGH2', name: 'الصف الثاني الثانوي', order: 2, isActive: true },
  { id: 'grade_high3', stageId: 'stage_high', code: 'HIGH3', name: 'الصف الثالث الثانوي', order: 3, isActive: true }
];

export const academicClassesSeed: AcademicClass[] = [
  // KG
  { id: 'cls_kg1_a', gradeId: 'grade_kg1', code: 'KG1-A', name: 'بستان أ', capacity: 20, isActive: true },
  { id: 'cls_kg1_b', gradeId: 'grade_kg1', code: 'KG1-B', name: 'بستان ب', capacity: 20, isActive: true },
  { id: 'cls_kg2_a', gradeId: 'grade_kg2', code: 'KG2-A', name: 'تمهيدي أ', capacity: 20, isActive: true },
  // Primary
  { id: 'cls_pri1_a', gradeId: 'grade_pri1', code: 'PRI1-A', name: 'أولى ابتدائي أ', capacity: 25, isActive: true },
  { id: 'cls_pri1_b', gradeId: 'grade_pri1', code: 'PRI1-B', name: 'أولى ابتدائي ب', capacity: 25, isActive: true },
  { id: 'cls_pri2_a', gradeId: 'grade_pri2', code: 'PRI2-A', name: 'ثانية ابتدائي أ', capacity: 25, isActive: true },
  { id: 'cls_pri6_a', gradeId: 'grade_pri6', code: 'PRI6-A', name: 'سادسة ابتدائي أ', capacity: 30, isActive: true },
  // Middle
  { id: 'cls_mid1_a', gradeId: 'grade_mid1', code: 'MID1-A', name: 'أولى متوسط أ', capacity: 30, isActive: true },
  { id: 'cls_mid3_a', gradeId: 'grade_mid3', code: 'MID3-A', name: 'ثالثة متوسط أ', capacity: 30, isActive: true },
  // High
  { id: 'cls_high1_a', gradeId: 'grade_high1', code: 'HIGH1-A', name: 'أولى ثانوي علمي أ', capacity: 35, isActive: true },
  { id: 'cls_high3_a', gradeId: 'grade_high3', code: 'HIGH3-A', name: 'ثالثة ثانوي علمي أ', capacity: 35, isActive: true }
];
