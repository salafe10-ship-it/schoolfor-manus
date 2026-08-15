import { ValidationError, BusinessRuleError } from '../utils/errors';
import { Student } from '../types';
import { FallbackStorage } from '../database/repositories/FallbackStorage';

/**
 * Student Affairs Unified Validation Framework
 * Centralizes all validation logic and business rules to avoid duplication
 * across screens and services. Supports immediate UI input checks and final
 * business-layer verification.
 */
export class StudentAffairsValidationFramework {

  // ==========================================
  // 1. Mandatory Fields & Type Validation
  // ==========================================

  /**
   * Validates that a required field is not empty, null, or undefined.
   */
  public static validateRequired(value: any, fieldLabel: string): void {
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
      throw new ValidationError(`الحقل "${fieldLabel}" إلزامي ومطلوب.`);
    }
  }

  /**
   * Validates that the value matches the expected data type.
   */
  public static validateType(value: any, expectedType: 'string' | 'number' | 'boolean' | 'date', fieldLabel: string): void {
    if (value === null || value === undefined) return;

    if (expectedType === 'string' && typeof value !== 'string') {
      throw new ValidationError(`الحقل "${fieldLabel}" يجب أن يكون نصاً.`);
    }
    if (expectedType === 'number') {
      const parsed = Number(value);
      if (isNaN(parsed) || typeof value === 'boolean') {
        throw new ValidationError(`الحقل "${fieldLabel}" يجب أن يكون قيمة رقمية.`);
      }
    }
    if (expectedType === 'boolean' && typeof value !== 'boolean') {
      throw new ValidationError(`الحقل "${fieldLabel}" يجب أن يكون منطقياً (صح/خطأ).`);
    }
    if (expectedType === 'date') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new ValidationError(`الحقل "${fieldLabel}" يجب أن يكون تاريخاً صالحاً.`);
      }
    }
  }

  // ==========================================
  // 2. Format Validations
  // ==========================================

  /**
   * Validates standard email correctness.
   */
  public static validateEmail(email: string, fieldLabel: string = 'البريد الإلكتروني'): void {
    if (!email) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new ValidationError(`صيغة البريد الإلكتروني في "${fieldLabel}" غير صحيحة. مثال: user@example.com`);
    }
  }

  /**
   * Validates phone number correctness (digits and length).
   */
  public static validatePhone(phone: string, fieldLabel: string = 'رقم الهاتف'): void {
    if (!phone) return;
    // General phone validator: containing digits only, length between 7 and 15
    const cleanPhone = phone.trim().replace(/[\s-+()]/g, '');
    if (!/^\d+$/.test(cleanPhone)) {
      throw new ValidationError(`رقم الهاتف في "${fieldLabel}" يجب أن يحتوي على أرقام فقط.`);
    }
    if (cleanPhone.length < 7 || cleanPhone.length > 15) {
      throw new ValidationError(`رقم الهاتف في "${fieldLabel}" غير صالح (يجب أن يتراوح طوله بين 7 إلى 15 رقماً).`);
    }
  }

  /**
   * Validates Saudi National ID or Resident Iqama ID correctness.
   */
  public static validateNationalId(nid: string, fieldLabel: string = 'الهوية الوطنية / الإقامة'): void {
    if (!nid) return;
    const nidRegex = /^[1-9]\d{9}$/;
    if (!nidRegex.test(nid.trim())) {
      throw new ValidationError(`رقم "${fieldLabel}" غير صالح. يجب أن يتكون من 10 أرقام ويبدأ برقم هوية صالح.`);
    }
  }

  /**
   * Validates Passport format correctness.
   */
  public static validatePassport(passport: string, fieldLabel: string = 'جواز السفر'): void {
    if (!passport) return;
    // Standard passport regex: alphanumeric, length 6 to 15
    const passportRegex = /^[A-Z0-9]{6,15}$/i;
    if (!passportRegex.test(passport.trim())) {
      throw new ValidationError(`رقم "${fieldLabel}" غير صالح. يجب أن يتكون من 6 إلى 15 حرفاً ورقماً (بدون رموز أو مسافات).`);
    }
  }

  // ==========================================
  // 3. Range & Value Limit Validations
  // ==========================================

  /**
   * Validates that Arabic full name contains at least the specified number of name parts (e.g., 4 parts for quad-name).
   */
  public static validateArabicNameParts(name: string, minParts: number = 3, fieldLabel: string = 'اسم الطالب رباعي'): void {
    if (!name) return;
    const nameParts = name.trim().split(/\s+/);
    if (nameParts.length < minParts) {
      throw new ValidationError(`الحقل "${fieldLabel}" يجب أن يتكون من الاسم ثلاثياً على الأقل باللغة العربية (${minParts} أسماء على الأقل لضمان سلامة السجلات).`);
    }
  }

  /**
   * Validates that the number value does not exceed specified min or max limits.
   */
  public static validateLimit(value: number, min: number | null, max: number | null, fieldLabel: string): void {
    if (min !== null && value < min) {
      throw new ValidationError(`القيمة في "${fieldLabel}" لا يمكن أن تقل عن الحد المسموح به وهو ${min}.`);
    }
    if (max !== null && value > max) {
      throw new ValidationError(`القيمة في "${fieldLabel}" لا يمكن أن تتجاوز الحد المسموح به وهو ${max}.`);
    }
  }

  // ==========================================
  // 4. Date Logic & Consistency Validations
  // ==========================================

  /**
   * Validates that registration date is not in the future.
   */
  public static validateRegistrationDate(regDateStr: string, fieldLabel: string = 'تاريخ تسجيل قيد الطالب'): void {
    if (!regDateStr) return;
    const regDate = new Date(regDateStr);
    const today = new Date();
    // Reset hours to allow registration on today
    today.setHours(23, 59, 59, 999);
    if (regDate > today) {
      throw new BusinessRuleError(`تاريخ تسجيل قيد الطالب ("${fieldLabel}") لا يمكن أن يكون في المستقبل!`);
    }
  }

  /**
   * Validates age limits based on birthDate (usually between 3 and 22 years for academic systems).
   */
  public static validateAgeRange(birthDateStr: string, minAge: number = 3, maxAge: number = 22, fieldLabel: string = 'تاريخ ميلاد الطالب'): void {
    if (!birthDateStr) return;
    const birthYear = new Date(birthDateStr).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    if (age < minAge || age > maxAge) {
      throw new BusinessRuleError(`عمر الطالب المستنتج من "${fieldLabel}" هو ${age} سنة. يجب أن يتراوح بين ${minAge} سنوات و ${maxAge} سنة للقبول بالمنظومة.`);
    }
  }

  /**
   * Validates date range constraints (e.g. startDate must be before endDate).
   */
  public static validateDateRange(startDateStr: string, endDateStr: string, startLabel: string, endLabel: string): void {
    if (!startDateStr || !endDateStr) return;
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (start > end) {
      throw new ValidationError(`تاريخ "${startLabel}" لا يمكن أن يكون لاحقاً لتاريخ "${endLabel}".`);
    }
  }

  // ==========================================
  // 5. Data Uniqueness & Duplicate Prevention
  // ==========================================

  /**
   * Ensures a field value is unique across a collection.
   */
  public static validateUniqueness(
    value: any,
    list: any[],
    key: keyof any,
    currentId: string | undefined,
    fieldLabel: string,
    additionalMessage?: string
  ): void {
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return;

    const lowercaseVal = typeof value === 'string' ? value.trim().toLowerCase() : value;
    
    const isDuplicate = list.some(item => {
      // Exclude current record when updating
      if (currentId && item.id === currentId) return false;
      if (item.isDeleted) return false;

      const itemVal = item[key];
      const normalizedItemVal = typeof itemVal === 'string' ? itemVal.trim().toLowerCase() : itemVal;
      return normalizedItemVal === lowercaseVal;
    });

    if (isDuplicate) {
      throw new BusinessRuleError(
        additionalMessage || `القيمة "${value}" المدخلة في حقل "${fieldLabel}" مسجلة مسبقاً وتكرارها يتعارض مع قواعد سلامة البيانات!`
      );
    }
  }

  // ==========================================
  // 6. Relationship Integrity (سلامة العلاقات)
  // ==========================================

  /**
   * Ensures that a referenced foreign key exists in the parent list.
   */
  public static validateRelationshipReference(
    refId: string | undefined,
    parentList: any[],
    parentLabel: string,
    fieldLabel: string
  ): void {
    if (!refId) return;
    const exists = parentList.some(item => item.id === refId);
    if (!exists) {
      throw new ValidationError(`فشل التحقق من سلامة العلاقات: القيمة المحددة لحقل "${fieldLabel}" غير موجودة في سجلات "${parentLabel}" المعتمدة.`);
    }
  }

  /**
   * Enterprise Safety Check: validates whether a student is safe to soft/hard delete.
   * Checks for active obligations, unpaid bills, library checkouts, exams, documents, etc.
   */
  public static validateDeletionSafety(
    student: Student,
    data?: {
      invoices?: any[];
      attendance?: any[];
      exams?: any[];
      results?: any[];
      libraryBooks?: any[];
      transport?: any[];
      uniforms?: any[];
      documents?: any[];
      medicalRecords?: any[];
      assets?: any[];
    }
  ): void {
    if (!student) return;

    // Use passed data or fallback to global FallbackStorage
    const invoices = data?.invoices || FallbackStorage.getInvoices() || [];
    const attendance = data?.attendance || FallbackStorage.getAttendance() || [];
    const exams = data?.exams || [];
    const results = data?.results || [];
    const libraryBooks = data?.libraryBooks || FallbackStorage.getStudentLibraryAccounts() || [];
    const transport = data?.transport || FallbackStorage.getStudentTransportation() || [];
    const uniforms = data?.uniforms || FallbackStorage.getStudentUniformAccounts() || [];
    const documents = data?.documents || FallbackStorage.getStudentDocuments() || [];
    const medicalRecords = data?.medicalRecords || FallbackStorage.getStudentMedicalRecords() || [];
    const assets = data?.assets || FallbackStorage.getStudentAssets() || [];

    // A. Unpaid invoices check
    const studentInvoices = invoices.filter(inv => inv.studentId === student.id);
    const hasUnpaidInvoices = studentInvoices.some(inv => inv.status !== 'paid') || (student.feesRemaining > 0);
    if (hasUnpaidInvoices) {
      throw new BusinessRuleError(
        `لا يمكن حذف الطالب لوجود مستحقات مالية معلقة أو فواتير غير مسواة. يرجى تصفية الحساب المالي للطالب أولاً.`
      );
    }

    // B. Attendance/Absence
    if (attendance.some(a => a.studentId === student.id)) {
      throw new BusinessRuleError(`لا يمكن حذف الطالب لوجود سجلات حضور وغياب مرتبطة به.`);
    }

    // C. Exams and Results
    if (exams.some(e => e.studentId === student.id) || results.some(r => r.studentId === student.id)) {
      throw new BusinessRuleError(`لا يمكن حذف الطالب لوجود سجلات امتحانات أو نتائج أكاديمية مرتبطة به.`);
    }

    // D. Library
    if (libraryBooks.some(lb => lb.studentId === student.id && (lb.status === 'borrowed' || lb.booksBorrowedCount > 0))) {
      throw new BusinessRuleError(`لا يمكن حذف الطالب لوجود كتب مستعارة لم يتم استرجاعها.`);
    }

    // E. Transport
    if (transport.some(t => t.studentId === student.id && t.status === 'active')) {
      throw new BusinessRuleError(`لا يمكن حذف الطالب لوجود اشتراك نشط في النقل المدرسي.`);
    }

    // F. Uniform
    if (uniforms.some(u => u.studentId === student.id && u.paymentStatus !== 'paid')) {
      throw new BusinessRuleError(`لا يمكن حذف الطالب لوجود سجلات استلام وتوزيع الزي المدرسي غير المسواة مرتبطة به.`);
    }

    // G. Documents
    if (documents.some(d => d.studentId === student.id)) {
      throw new BusinessRuleError(`لا يمكن حذف الطالب لوجود وثائق ومستندات في أرشيف الطالب.`);
    }

    // H. Medical
    if (medicalRecords.some(m => m.studentId === student.id)) {
      throw new BusinessRuleError(`لا يمكن حذف الطالب لوجود سجلات طبية مرتبطة به.`);
    }

    // I. Assets/Equipment
    if (assets.some(a => a.studentId === student.id && !a.returnedDate)) {
      throw new BusinessRuleError(`لا يمكن حذف الطالب لوجود عهد مدرسية مستلمة من قبل الطالب ولم يتم إرجاعها.`);
    }
  }

  /**
   * Enterprise Safety Check: validates whether a Guardian (ولي أمر) is safe to delete.
   */
  public static validateGuardianDeletionSafety(guardianId: string): void {
    this.validateRequired(guardianId, 'معرف ولي الأمر');
    const studentGuardians = FallbackStorage.getStudentGuardians() || [];
    const linkedStudents = studentGuardians.filter(sg => sg.guardianId === guardianId);
    
    if (linkedStudents.length > 0) {
      const studentsList = FallbackStorage.getStudents() || [];
      const studentNames = linkedStudents
        .map(sg => studentsList.find(s => s.id === sg.studentId)?.name)
        .filter(Boolean)
        .join(', ');
        
      throw new BusinessRuleError(
        `لا يمكن حذف ولي الأمر لوجود طلاب مرتبطين به في النظام: (${studentNames || 'غير معرف'}). يرجى تصفية أو نقل ارتباط الطلاب أولاً لضمان سلامة قاعدة البيانات.`
      );
    }
  }

  /**
   * Enterprise Safety Check: validates whether an Academic Stage (مرحلة تعليمية) is safe to delete.
   */
  public static validateStageDeletionSafety(
    stageId: string,
    grades?: any[],
    students?: any[]
  ): void {
    this.validateRequired(stageId, 'معرف المرحلة التعليمية');
    
    const studentsList = students || FallbackStorage.getStudents() || [];
    const linkedStudents = studentsList.filter(s => s.stageId === stageId && !s.isDeleted);
    
    const gradesList = grades || [];
    const linkedGrades = gradesList.filter(g => g.stageId === stageId);
    
    if (linkedStudents.length > 0 || linkedGrades.length > 0) {
      const reasons: string[] = [];
      if (linkedGrades.length > 0) reasons.push(`صفوف دراسية مرتبطة بها (${linkedGrades.length})`);
      if (linkedStudents.length > 0) reasons.push(`طلاب نشطين مقيدين بها (${linkedStudents.length})`);
      
      throw new BusinessRuleError(
        `لا يمكن حذف المرحلة التعليمية لوجود سجلات مرتبطة بها: ${reasons.join(' و ')}. يرجى تصفية أو نقل تلك السجلات أولاً.`
      );
    }
  }

  /**
   * Enterprise Safety Check: validates whether an Academic Grade (صف دراسي) is safe to delete.
   */
  public static validateGradeDeletionSafety(
    gradeId: string,
    classes?: any[],
    students?: any[]
  ): void {
    this.validateRequired(gradeId, 'معرف الصف الدراسي');
    
    const studentsList = students || FallbackStorage.getStudents() || [];
    const linkedStudents = studentsList.filter(s => s.gradeId === gradeId && !s.isDeleted);
    
    const classesList = classes || [];
    const linkedClasses = classesList.filter(c => c.gradeId === gradeId);
    
    if (linkedStudents.length > 0 || linkedClasses.length > 0) {
      const reasons: string[] = [];
      if (linkedClasses.length > 0) reasons.push(`شعب وفصول دراسية مرتبطة به (${linkedClasses.length})`);
      if (linkedStudents.length > 0) reasons.push(`طلاب نشطين مقيدين به (${linkedStudents.length})`);
      
      throw new BusinessRuleError(
        `لا يمكن حذف الصف الدراسي لوجود سجلات مرتبطة به: ${reasons.join(' و ')}. يرجى تصفية أو نقل تلك السجلات أولاً.`
      );
    }
  }

  /**
   * Enterprise Safety Check: validates whether an Academic Class/Section (شعبة دراسية) is safe to delete.
   */
  public static validateClassDeletionSafety(
    classId: string,
    students?: any[]
  ): void {
    this.validateRequired(classId, 'معرف الشعبة الدراسية');
    
    const studentsList = students || FallbackStorage.getStudents() || [];
    const linkedStudents = studentsList.filter(s => s.classId === classId && !s.isDeleted);
    
    if (linkedStudents.length > 0) {
      throw new BusinessRuleError(
        `لا يمكن حذف الشعبة الدراسية لوجود عدد (${linkedStudents.length}) من الطلاب النشطين الموزعين عليها حالياً. يرجى نقل الطلاب لشعب أخرى أولاً.`
      );
    }
  }

  /**
   * Enterprise Safety Check: validates whether a Branch (فرع) is safe to delete.
   */
  public static validateBranchDeletionSafety(
    branchId: string,
    students?: any[],
    employees?: any[]
  ): void {
    this.validateRequired(branchId, 'معرف الفرع');
    
    const studentsList = students || FallbackStorage.getStudents() || [];
    const linkedStudents = studentsList.filter(s => s.branchId === branchId && !s.isDeleted);
    
    const employeesList = employees || FallbackStorage.getEmployees() || [];
    const linkedEmployees = employeesList.filter(e => e.branchId === branchId);
    
    if (linkedStudents.length > 0 || linkedEmployees.length > 0) {
      const reasons: string[] = [];
      if (linkedStudents.length > 0) reasons.push(`طلاب مقيدين بالفرع (${linkedStudents.length})`);
      if (linkedEmployees.length > 0) reasons.push(`موظفين وكوادر مرتبطين بالفرع (${linkedEmployees.length})`);
      
      throw new BusinessRuleError(
        `لا يمكن حذف هذا الفرع لوجود سجلات نشطة مرتبطة به في النظام: ${reasons.join(' و ')}. يرجى نقلهم لفرع آخر أولاً.`
      );
    }
  }

  /**
   * Validates if a role has permission for a specific action (save, edit, delete, print, export).
   * If not, throws a clear BusinessRuleError.
   */
  public static validateActionPermission(
    role: string, 
    action: 'save' | 'edit' | 'delete' | 'print' | 'export',
    context: 'student' | 'financial' | 'general' | 'exam' = 'student'
  ): void {
    const r = (role || '').toLowerCase();
    
    // Normalization of roles to lowercase
    let mappedRole = r;
    if (r === 'superadmin') mappedRole = 'superadmin';
    else if (r === 'schooladmin' || r === 'admin') mappedRole = 'schooladmin';
    else if (r === 'teacher') mappedRole = 'teacher';
    else if (r === 'accountant') mappedRole = 'accountant';
    else if (r === 'parent') mappedRole = 'parent';
    else if (r === 'student') mappedRole = 'student';
    else if (r === 'employee') mappedRole = 'employee';

    // 1. Delete: only SuperAdmin and SchoolAdmin/Admin across all contexts
    if (action === 'delete') {
      if (!['superadmin', 'schooladmin'].includes(mappedRole)) {
        throw new BusinessRuleError(
          `غير مصرح أمنياً. دورك الحالي (${role}) لا يملك الصلاحية اللازمة لحذف السجلات والقيود (تتطلب مدير نظام).`
        );
      }
    }

    // 2. Save / Edit (Hafz / Ta'deel): 
    if (action === 'save' || action === 'edit') {
      if (context === 'financial' || context === 'general') {
        // Financial or General Ledger context: SuperAdmin, SchoolAdmin, Accountant
        if (!['superadmin', 'schooladmin', 'accountant'].includes(mappedRole)) {
          throw new BusinessRuleError(
            `غير مصرح أمنياً. دورك الحالي (${role}) لا يملك صلاحيات العمليات المالية وإدخال القيود وسندات القبض.`
          );
        }
      } else if (context === 'exam') {
        // Exam context: SuperAdmin, SchoolAdmin, Teacher
        if (!['superadmin', 'schooladmin', 'teacher'].includes(mappedRole)) {
          throw new BusinessRuleError(
            `غير مصرح أمنياً. دورك الحالي (${role}) لا يملك صلاحية تعديل رصد الدرجات أو ضبط الكنترول.`
          );
        }
      } else {
        // Student affairs context (default): SuperAdmin, SchoolAdmin, Teacher
        if (!['superadmin', 'schooladmin', 'teacher'].includes(mappedRole)) {
          throw new BusinessRuleError(
            `غير مصرح أمنياً. دورك الحالي (${role}) لا يملك الصلاحية الكافية لإضافة البيانات أو تعديلها.`
          );
        }
      }
    }

    // 3. Print (Tiba'ah): SuperAdmin, SchoolAdmin/Admin, Teacher, Accountant, Employee
    if (action === 'print') {
      if (!['superadmin', 'schooladmin', 'teacher', 'accountant', 'employee'].includes(mappedRole)) {
        throw new BusinessRuleError(
          `غير مصرح أمنياً. دورك الحالي (${role}) لا يملك الصلاحية لطباعة التقارير الرسمية والشهادات.`
        );
      }
    }

    // 4. Export (Tasdeer): SuperAdmin, SchoolAdmin/Admin, Teacher, Accountant, Employee
    if (action === 'export') {
      if (!['superadmin', 'schooladmin', 'teacher', 'accountant', 'employee'].includes(mappedRole)) {
        throw new BusinessRuleError(
          `غير مصرح أمنياً. دورك الحالي (${role}) لا يملك الصلاحية لتصدير البيانات والملفات للمتصفح.`
        );
      }
    }
  }

  // ==========================================
  // 7. Core Business Rules (قواعد الأعمال)
  // ==========================================

  /**
   * Ensures that operation aligns with school business restrictions (e.g. frozen/suspended students can't do certain things)
   */
  public static validateStudentStateForOperation(
    student: Student,
    operation: 'transfer' | 'promote' | 'graduate' | 'dismiss' | 're_enroll',
    context?: any
  ): void {
    if (!student) return;

    // Archived / Frozen accounts cannot be transferred or promoted
    if (student.status === 'frozen' || student.status === 'withdrawn') {
      if (operation === 'transfer' || operation === 'promote' || operation === 'graduate') {
        throw new BusinessRuleError(
          `لا يمكن إجراء عملية (${
            operation === 'transfer' ? 'نقل' : operation === 'promote' ? 'ترقية' : 'تخرج'
          }) على الطالب لأن سجله المركزي في حالة تجميد/أرشفة حالياً.`
        );
      }
    }

    // Suspended (تعليق تأديبي) students cannot graduate or be promoted
    if (student.status === 'suspended') {
      if (operation === 'promote' || operation === 'graduate') {
        throw new BusinessRuleError(
          `لا يمكن ترقية أو تخرج الطالب نظراً لوجود قرار تعليق تأديبي نشط في سجله السلوكي. يرجى مراجعة مجلس التأديب أولاً وفك التعليق.`
        );
      }
    }

    // Re-enrollment requires the student to be frozen or withdrawn
    if (operation === 're_enroll' && student.status === 'active') {
      throw new BusinessRuleError(`الطالب نشط بالفعل في المنظومة الأكاديمية ولا يتطلب إجراء إعادة قيد.`);
    }

    // Graduation requires being active and having zero remaining fees
    if (operation === 'graduate') {
      if (student.feesRemaining > 0) {
        throw new BusinessRuleError(
          `لا يمكن اعتماد تخرج الطالب من المدرسة لوجود رسوم مستحقة غير مدفوعة بقيمة (${student.feesRemaining} ريال). يرجى السداد والاعتماد المالي المسبق.`
        );
      }
    }
  }

  // ==========================================
  // 8. Composite Schema Validations
  // ==========================================

  /**
   * Composite validation for saving/updating a student record.
   */
  public static validateStudentSave(
    formStudent: any,
    studentsList: Student[],
    isNewRecord: boolean,
    selectedStudentId?: string,
    stagesList: any[] = [],
    gradesList: any[] = []
  ): void {
    // 1. Mandatory Core Fields Presence
    this.validateRequired(formStudent.fullNameAr, 'اسم الطالب رباعي (عربي)');
    this.validateRequired(formStudent.nationalId, 'رقم الهوية الوطنية / الإقامة');
    this.validateRequired(formStudent.academicId, 'الرقم الأكاديمي');
    this.validateRequired(formStudent.studentCode, 'رمز الطالب');
    this.validateRequired(formStudent.stageId, 'المرحلة التعليمية');
    this.validateRequired(formStudent.gradeName, 'الصف الدراسي');
    this.validateRequired(formStudent.fatherName, 'اسم ولي الأمر');
    this.validateRequired(formStudent.fatherPhone, 'هاتف ولي الأمر');
    this.validateRequired(formStudent.fatherNationalId, 'هوية ولي الأمر');

    // 2. Data Type checks
    this.validateType(formStudent.fullNameAr, 'string', 'اسم الطالب رباعي (عربي)');
    this.validateType(formStudent.nationalId, 'string', 'رقم الهوية الوطنية / الإقامة');
    this.validateType(formStudent.fatherPhone, 'string', 'هاتف ولي الأمر');
    if (formStudent.birthDate) {
      this.validateType(formStudent.birthDate, 'date', 'تاريخ ميلاد الطالب');
    }
    if (formStudent.registrationDate) {
      this.validateType(formStudent.registrationDate, 'date', 'تاريخ تسجيل قيد الطالب');
    }

    // 3. Format constraints
    this.validateArabicNameParts(formStudent.fullNameAr, 3, 'اسم الطالب رباعي (عربي)');
    this.validateNationalId(formStudent.nationalId, 'الهوية الوطنية / الإقامة');
    this.validatePhone(formStudent.fatherPhone, 'هاتف ولي الأمر');
    this.validateNationalId(formStudent.fatherNationalId, 'هوية ولي الأمر');
    
    if (formStudent.motherPhone) {
      this.validatePhone(formStudent.motherPhone, 'هاتف الأم');
    }

    // Passport validation if provided
    if (formStudent.passportNumber) {
      this.validatePassport(formStudent.passportNumber, 'جواز السفر');
    }

    // 4. Age and Registration date alignment
    if (formStudent.birthDate) {
      this.validateAgeRange(formStudent.birthDate, 3, 22, 'تاريخ ميلاد الطالب');
    }
    if (formStudent.registrationDate) {
      this.validateRegistrationDate(formStudent.registrationDate, 'تاريخ تسجيل قيد الطالب');
    }

    // 5. Uniqueness checks
    this.validateUniqueness(
      formStudent.nationalId,
      studentsList,
      'nationalId',
      selectedStudentId,
      'الهوية الوطنية / الإقامة',
      'رقم الهوية الوطنية / الإقامة مسجل مسبقاً لطالب آخر نشط في المنظومة!'
    );
    this.validateUniqueness(
      formStudent.academicId,
      studentsList,
      'academicId',
      selectedStudentId,
      'الرقم الأكاديمي',
      'الرقم الأكاديمي مسجل مسبقاً لطالب آخر!'
    );
    this.validateUniqueness(
      formStudent.studentCode,
      studentsList,
      'studentCode',
      selectedStudentId,
      'رمز الطالب',
      'رمز الطالب (الكود) مسجل مسبقاً لطالب آخر!'
    );

    // 6. Relationship integrity checks
    if (stagesList.length > 0) {
      this.validateRelationshipReference(formStudent.stageId, stagesList, 'المراحل التعليمية', 'المرحلة التعليمية');
    }
    if (gradesList.length > 0 && formStudent.gradeName) {
      // Look up if gradeName exists in grades list
      const gradeExists = gradesList.some(g => g.name === formStudent.gradeName);
      if (!gradeExists) {
        throw new ValidationError(`فشل التحقق من سلامة العلاقات: الصف الدراسي المختار "${formStudent.gradeName}" غير معرف بالهيكل الأكاديمي.`);
      }
    }
  }
}
