import { StudentRepository } from '../repositories/StudentRepository';
import { InvoiceRepository } from '../repositories/InvoiceRepository';
import { AuditRepository } from '../repositories/AuditRepository';
import { UnitOfWork } from '../UnitOfWork';
import { ValidationError } from '../../utils/errors';
import { Student, AuditMetadata } from '../../types';

export class StudentPromotionService {
  /**
   * 5. Annual Promotion Engine (ترقية الصفوف والتحصيل الرسومي)
   */
  public static async promoteStudent(
    schoolId: string,
    id: string,
    promotion: {
      targetClassroom: string;
      targetStageId: string;
      carryOverFees: number;
    },
    meta: AuditMetadata
  ): Promise<any> {
    const student = await StudentRepository.getById(schoolId, id);
    if (!student) {
      throw new ValidationError("الطالب غير موجود.");
    }

    return UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: `الترقية السنوية وتصفية الرسوم للطالب: ${student.name}`,
      userId: meta.userId,
      userName: meta.userName,
      ipAddress: meta.ipAddress,
      affectedTables: ['students', 'invoices', 'audit_logs']
    }, async () => {
      const oldClassroom = student.classroom;
      const oldStage = student.stageId;

      // Prepare updates
      const updates: Partial<Student> = {
        classroom: promotion.targetClassroom,
        stageId: promotion.targetStageId,
        feesRemaining: student.feesRemaining + promotion.carryOverFees,
        academicYear: "2027/2028" // Next Academic Year
      };

      const updated = await StudentRepository.update(schoolId, id, updates, meta);

      // Create a carry over fee invoice
      if (promotion.carryOverFees > 0) {
        const invoiceId = `inv_promo_${Date.now()}`;
        const invoice = {
          id: invoiceId,
          schoolId,
          studentId: id,
          studentName: student.name,
          amount: promotion.carryOverFees,
          paidAmount: 0.00,
          dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'unpaid',
          category: 'tuition',
          notes: `رسوم مرحلية مرحلة وترقية من الصف ${oldClassroom} للعام الجديد`
        };
        InvoiceRepository.enlistCreateInvoice(
          invoiceId,
          schoolId,
          id,
          student.name,
          promotion.carryOverFees,
          'رسوم ترقية ترحيلية',
          'tuition',
          invoice
        );
      }

      await AuditRepository.log(
        schoolId,
        meta.userId,
        meta.userName,
        meta.userRole,
        'UPDATE',
        'students',
        meta.ipAddress,
        `الترقية السنوية الأكاديمية للطالب ${student.name} من ${oldClassroom} إلى الصف ${promotion.targetClassroom} بنجاح وترحيل الرسوم المستحقة.`
      );

      return {
        success: true,
        student: updated,
        previousState: {
          classroom: oldClassroom,
          stageId: oldStage,
          feesRemaining: student.feesRemaining
        }
      };
    });
  }
}
