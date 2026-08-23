import { ValidationError } from '../utils/errors';

export class StudentValidator {
  public static validate(student: any): void {
    if (!student) {
      throw new ValidationError("بيانات الطالب مطلوبة.");
    }
    const errors: Record<string, string> = {};

    if (!student.name || typeof student.name !== 'string' || student.name.trim().length < 3) {
      errors.name = "اسم الطالب مطلوب ويجب أن لا يقل عن 3 أحرف.";
    }

    if (!student.nationalId || typeof student.nationalId !== 'string') {
      errors.nationalId = "رقم الهوية الوطنية مطلوب.";
    } else if (!/^\d{10}$/.test(student.nationalId.trim())) {
      errors.nationalId = "رقم الهوية الوطنية يجب أن يتكون من 10 أرقام.";
    }

    if (student.feesPaid !== undefined && (typeof student.feesPaid !== 'number' || student.feesPaid < 0)) {
      errors.feesPaid = "الرسوم المدفوعة يجب أن تكون قيمة عددية موجبة.";
    }

    if (student.feesRemaining !== undefined && (typeof student.feesRemaining !== 'number' || student.feesRemaining < 0)) {
      errors.feesRemaining = "الرسوم المتبقية يجب أن تكون قيمة عددية موجبة.";
    }

    if (!student.classroom || typeof student.classroom !== 'string' || student.classroom.trim() === '') {
      errors.classroom = "الصف الدراسي مطلوب.";
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError("فشل التحقق من بيانات الطالب.", errors);
    }
  }
}

export class ExamValidator {
  public static validate(exam: any): void {
    if (!exam) {
      throw new ValidationError("بيانات الاختبار مطلوبة.");
    }
    const errors: Record<string, string> = {};

    if (!exam.title || typeof exam.title !== 'string' || exam.title.trim().length < 2) {
      errors.title = "عنوان الاختبار مطلوب ويجب أن لا يقل عن حرفين.";
    }

    if (!exam.subject || typeof exam.subject !== 'string' || exam.subject.trim() === '') {
      errors.subject = "المادة الدراسية مطلوبة.";
    }

    if (exam.maxScore !== undefined && (typeof exam.maxScore !== 'number' || exam.maxScore <= 0)) {
      errors.maxScore = "الدرجة العظمى للاختبار يجب أن تكون أكبر من صفر.";
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError("فشل التحقق من بيانات الاختبار.", errors);
    }
  }

  public static validateDatabase(examsData: any): void {
    if (!examsData) {
      throw new ValidationError("بيانات قاعدة الاختبارات مطلوبة.");
    }
    // If examsData contains an array of exams, validate each one
    if (Array.isArray(examsData)) {
      examsData.forEach((exam, index) => {
        try {
          this.validate(exam);
        } catch (err: any) {
          throw new ValidationError(`خطأ في الاختبار رقم ${index + 1}: ${err.message}`, err.details);
        }
      });
    }
  }
}

export class EmployeeValidator {
  public static validate(employee: any): void {
    if (!employee) {
      throw new ValidationError("بيانات الموظف مطلوبة.");
    }
    const errors: Record<string, string> = {};

    if (!employee.name || typeof employee.name !== 'string' || employee.name.trim().length < 3) {
      errors.name = "اسم الموظف مطلوب ويجب أن لا يقل عن 3 أحرف.";
    }

    if (!employee.role || typeof employee.role !== 'string' || employee.role.trim() === '') {
      errors.role = "الدور الوظيفي مطلوب.";
    }

    if (employee.salary !== undefined && (typeof employee.salary !== 'number' || !Number.isFinite(employee.salary) || employee.salary < 0)) {
      errors.salary = "الراتب يجب أن يكون قيمة موجبة.";
    }

    if (employee.phone && typeof employee.phone === 'string' && !/^\+?\d{7,15}$/.test(employee.phone.trim())) {
      errors.phone = "رقم الهاتف غير صالح.";
    }

    if (employee.status && !['active', 'inactive', 'on_leave'].includes(employee.status)) {
      errors.status = "حالة الموظف يجب أن تكون active أو inactive أو on_leave.";
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError("فشل التحقق من بيانات الموظف.", errors);
    }
  }
}

export class InvoiceValidator {
  public static validate(invoice: any): void {
    if (!invoice) {
      throw new ValidationError("بيانات الفاتورة مطلوبة.");
    }
    const errors: Record<string, string> = {};

    if (!invoice.studentId || typeof invoice.studentId !== 'string' || invoice.studentId.trim() === '') {
      errors.studentId = "معرف الطالب مطلوب.";
    }

    if (!invoice.studentName || typeof invoice.studentName !== 'string' || invoice.studentName.trim() === '') {
      errors.studentName = "اسم الطالب مطلوب.";
    }

    if (invoice.amount === undefined || typeof invoice.amount !== 'number' || invoice.amount < 0) {
      errors.amount = "مبلغ الفاتورة مطلوب ويجب أن يكون قيمة موجبة.";
    }

    if (!invoice.dueDate || typeof invoice.dueDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(invoice.dueDate.trim())) {
      errors.dueDate = "تاريخ الاستحقاق مطلوب ويجب أن يكون بالتنسيق YYYY-MM-DD.";
    }

    if (invoice.status && !['paid', 'partial', 'unpaid', 'overdue', 'written_off'].includes(invoice.status)) {
      errors.status = "حالة الفاتورة غير صالحة.";
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError("فشل التحقق من بيانات الفاتورة.", errors);
    }
  }
}

