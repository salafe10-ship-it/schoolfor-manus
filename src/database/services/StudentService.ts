import { StudentDocumentRepository } from '../repositories/StudentDocumentRepository';
import type { SupabaseClient } from '@supabase/supabase-js';
import { StudentRepository } from '../repositories/StudentRepository';
import { CanonicalStudentReadRepository, type CanonicalStudentAffairsMetrics, type StudentReadDiagnostic } from '../repositories/CanonicalStudentReadRepository';
import { UnitOfWork } from '../UnitOfWork';
import { FallbackStorage } from '../repositories/FallbackStorage';
import { AuditRepository } from '../repositories/AuditRepository';
import { InvoiceRepository } from '../repositories/InvoiceRepository';
import { AttendanceRepository } from '../repositories/AttendanceRepository';
import { Student, AuditMetadata } from '../../types';
import { ValidationError, BusinessRuleError, AuthorizationError } from '../../utils/errors';
import { EnterpriseLogger } from './EnterpriseLogger';
import { StudentLifecycleManager } from './StudentLifecycleManager';

// Sub-services (Architecturally Decomposed Single-Responsibility Services)
import { StudentAdmissionService } from './StudentAdmissionService';
import { StudentEnrollmentService } from './StudentEnrollmentService';
import { StudentGuardianService } from './StudentGuardianService';
import { StudentPromotionService } from './StudentPromotionService';
import { StudentWithdrawalService } from './StudentWithdrawalService';
import { StudentGraduationService } from './StudentGraduationService';
import { assertTrustedStudentServerExecution } from '../../security/TrustedStudentExecution';
import type { TenantContext } from '../../tenant/TenantContext';
import type { Perf004TraceLike } from '../../performance/Perf004LatencyDiagnostics';

/**
 * Student ERP Application Orchestrator
 * This orchestrator delegates specialized workflows to domain-specific, single-responsibility services.
 */
export class StudentService {
  /**
   * 1. Create Student Lifecycle Workflow (Delegated to StudentAdmissionService)
   */
  public static async createStudent(
    schoolId: string,
    studentData: Partial<Student> & { parentName?: string; parentPhone?: string; guardianRelation?: string },
    meta: AuditMetadata
  ): Promise<any> {
    assertTrustedStudentServerExecution();
    return await StudentAdmissionService.createStudent(schoolId, studentData, meta);
  }

