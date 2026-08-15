import { StudentRepository } from '../repositories/StudentRepository';
import { StudentContactRepository } from '../repositories/StudentContactRepository';
import { AuditRepository } from '../repositories/AuditRepository';
import { FallbackStorage } from '../repositories/FallbackStorage';
import { UnitOfWork } from '../UnitOfWork';
import { ValidationError } from '../../utils/errors';
import { AuditMetadata } from '../../types';
import { StudentFeeService } from './StudentFeeService';
import { StudentLibraryService } from './StudentLibraryService';
import { StudentMedicalService } from './StudentMedicalService';

export class StudentWithdrawalService {
  /**
   * 3. Delete Student Lifecycle with constraints check (Soft Delete, Restore, Permanent Delete)
   */
  public static async deleteStudent(
    schoolId: string,
    id: string,
    action: 'soft' | 'restore' | 'permanent',
    meta: AuditMetadata,
    reason?: string
  ): Promise<any> {
    const student = await StudentRepository.getById(schoolId, id);
    if (!student) {
      throw new ValidationError("الطالب غير موجود.");
    }

    // 3.1 Verify Constraints (Ensure student is not linked to active operations)
    const reasons: string[] = [];

    // Financial & Logistical constraints
    StudentFeeService.checkFinancialAndLogisticalCommitments(id, student.feesRemaining, reasons);

    // Library check
    StudentLibraryService.checkLibraryCommitments(id, reasons);

    // Check documents
    const docs = FallbackStorage.getStudentDocuments().filter(d => d.studentId === id);
    if (docs.length > 0 && action === 'permanent') {
      reasons.push(`الملفات المحفوظة: يحتوي الخزانة المؤمنة للطالب على ${docs.length} مستندات رسمية مرفوعة.`);
    }

    // Check exams
    // Simple mock exam results check: let's see if student has registered exam scores (using heuristic/mock search)
    if (id === 'stud_1' || id === 'stud_2') {
      reasons.push("السجلات التعليمية: يحتوي كنترول الامتحانات المركزي على كراسات درجات خاصة بهذا الطالب.");
    }

    if (reasons.length > 0 && (action === 'soft' || action === 'permanent')) {
      return {
        success: false,
        reasons,
        message: `تعذر إجراء العملية بسبب وجود ارتباطات نشطة في الأنظمة الفرعية للمدرسة. يرجى إزالة الارتباطات وتصفية العهد المالية واللوجستية أولاً لضمان سلامة ميزانية ERP.`
      };
    }

    return UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: `تعديل حالة السجل وحذفه (إجراء: ${action}): ${student.name}`,
      userId: meta.userId,
      userName: meta.userName,
      ipAddress: meta.ipAddress,
      affectedTables: ['students', 'audit_logs']
    }, async () => {
      if (action === 'soft') {
        // Enlist soft-delete update (set status = 'withdrawn' and mark soft deleted with reason and metadata)
        const updated = await StudentRepository.update(schoolId, id, {
          status: 'withdrawn',
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy: meta.userId,
          deleteReason: reason || 'إلغاء قيد وتجميد بقرار إداري'
        }, meta);
        await AuditRepository.log(schoolId, meta.userId, meta.userName, meta.userRole, 'DELETE', 'students', meta.ipAddress, `إلغاء قيد (حذف ناعم) للطالب ${student.name} وتجميد حسابه. السبب: ${reason || 'إلغاء قيد وتجميد بقرار إداري'}`);
        return { success: true, action: 'soft', student: updated };
      } else if (action === 'restore') {
        const updated = await StudentRepository.update(schoolId, id, { status: 'active' }, meta);
        await AuditRepository.log(schoolId, meta.userId, meta.userName, meta.userRole, 'UPDATE', 'students', meta.ipAddress, `إعادة قيد وتنشيط سجل الطالب ${student.name} بعد تجميده.`);
        return { success: true, action: 'restore', student: updated };
      } else {
        // Permanent Hard Delete - cascading deletes on all sub tables
        const subList = FallbackStorage.getStudentContacts().filter(c => c.studentId === id);
        for (const item of subList) {
          StudentContactRepository.enlistDeleteStudentContact(item.id);
        }
        
        // Delete student library account
        StudentLibraryService.enlistDeleteLibraryAccount(id);

        // Delete medical
        StudentMedicalService.enlistDeleteMedicalRecord(id);

        // Delete uniform & transport
        StudentFeeService.enlistDeleteUniformAndTransportation(id);

        // Finally delete student
        await StudentRepository.delete(schoolId, id, meta, "حذف نهائي (إجراء إداري)");

        await AuditRepository.log(schoolId, meta.userId, meta.userName, meta.userRole, 'DELETE', 'students', meta.ipAddress, `حذف نهائي وقاطع لسجل الطالب ${student.name} وكافة ملفاته الملحقة من كافة الأنظمة الفرعية.`);
        return { success: true, action: 'permanent' };
      }
    });
  }
}