export class InventoryValidator {
  public static validate(item: any): void {
    if (!item) {
      throw new ValidationError("بيانات مادة المخزون مطلوبة.");
    }
    const errors: Record<string, string> = {};

    if (!item.name || typeof item.name !== 'string' || item.name.trim().length < 2) {
      errors.name = "اسم المادة مطلوب ويجب أن لا يقل عن حرفين.";
    }

    const cat = item.category || item.categoryId;
    if (!cat || typeof cat !== 'string' || cat.trim() === '') {
      errors.category = "تصنيف المادة غير صالح أو غير موجود.";
    }

    if (item.quantity === undefined || typeof item.quantity !== 'number' || !Number.isFinite(item.quantity) || item.quantity < 0) {
      errors.quantity = "الكمية الكلية مطلوبة ويجب أن تكون صفراً أو أكثر.";
    }

    if (item.available !== undefined && (typeof item.available !== 'number' || !Number.isFinite(item.available) || item.available < 0 || item.available > (item.quantity || 0))) {
      errors.available = "الكمية المتاحة يجب أن تكون قيمة موجبة ولا تتجاوز الكمية الكلية.";
    }

    for (const field of ['minLevel', 'maxLevel', 'reorderLevel', 'costPrice', 'salePrice'] as const) {
      if (item[field] !== undefined && (typeof item[field] !== 'number' || !Number.isFinite(item[field]) || item[field] < 0)) {
        errors[field] = "القيمة الرقمية يجب أن تكون رقمًا منتهيًا غير سالب.";
      }
    }
    if (item.vatRate !== undefined && (typeof item.vatRate !== 'number' || !Number.isFinite(item.vatRate) || item.vatRate < 0 || item.vatRate > 100)) {
      errors.vatRate = "نسبة الضريبة يجب أن تكون بين 0 و100.";
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError("فشل التحقق من بيانات مادة المخزون.", errors);
    }
  }
}

export class UniformValidator {
  public static validate(item: any): void {
    if (!item) {
      throw new ValidationError("بيانات الزي المدرسي مطلوبة.");
    }
    const errors: Record<string, string> = {};

    if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
      errors.name = "اسم قطعة الزي مطلوب.";
    }

    if (!item.size || typeof item.size !== 'string' || item.size.trim() === '') {
      errors.size = "مقاس الزي مطلوب.";
    }

    if (item.price === undefined || typeof item.price !== 'number' || item.price < 0) {
      errors.price = "السعر مطلوب ويجب أن يكون قيمة موجبة.";
    }

    if (item.quantity === undefined || typeof item.quantity !== 'number' || item.quantity < 0) {
      errors.quantity = "الكمية مطلوبة ويجب أن تكون صفراً أو أكثر.";
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError("فشل التحقق من بيانات الزي المدرسي.", errors);
    }
  }
}

export class AttendanceValidator {
  public static validate(record: any): void {
    if (!record) {
      throw new ValidationError("بيانات التحضير مطلوبة.");
    }
    const errors: Record<string, string> = {};

    if (!record.studentId || typeof record.studentId !== 'string' || record.studentId.trim() === '') {
      errors.studentId = "معرف الطالب مطلوب.";
    }

    if (!record.studentName || typeof record.studentName !== 'string' || record.studentName.trim() === '') {
      errors.studentName = "اسم الطالب مطلوب لتأكيد التحضير.";
    }

    if (!record.date || typeof record.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(record.date.trim())) {
      errors.date = "التاريخ مطلوب ويجب أن يكون بالتنسيق YYYY-MM-DD.";
    }

    if (!record.status || !['present', 'absent', 'excused'].includes(record.status)) {
      errors.status = "حالة التحضير يجب أن تكون 'present' أو 'absent' أو 'excused'.";
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError("فشل التحقق من بيانات التحضير والغياب.", errors);
    }
  }

  public static validateBulk(records: any[]): void {
    if (!Array.isArray(records)) {
      throw new ValidationError("البيانات المرسلة يجب أن تكون مصفوفة تحضير.");
    }
    records.forEach((record, index) => {
      try {
        this.validate(record);
      } catch (err: any) {
        throw new ValidationError(`خطأ في سجل التحضير رقم ${index + 1}: ${err.message}`, err.details);
      }
    });
  }
}

export class TransportationValidator {
  public static validate(route: any): void {
    if (!route) {
      throw new ValidationError("بيانات مسار الحافلة مطلوبة.");
    }
    const errors: Record<string, string> = {};

    if (!route.routeNumber || typeof route.routeNumber !== 'string' || route.routeNumber.trim() === '') {
      errors.routeNumber = "رقم مسار الحافلة مطلوب.";
    }

    if (!route.driverName || typeof route.driverName !== 'string' || route.driverName.trim() === '') {
      errors.driverName = "اسم السائق مطلوب.";
    }

    if (route.driverPhone && typeof route.driverPhone === 'string' && !/^\+?\d{7,15}$/.test(route.driverPhone.trim())) {
      errors.driverPhone = "رقم هاتف السائق غير صالح.";
    }

    if (route.capacity === undefined || typeof route.capacity !== 'number' || route.capacity <= 0) {
      errors.capacity = "سعة الحافلة مطلوبة ويجب أن تكون أكبر من صفر.";
    }

    if (route.currentStudents !== undefined && (typeof route.currentStudents !== 'number' || route.currentStudents < 0 || route.currentStudents > (route.capacity || 0))) {
      errors.currentStudents = "عدد الطلاب الحاليين غير صالح أو يتجاوز سعة الحافلة.";
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError("فشل التحقق من بيانات مسار الحافلة النقلية.", errors);
    }
  }
}
