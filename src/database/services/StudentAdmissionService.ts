import { StudentRepository } from '../repositories/StudentRepository';
import { UnitOfWork } from '../UnitOfWork';
import { AuditRepository } from '../repositories/AuditRepository';
import { StudentNumberingService } from './StudentNumberingService';
import { StudentMedicalService } from './StudentMedicalService';
import { StudentLibraryService } from './StudentLibraryService';
import { StudentFeeService } from './StudentFeeService';
import { StudentGuardianService } from './StudentGuardianService';
import { Student, AuditMetadata } from '../../types';
import { ValidationError } from '../../utils/errors';

export class StudentAdmissionService {
  /**
   * 1. Create Student Lifecycle Workflow (Composite Transaction)
   */
  public static async createStudent(
    schoolId: string,
    studentData: Partial<Student> & { parentName?: string; parentPhone?: string; guardianRelation?: string },
    meta: AuditMetadata
  ): Promise<any> {
    const studentId = studentData.id || `stud_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const name = studentData.name?.trim();
    if (!name) {
      throw new ValidationError("اسم الطالب مطلوب ولا يمكن إنشاء سجل بدونه.");
    }
    if (studentData.gender !== 'male' && studentData.gender !== 'female') {
      throw new ValidationError("جنس الطالب مطلوب ويجب أن يكون محددًا بصورة صحيحة.");
    }
    if (studentData.parentName?.trim() || studentData.parentPhone?.trim()) {
      throw new ValidationError(
        'بيانات ولي الأمر يجب تسجيلها عبر خدمة تسجيل الطالب المركزية قبل إنشاء أي بيانات تابعة.'
      );
    }
    const configuredRegistrationFee = Number(
      (studentData as any).registrationFeeAmount ?? (studentData as any).registrationFee ?? 0
    );

    return UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: `إنشاء طالب جديد ودورته الحياتية بالكامل: ${name}`,
      userId: meta.userId,
      userName: meta.userName,
      ipAddress: meta.ipAddress,
      affectedTables: [
        'students', 'student_medical_records', 'student_library_accounts',
        'student_uniform_accounts', 'student_transportation', 'student_guardians',
        'guardians', 'invoices', 'audit_logs'
      ]
    }, async () => {
      // 1.1 Core Student Record
      const studentCode = await StudentNumberingService.generateStudentIdentifier(schoolId, 'studentCode');
      const academicId = await StudentNumberingService.generateStudentIdentifier(schoolId, 'academicId');
      
      const newStudent: Student = {
        id: studentId,
        schoolId,
        studentCode,
        academicId,
        branchId: studentData.branchId || "branch_1",
        name: studentData.name || "",
        nationalId: studentData.nationalId || "",
        classroom: studentData.classroom || "",
        section: studentData.section || "",
        parentName: studentData.parentName || "",
        parentPhone: studentData.parentPhone || "",
        registrationDate: studentData.registrationDate || new Date().toISOString().split('T')[0],
        status: 'active',
        feesPaid: 0,
        feesRemaining: Number.isFinite(configuredRegistrationFee) && configuredRegistrationFee > 0
          ? configuredRegistrationFee
          : 0,
        stageId: studentData.stageId || "",
        gradeId: studentData.gradeId || "",
        classId: studentData.classId || "",
        gender: studentData.gender,
        nationality: studentData.nationality || "",
        religion: studentData.religion || "",
        birthDate: studentData.birthDate || "",
        address: studentData.address || "",
        academicYear: studentData.academicYear || "",
        behaviorPoints: 100,
        behaviorNotes: "",
        version: 1,
        isDeleted: false
      };

      StudentRepository.enlistCreateStudent(schoolId, studentId, newStudent);

      // 1.2 Medical Profile (Delegated to StudentMedicalService)
      const medicalId = `med_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      StudentMedicalService.enlistCreateMedicalRecord(studentId, medicalId, studentData);

      // 1.3 Library Account (Delegated to StudentLibraryService)
      const libraryId = `lib_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      StudentLibraryService.enlistCreateLibraryAccount(studentId, libraryId);

      // 1.4 Uniform Account (Delegated to StudentFeeService)
      const uniformId = `uni_acc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      StudentFeeService.enlistCreateUniformAccount(studentId, uniformId);

      // 1.5 Transportation Profile (Delegated to StudentFeeService)
      const transportId = `trans_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      StudentFeeService.enlistCreateTransportationProfile(studentId, transportId);

      // 1.6 Guardian Relation & Account (Delegated to StudentGuardianService)
      StudentGuardianService.enlistCreateGuardianRelation(schoolId, studentId, studentData);

      // 1.7 Financial Account (Initial registration fee invoice, Delegated to StudentFeeService)
      const invoiceId = `inv_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      StudentFeeService.enlistCreateInitialInvoice(
        schoolId,
        studentId,
        newStudent.name,
        invoiceId,
        configuredRegistrationFee
      );

      // 1.8 Audit Record logging
      const auditLogId = `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const auditLog = {
        id: auditLogId,
        schoolId,
        timestamp: new Date().toISOString(),
        userId: meta.userId,
        userName: meta.userName,
        userRole: meta.userRole,
        action: 'INSERT',
        module: 'students',
        ipAddress: meta.ipAddress,
        details: `تم قبول وتسجيل الطالب ${newStudent.name} وبناء دورة حياته الأكاديمية والمالية والخدمية بالكامل.`
      };
      AuditRepository.enlistCreateAuditLogParameterized(
        auditLogId,
        schoolId,
        auditLog
      );

      return {
        studentId,
        student: newStudent,
        medicalId,
        libraryId,
        uniformId,
        invoiceId
      };
    });
  }
}
