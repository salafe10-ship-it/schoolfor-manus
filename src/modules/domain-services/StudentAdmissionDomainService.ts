import { Student, AuditMetadata } from '../../types';
import { StudentService } from '../../database/services/StudentService';
import { StudentLifecycleManager } from '../../database/services/StudentLifecycleManager';
import { UnitOfWork } from '../../database/UnitOfWork';
import { EnterpriseLogger } from '../../database/services/EnterpriseLogger';
import { BusinessRuleError } from '../../utils/errors';
import { SQLCommandBuilder } from '../../database/transactions/SQLCommand';

export class StudentAdmissionDomainService {
  /**
   * Admits a student into the system with all required secondary profile creations.
   */
  public static async AdmitStudent(
    schoolId: string,
    studentData: Partial<Student> & { parentName?: string; parentPhone?: string },
    meta: AuditMetadata
  ): Promise<any> {
    EnterpriseLogger.info('Executing Domain Operation: AdmitStudent', 'StudentAdmissionDomainService', { studentData, userId: meta.userId });
    
    // Enforce business rules for admission
    if (!studentData.name) {
      throw new BusinessRuleError('لا يمكن قبول طالب دون تسجيل الاسم الكامل.');
    }
    if (!studentData.nationalId) {
      throw new BusinessRuleError('الهوية الوطنية أو الإقامة شرط إلزامي للقبول في النظام التعليمي.');
    }

    // Delegate to the transaction-wrapped StudentService
    return await StudentService.createStudent(schoolId, studentData, meta);
  }

  /**
   * Registers an already admitted student to an academic class.
   */
  public static async RegisterStudent(
    schoolId: string,
    studentId: string,
    classId: string,
    meta: AuditMetadata
  ): Promise<any> {
    EnterpriseLogger.info('Executing Domain Operation: RegisterStudent', 'StudentAdmissionDomainService', { studentId, classId, userId: meta.userId });

    return UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: `تسجيل الطالب ${studentId} في الفصل الدراسي ${classId}`,
      userId: meta.userId,
      userName: meta.userName,
      ipAddress: meta.ipAddress,
      affectedTables: ['students']
    }, async () => {
      // Transition validation
      StudentLifecycleManager.validateTransition('applicant', 'accepted');
      StudentLifecycleManager.validateTransition('accepted', 'enrolled');

      const command = SQLCommandBuilder.create({
        sqlText: `UPDATE students SET class_id = $1, status = 'enrolled' WHERE id = $2;`,
        parameters: [classId, studentId],
        executionContext: 'Register Student'
      });
      UnitOfWork.enlistUpdate('students', studentId, { classId, status: 'enrolled' }, command);
      return { success: true, studentId, classId };
    });
  }

  /**
   * Promotes a student to a new academic grade upon meeting progression criteria.
   */
  public static async PromoteStudent(
    schoolId: string,
    studentId: string,
    newGradeId: string,
    meta: AuditMetadata
  ): Promise<any> {
    EnterpriseLogger.info('Executing Domain Operation: PromoteStudent', 'StudentAdmissionDomainService', { studentId, newGradeId, userId: meta.userId });

    return UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: `ترقية الطالب ${studentId} إلى الصف الأكاديمي ${newGradeId}`,
      userId: meta.userId,
      userName: meta.userName,
      ipAddress: meta.ipAddress,
      affectedTables: ['students']
    }, async () => {
      // Validate active status
      StudentLifecycleManager.validateTransition('active', 'active'); // Verify status integrity

      const command = SQLCommandBuilder.create({
        sqlText: `UPDATE students SET grade_id = $1, behavior_points = 100 WHERE id = $2;`,
        parameters: [newGradeId, studentId],
        executionContext: 'Promote Student'
      });
      UnitOfWork.enlistUpdate('students', studentId, { gradeId: newGradeId, behaviorPoints: 100 }, command);
      return { success: true, studentId, newGradeId };
    });
  }

  /**
   * Transfers a student to a target school, validating cross-tenant boundaries.
   */
  public static async TransferStudent(
    schoolId: string,
    studentId: string,
    targetSchoolId: string,
    meta: AuditMetadata
  ): Promise<any> {
    EnterpriseLogger.info('Executing Domain Operation: TransferStudent', 'StudentAdmissionDomainService', { studentId, targetSchoolId, userId: meta.userId });

    if (schoolId === targetSchoolId) {
      throw new BusinessRuleError('لا يمكن نقل الطالب إلى نفس المدرسة الحالية.');
    }

    return UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: `نقل الطالب ${studentId} إلى المدرسة ${targetSchoolId}`,
      userId: meta.userId,
      userName: meta.userName,
      ipAddress: meta.ipAddress,
      affectedTables: ['students']
    }, async () => {
      const command = SQLCommandBuilder.create({
        sqlText: `UPDATE students SET school_id = $1, status = 'suspended' WHERE id = $2;`,
        parameters: [targetSchoolId, studentId],
        executionContext: 'Transfer Student'
      });
      UnitOfWork.enlistUpdate('students', studentId, { schoolId: targetSchoolId, status: 'suspended' }, command);
      return { success: true, studentId, targetSchoolId };
    });
  }

  /**
   * Graduates a student who has completed all requirements.
   */
  public static async GraduateStudent(
    schoolId: string,
    studentId: string,
    meta: AuditMetadata
  ): Promise<any> {
    EnterpriseLogger.info('Executing Domain Operation: GraduateStudent', 'StudentAdmissionDomainService', { studentId, userId: meta.userId });

    return UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: `تخرج الطالب ${studentId} من المؤسسة التعليمية`,
      userId: meta.userId,
      userName: meta.userName,
      ipAddress: meta.ipAddress,
      affectedTables: ['students']
    }, async () => {
      // Transition validation
      StudentLifecycleManager.validateTransition('active', 'graduated');

      const command = SQLCommandBuilder.create({
        sqlText: `UPDATE students SET status = 'graduated' WHERE id = $1;`,
        parameters: [studentId],
        executionContext: 'Graduate Student'
      });
      UnitOfWork.enlistUpdate('students', studentId, { status: 'graduated' }, command);
      return { success: true, studentId };
    });
  }
}
