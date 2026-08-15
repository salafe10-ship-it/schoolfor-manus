import { StudentRepository } from '../repositories/StudentRepository';
import { AuditRepository } from '../repositories/AuditRepository';
import { StudentLifecycleManager } from './StudentLifecycleManager';
import { UnitOfWork } from '../UnitOfWork';
import { ValidationError, AuthorizationError } from '../../utils/errors';
import { Student, AuditMetadata } from '../../types';

export class StudentEnrollmentService {
  /**
   * 6. Re-enrollment Workflow
   */
  public static async reEnrollStudent(
    schoolId: string,
    id: string,
    enrollment: { classroom: string; section: string },
    meta: AuditMetadata
  ): Promise<any> {
    const student = await StudentRepository.getById(schoolId, id);
    if (!student) {
      throw new ValidationError("الطالب غير موجود.");
    }

    return UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: `إعادة قيد وتنشيط ملف الطالب: ${student.name}`,
      userId: meta.userId,
      userName: meta.userName,
      ipAddress: meta.ipAddress,
      affectedTables: ['students', 'audit_logs']
    }, async () => {
      StudentLifecycleManager.validateTransition(student.status, 're_enrolled');
      
      const updated = await StudentRepository.update(schoolId, id, {
        status: 'active',
        classroom: enrollment.classroom,
        section: enrollment.section,
        registrationDate: new Date().toISOString().split('T')[0]
      }, meta);

      await AuditRepository.log(
        schoolId,
        meta.userId,
        meta.userName,
        meta.userRole,
        'UPDATE',
        'students',
        meta.ipAddress,
        `إعادة قيد وتنشيط ملف الطالب الأكاديمي ${student.name} بالصف ${enrollment.classroom} بعد تجميده أو انسحابه.`
      );

      return {
        success: true,
        student: updated,
        reEnrollmentDate: new Date().toISOString()
      };
    });
  }

  /**
   * 4. Class, Section, Stage, Branch, and School Transfers
   */
  public static async transferStudent(
    schoolId: string,
    id: string,
    transfer: {
      classroom?: string;
      section?: string;
      stageId?: string;
      branchId?: string;
      targetSchoolId?: string;
    },
    meta: AuditMetadata
  ): Promise<any> {
    const student = await StudentRepository.getById(schoolId, id);
    if (!student) {
      throw new ValidationError("الطالب غير موجود.");
    }

    return UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: `نقل مسار الطالب الأكاديمي: ${student.name}`,
      userId: meta.userId,
      userName: meta.userName,
      ipAddress: meta.ipAddress,
      affectedTables: ['students', 'audit_logs']
    }, async () => {
      const updates: Partial<Student> = {};
      let transferDesc = '';

      if (transfer.classroom) {
        updates.classroom = transfer.classroom;
        transferDesc += `من الصف ${student.classroom} إلى الصف ${transfer.classroom}. `;
      }
      if (transfer.section) {
        updates.section = transfer.section;
        transferDesc += `من الشعبة ${student.section} إلى الشعبة ${transfer.section}. `;
      }
      if (transfer.stageId) {
        updates.stageId = transfer.stageId;
        transferDesc += `تعديل المرحلة الأكاديمية. `;
      }
      if (transfer.branchId) {
        if (meta.userRole !== 'SchoolAdmin' && meta.userRole !== 'SuperAdmin') {
          throw new AuthorizationError("غير مصرح لك بنقل الطلاب بين فروع المؤسسة.");
        }
        updates.branchId = transfer.branchId;
        transferDesc += `من الفرع ${student.branchId} إلى الفرع ${transfer.branchId}. `;
      }

      const updated = await StudentRepository.update(schoolId, id, updates, meta);

      // Save movement history
      const movementLog = {
        id: `move_${Date.now()}`,
        studentId: id,
        date: new Date().toISOString(),
        details: transferDesc,
        performedBy: meta.userName
      };

      await AuditRepository.log(
        schoolId,
        meta.userId,
        meta.userName,
        meta.userRole,
        'UPDATE',
        'students',
        meta.ipAddress,
        `إجراء معاملة حركة نقل للطالب ${student.name}: ${transferDesc}`
      );

      return {
        success: true,
        student: updated,
        movementLog
      };
    });
  }

  /**
   * 8. Temporary/Permanent Dismissal & Suspension
   */
  public static async dismissStudent(
    schoolId: string,
    id: string,
    dismissal: {
      type: 'temporary' | 'permanent';
      reason: string;
      decisionNumber: string;
      authority: string;
      date: string;
    },
    meta: AuditMetadata
  ): Promise<any> {
    const student = await StudentRepository.getById(schoolId, id);
    if (!student) {
      throw new ValidationError("الطالب غير موجود.");
    }

    return UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: `الفصل والتعليق التأديبي/الأكاديمي للطالب: ${student.name}`,
      userId: meta.userId,
      userName: meta.userName,
      ipAddress: meta.ipAddress,
      affectedTables: ['students', 'audit_logs']
    }, async () => {
      const newStatus = dismissal.type === 'permanent' ? 'dismissed' : 'suspended';
      StudentLifecycleManager.validateTransition(student.status, newStatus);
      
      const updated = await StudentRepository.update(schoolId, id, {
        status: newStatus,
        behaviorNotes: `تم اتخاذ إجراء فصل ${dismissal.type === 'permanent' ? 'نهائي' : 'مؤقت'} للطالب. رقم القرار: ${dismissal.decisionNumber}. السبب: ${dismissal.reason}`
      }, meta);

      await AuditRepository.log(
        schoolId,
        meta.userId,
        meta.userName,
        meta.userRole,
        'UPDATE',
        'students',
        meta.ipAddress,
        `تنفيذ قرار فصل (${dismissal.type === 'permanent' ? 'نهائي' : 'مؤقت'}) للطالب ${student.name} بقرار رقم ${dismissal.decisionNumber} معتمد من جهة ${dismissal.authority}.`
      );

      return {
        success: true,
        student: updated,
        dismissalRecord: {
          ...dismissal,
          statusSet: newStatus
        }
      };
    });
  }

  /**
   * 9. Archive & Restore Workflows
   */
  public static async archiveStudent(
    schoolId: string,
    id: string,
    archive: boolean,
    meta: AuditMetadata
  ): Promise<any> {
    const student = await StudentRepository.getById(schoolId, id);
    if (!student) {
      throw new ValidationError("الطالب غير موجود.");
    }

    return UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: `${archive ? 'أرشفة' : 'استعادة أرشفة'} الطالب: ${student.name}`,
      userId: meta.userId,
      userName: meta.userName,
      ipAddress: meta.ipAddress,
      affectedTables: ['students', 'audit_logs']
    }, async () => {
      StudentLifecycleManager.validateTransition(student.status, archive ? 'archived' : 'inactive');
      
      const updated = await StudentRepository.update(schoolId, id, {
        status: archive ? 'archived' : 'active'
      }, meta);

      await AuditRepository.log(
        schoolId,
        meta.userId,
        meta.userName,
        meta.userRole,
        'UPDATE',
        'students',
        meta.ipAddress,
        `تم ${archive ? 'أرشفة وتجميد' : 'فك أرشفة واستعادة نشاط'} سجل الطالب ${student.name} في الأرشيف المركزي بنجاح دون المساس بعلاقاته المرفقة.`
      );

      return {
        success: true,
        student: updated,
        archived: archive
      };
    });
  }
}
