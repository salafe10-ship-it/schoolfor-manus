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
    if (!examsData || typeof examsData !== 'object' || Array.isArray(examsData)) {
      throw new ValidationError("بيانات قاعدة الاختبارات مطلوبة.");
    }

    const requireArray = (field: string): any[] => {
      const value = examsData[field];
      if (!Array.isArray(value)) {
        throw new ValidationError(`حقل ${field} يجب أن يكون قائمة صالحة.`);
      }
      return value;
    };
    const requireRecord = (field: string): Record<string, any> => {
      const value = examsData[field];
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new ValidationError(`حقل ${field} يجب أن يكون كائناً صالحاً.`);
      }
      return value;
    };
    const requireUniqueIds = (items: any[], label: string): Set<string> => {
      const ids = new Set<string>();
      items.forEach((item, index) => {
        const id = String(item?.id || '').trim();
        if (!id) throw new ValidationError(`${label}: المعرف مفقود في السجل رقم ${index + 1}.`);
        if (ids.has(id)) throw new ValidationError(`${label}: المعرف ${id} مكرر.`);
        ids.add(id);
      });
      return ids;
    };

    const subjects = requireArray('exams_subjects');
    const halls = requireArray('exams_halls');
    const students = requireArray('exams_students_enriched');
    const schedule = requireArray('exams_schedule');
    requireArray('exams_proctors');
    const classes = requireArray('exams_classes_list');
    const gradesMatrix = requireRecord('exams_grades_matrix');
    requireRecord('exams_settings');

    const subjectIds = requireUniqueIds(subjects, 'المواد');
    const hallIds = requireUniqueIds(halls, 'القاعات');
    const studentIds = requireUniqueIds(students, 'الطلاب');
    const classNames = new Set<string>();
    const subjectNames = new Set<string>();
    const normalizeAcademicYear = (value: unknown) => String(value || '').replace(/\D/g, '');
    const targetAcademicYear = normalizeAcademicYear(examsData.exams_settings?.academicYear);

    subjects.forEach((subject, index) => {
      const name = String(subject?.name || '').trim();
      const maxScore = Number(subject?.maxScore);
      const passScore = Number(subject?.passScore);
      if (!name) throw new ValidationError(`المادة رقم ${index + 1} بلا اسم.`);
      const normalizedName = name.replace(/\s+/g, ' ').toLocaleLowerCase('ar');
      if (subjectNames.has(normalizedName)) throw new ValidationError(`اسم المادة ${name} مكرر في دورة الامتحانات.`);
      subjectNames.add(normalizedName);
      if (!Number.isFinite(maxScore) || maxScore <= 0) {
        throw new ValidationError(`الدرجة العظمى للمادة ${name} يجب أن تكون أكبر من صفر.`);
      }
      if (!Number.isFinite(passScore) || passScore < 0 || passScore > maxScore) {
        throw new ValidationError(`درجة النجاح للمادة ${name} خارج النطاق المسموح.`);
      }
    });

    halls.forEach((hall, index) => {
      const name = String(hall?.name || '').trim();
      const capacity = Number(hall?.capacity);
      if (!name) throw new ValidationError(`القاعة رقم ${index + 1} بلا اسم.`);
      if (!Number.isSafeInteger(capacity) || capacity <= 0) {
        throw new ValidationError(`سعة القاعة ${name} يجب أن تكون عدداً صحيحاً أكبر من صفر.`);
      }
    });

    classes.forEach((classItem, index) => {
      const name = String(classItem?.name || '').trim();
      if (!name) throw new ValidationError(`الصف رقم ${index + 1} بلا اسم.`);
      if (classNames.has(name)) throw new ValidationError(`اسم الصف ${name} مكرر.`);
      classNames.add(name);
      if (classItem?.capacity !== undefined) {
        const capacity = Number(classItem.capacity);
        if (!Number.isSafeInteger(capacity) || capacity <= 0) {
          throw new ValidationError(`سعة الصف ${name} يجب أن تكون عدداً صحيحاً أكبر من صفر.`);
        }
      }
    });

    const occupiedSeats = new Set<string>();
    const studentsByHall = new Map<string, number>();
    students.forEach((student, index) => {
      const name = String(student?.name || '').trim();
      const classroom = String(student?.classroom || '').trim();
      if (!name || !classroom) throw new ValidationError(`بيانات الطالب رقم ${index + 1} لا تحتوي الاسم والصف.`);
      if (classNames.size > 0 && !classNames.has(classroom)) {
        throw new ValidationError(`الطالب ${name} مرتبط بصف غير معرف في دورة الامتحانات.`);
      }
      const studentAcademicYear = normalizeAcademicYear(student?.academicYear);
      if (!targetAcademicYear || !studentAcademicYear || studentAcademicYear !== targetAcademicYear) {
        throw new ValidationError(`الطالب ${name} غير مرتبط بالسنة الأكاديمية الحالية للدورة.`);
      }
      if (!['active', 'accepted'].includes(String(student?.status || '').toLowerCase())) {
        throw new ValidationError(`حالة الطالب ${name} لا تسمح بترشيحه للامتحان.`);
      }
      const absentSubjects = student?.absentSubjects ?? [];
      if (!Array.isArray(absentSubjects) || absentSubjects.some((subjectId: unknown) => !subjectIds.has(String(subjectId)))) {
        throw new ValidationError(`قائمة غياب الطالب ${name} تحتوي مادة غير صالحة.`);
      }
      const hallId = String(student?.hallId || '').trim();
      const seatNumber = String(student?.seatNumber || '').trim();
      if ((hallId && !seatNumber) || (!hallId && seatNumber)) {
        throw new ValidationError(`توزيع الطالب ${name} يجب أن يحتوي القاعة ورقم الجلوس معاً.`);
      }
      if (hallId) {
        if (!hallIds.has(hallId)) throw new ValidationError(`الطالب ${name} مرتبط بقاعة غير صالحة.`);
        const seatKey = `${hallId}|${seatNumber}`;
        if (occupiedSeats.has(seatKey)) throw new ValidationError(`رقم الجلوس ${seatNumber} مكرر داخل القاعة.`);
        occupiedSeats.add(seatKey);
        studentsByHall.set(hallId, (studentsByHall.get(hallId) || 0) + 1);
      }
    });

    halls.forEach(hall => {
      const assignedCount = studentsByHall.get(String(hall.id)) || 0;
      if (assignedCount > Number(hall.capacity)) {
        throw new ValidationError(`عدد الطلاب الموزعين يتجاوز سعة القاعة ${String(hall.name || hall.id)}.`);
      }
    });

    Object.entries(gradesMatrix).forEach(([studentId, row]) => {
      if (!studentIds.has(studentId)) throw new ValidationError(`مصفوفة الدرجات تحتوي طالباً غير صالح: ${studentId}.`);
      if (!row || typeof row !== 'object' || Array.isArray(row)) {
        throw new ValidationError(`درجات الطالب ${studentId} ليست كائناً صالحاً.`);
      }
      Object.entries(row as Record<string, unknown>).forEach(([subjectId, rawGrade]) => {
        if (!subjectIds.has(subjectId)) throw new ValidationError(`مصفوفة الدرجات تحتوي مادة غير صالحة: ${subjectId}.`);
        const subject = subjects.find(item => String(item.id) === subjectId);
        if (typeof rawGrade !== 'number' || !Number.isFinite(rawGrade) || rawGrade < 0 || rawGrade > Number(subject.maxScore)) {
          throw new ValidationError(`درجة الطالب ${studentId} في المادة ${String(subject.name || subjectId)} خارج النطاق المسموح.`);
        }
      });
    });

    requireUniqueIds(schedule, 'الجدول');
    schedule.forEach((item, index) => {
      const subjectId = String(item?.subjectId || '').trim();
      const hallId = String(item?.hallId || '').trim();
      const classroom = String(item?.classroom || '').trim();
      const date = String(item?.date || '').trim();
      const startTime = String(item?.startTime || '').trim();
      const endTime = String(item?.endTime || '').trim();
      if (!subjectIds.has(subjectId) || !hallIds.has(hallId) || (classNames.size > 0 && !classNames.has(classroom))) {
        throw new ValidationError(`سجل الجدول رقم ${index + 1} يحتوي مرجعاً غير صالح.`);
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime) || startTime >= endTime) {
        throw new ValidationError(`سجل الجدول رقم ${index + 1} يحتوي تاريخاً أو وقتاً غير صالح.`);
      }
    });
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
