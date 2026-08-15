import { StudentStatus, LifecycleTransition, ALLOWED_TRANSITIONS } from '../domain/StudentLifecycle';
import { StudentRepository } from '../../../database/repositories/StudentRepository';
import { AuditRepository } from '../../../database/repositories/AuditRepository';
import { UnitOfWork } from '../../../database/UnitOfWork';

export class StudentLifecycleService {
  public static async transition(
    tenantId: string,
    studentId: string,
    transition: LifecycleTransition,
    performedBy: string
  ): Promise<void> {
    await UnitOfWork.runInTransaction(
      tenantId,
      {
        tenantId,
        operationName: transition.toUpperCase(),
        userId: performedBy,
        userName: performedBy,
        ipAddress: '127.0.0.1',
        affectedTables: ['students']
      },
      async () => {
        const student = await StudentRepository.getById(tenantId, studentId);
        if (!student) throw new Error('Student not found');

        const currentStatus = student.status as StudentStatus;
        const allowed = ALLOWED_TRANSITIONS[currentStatus]?.includes(transition);
        
        if (!allowed) {
          throw new Error(`Invalid transition: ${currentStatus} -> ${transition}`);
        }

        const nextStatus = this.determineNextStatus(currentStatus, transition);

        await StudentRepository.updateStatus(tenantId, studentId, nextStatus);
        
        await AuditRepository.create(tenantId, {
          userId: performedBy,
          userName: performedBy,
          userRole: 'SchoolAdmin',
          action: transition.toUpperCase(),
          module: 'student-admission',
          ipAddress: '127.0.0.1',
          details: `Transitioned student ${studentId} from ${currentStatus} to ${nextStatus}`,
          severity: 'INFO',
          timestamp: new Date().toISOString()
        });
      }
    );
  }

  private static determineNextStatus(current: StudentStatus, transition: LifecycleTransition): StudentStatus {
    switch (transition) {
      case LifecycleTransition.ADMIT: return StudentStatus.ENROLLED;
      case LifecycleTransition.TRANSFER: return StudentStatus.TRANSFERRED;
      case LifecycleTransition.WITHDRAW: return StudentStatus.WITHDRAWN;
      case LifecycleTransition.GRADUATE: return StudentStatus.GRADUATED;
      case LifecycleTransition.REACTIVATE: return StudentStatus.ENROLLED;
      case LifecycleTransition.ARCHIVE: return StudentStatus.ARCHIVED;
      default: throw new Error('Unknown transition');
    }
  }
}