  /**
   * 2. Update Student Lifecycle Workflow
   */
  public static async updateStudent(
    schoolId: string,
    id: string,
    updates: Partial<Student>,
    meta: AuditMetadata
  ): Promise<any> {
    assertTrustedStudentServerExecution();
    const existing = await StudentRepository.getById(schoolId, id);
    if (!existing) {
      throw new ValidationError("الطالب غير موجود في قاعدة بيانات الفرع.");
    }

    // 2.1 Security Constraint: Enforce immutable school_id
    if (updates.schoolId && updates.schoolId !== schoolId) {
      throw new ValidationError("تنبيه أمني: لا يمكن تعديل معرف المدرسة المستأجرة (school_id) لتجنب اختراق المستأجرين الآخرين.");
    }

    // 2.2 Security Constraint: Enforce branch isolation branch_id modification only for Authorized Role
    if (updates.branchId && updates.branchId !== existing.branchId) {
      if (meta.userRole !== 'SchoolAdmin' && meta.userRole !== 'SuperAdmin') {
        throw new AuthorizationError("غير مصرح لك بنقل الطلاب بين فروع المدرسة. هذه العملية تتطلب صلاحية مدير المدرسة الأعلى.");
      }
    }

    // Lifecycle validation
    if (updates.status && updates.status !== existing.status) {
      StudentLifecycleManager.validateTransition(existing.status, updates.status);
    }

    // Lock graduated students
    if (existing.status === 'graduated' && meta.userRole !== 'SuperAdmin') {
      throw new BusinessRuleError("لا يمكن تعديل السجل الأكاديمي للطالب المتخرج حيث تم إقفال ملفه نهائياً.");
    }

    // Lock archived students
    if (existing.status === 'archived' && meta.userRole !== 'SuperAdmin') {
      throw new BusinessRuleError("لا يمكن تعديل بيانات الطالب المؤرشف. يرجى استعادته من الأرشيف أولاً أو طلب صلاحية خاصة.");
    }

    // 2.3 Compute differences (old vs new)
    const oldValues: Record<string, any> = {};
    const newValues: Record<string, any> = {};
    const keysToCompare = Object.keys(updates) as (keyof Student)[];

    for (const key of keysToCompare) {
      if (existing[key] !== updates[key]) {
        oldValues[key] = existing[key];
        newValues[key] = updates[key];
      }
    }

    return UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: `تعديل السجل الأكاديمي والخدمي للطالب: ${existing.name}`,
      userId: meta.userId,
      userName: meta.userName,
      ipAddress: meta.ipAddress,
      affectedTables: ['students', 'audit_logs']
    }, async () => {
      // Perform write
      const updatedStudent = await StudentRepository.update(schoolId, id, updates, meta);

      // Data Consistency Propagation (Synchronize related modules)
      if (updates.name && updates.name !== existing.name) {
        // Sync Invoices
        FallbackStorage.assertCanonicalPersistence('student name invoice synchronization read');
        const invoices = FallbackStorage.getInvoices().filter(i => i.studentId === id);
        for (const inv of invoices) {
          const updatedInv = { ...inv, studentName: updates.name };
          InvoiceRepository.enlistUpdateStudentName(inv.id, updates.name, updatedInv);
        }
        // Sync Attendance
        FallbackStorage.assertCanonicalPersistence('student name attendance synchronization read');
        const attendance = FallbackStorage.getAttendance().filter(a => a.studentId === id);
        for (const att of attendance) {
          const updatedAtt = { ...att, studentName: updates.name };
          AttendanceRepository.enlistUpdateStudentName(att.id, updates.name, updatedAtt);
        }
      }
      
      // Sync Guardians (Delegated to StudentGuardianService)
      StudentGuardianService.syncGuardians(id, updates, existing);

      // Enlist Audit Log
      await AuditRepository.log(
        schoolId,
        meta.userId,
        meta.userName,
        meta.userRole,
        'UPDATE',
        'students',
        meta.ipAddress,
        `تعديل بيانات الطالب ${existing.name}. التعديلات: ${JSON.stringify(newValues)}. تم تفعيل التزامن التلقائي للبيانات المرتبطة.`
      );

      return {
        success: true,
        student: updatedStudent,
        oldValues,
        newValues
      };
    });
  }

  /**
   * 3. Delete Student Lifecycle with constraints check (Delegated to StudentWithdrawalService)
   */
  public static async deleteStudent(
    schoolId: string,
    id: string,
    action: 'soft' | 'restore' | 'permanent',
    meta: AuditMetadata,
    reason?: string
  ): Promise<any> {
    assertTrustedStudentServerExecution();
    return await StudentWithdrawalService.deleteStudent(schoolId, id, action, meta, reason);
  }

  /**
   * 4. Class, Section, Stage, Branch, and School Transfers (Delegated to StudentEnrollmentService)
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
    assertTrustedStudentServerExecution();
    return await StudentEnrollmentService.transferStudent(schoolId, id, transfer, meta);
  }

  /**
   * 5. Annual Promotion Engine (Delegated to StudentPromotionService)
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
    assertTrustedStudentServerExecution();
    return await StudentPromotionService.promoteStudent(schoolId, id, promotion, meta);
  }

  /**
   * 6. Re-enrollment Workflow (Delegated to StudentEnrollmentService)
   */
  public static async reEnrollStudent(
    schoolId: string,
    id: string,
    enrollment: { classroom: string; section: string },
    meta: AuditMetadata
  ): Promise<any> {
    assertTrustedStudentServerExecution();
    return await StudentEnrollmentService.reEnrollStudent(schoolId, id, enrollment, meta);
  }

  /**
   * 7. Graduation Workflow (Delegated to StudentGraduationService)
   */
  public static async graduateStudent(
    schoolId: string,
    id: string,
    meta: AuditMetadata
  ): Promise<any> {
    assertTrustedStudentServerExecution();
    return await StudentGraduationService.graduateStudent(schoolId, id, meta);
  }

  /**
   * 8. Temporary/Permanent Dismissal & Suspension (Delegated to StudentEnrollmentService)
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
    assertTrustedStudentServerExecution();
    return await StudentEnrollmentService.dismissStudent(schoolId, id, dismissal, meta);
  }

  /**
   * 9. Archive & Restore Workflows (Delegated to StudentEnrollmentService)
   */
  public static async archiveStudent(
    schoolId: string,
    id: string,
    archive: boolean,
    meta: AuditMetadata
  ): Promise<any> {
    assertTrustedStudentServerExecution();
    return await StudentEnrollmentService.archiveStudent(schoolId, id, archive, meta);
  }

  /**
   * 10. Advanced Search & Query Engine on top of Fallback/Postgre SQL
   */
  public static async advancedSearch(
    schoolId: string,
    params: {
      quickSearch?: string;
      classroom?: string;
      section?: string;
      status?: string;
      gender?: string;
      feesOutstandingOnly?: boolean;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    },
    trustedContext?: TenantContext,
    diagnosticTrace?: Perf004TraceLike,
    studentReadDiagnostic?: StudentReadDiagnostic,
    supabase?: SupabaseClient
  ): Promise<any> {
    // Student reads must use the same trusted PostgreSQL source of truth as SOP-001 writes.
    // Keep the legacy schoolId argument for API compatibility; tenant scope comes from the
    // authenticated TenantContext inside CanonicalStudentReadRepository.
    return await CanonicalStudentReadRepository.advancedSearch(params, trustedContext, diagnosticTrace, studentReadDiagnostic, supabase);
  }

  public static async getAffairsMetrics(
    trustedContext?: TenantContext,
    diagnosticTrace?: Perf004TraceLike
  ): Promise<CanonicalStudentAffairsMetrics> {
    return await CanonicalStudentReadRepository.affairsMetrics(trustedContext, diagnosticTrace);
  }

  /**
   * 11. Bulk Enterprise Transactions
   */
  public static async executeBulkOperation(
    schoolId: string,
    operation: 'insert' | 'update' | 'delete' | 'transfer' | 'promote' | 'archive',
    items: any[],
    meta: AuditMetadata
  ): Promise<any> {
    assertTrustedStudentServerExecution();
    if (!Array.isArray(items) || items.length === 0) {
      throw new ValidationError("الرجاء تحديد الطلاب أو المدخلات لتنفيذ العملية الجماعية.");
    }

    const supportedOperations = new Set(['insert', 'update', 'delete', 'transfer', 'promote', 'archive']);
    if (!supportedOperations.has(operation)) {
      throw new ValidationError("نوع العملية الجماعية غير مدعوم.", {
        errorCode: 'STU-API-UNKNOWN-OPERATION'
      });
    }

    return UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: `عملية جماعية مركبة (النوع: ${operation}) لعدد ${items.length} طالب`,
      userId: meta.userId,
      userName: meta.userName,
      ipAddress: meta.ipAddress,
      affectedTables: ['students', 'invoices', 'audit_logs']
    }, async () => {
      const results: any[] = [];

      for (const item of items) {
        if (operation === 'insert') {
          const res = await this.createStudent(schoolId, item, meta);
          results.push(res);
        } else if (operation === 'update') {
          const res = await this.updateStudent(schoolId, item.id, item.updates, meta);
          results.push(res);
        } else if (operation === 'delete') {
          const res = await this.deleteStudent(schoolId, item.id, item.action || 'soft', meta);
          results.push(res);
        } else if (operation === 'transfer') {
          const res = await this.transferStudent(schoolId, item.id, item.transfer, meta);
          results.push(res);
        } else if (operation === 'promote') {
          const res = await this.promoteStudent(schoolId, item.id, item.promotion, meta);
          results.push(res);
        } else if (operation === 'archive') {
          const res = await this.archiveStudent(schoolId, item.id, item.archive, meta);
          results.push(res);
        }
      }

      await AuditRepository.log(
        schoolId,
        meta.userId,
        meta.userName,
        meta.userRole,
        'UPDATE',
        'students',
        meta.ipAddress,
        `تنفيذ عملية جماعية مركبة بنجاح من نوع (${operation}) شملت عدد ${items.length} طالب في النظام.`
      );

      return {
        success: true,
        operation,
        processedCount: items.length,
        results
      };
    });
  }
}
