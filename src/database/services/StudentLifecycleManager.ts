import { Student } from '../../types';
import { BusinessRuleError } from '../../utils/errors';

type StudentStatus = Student['status'];

export class StudentLifecycleManager {
  private static readonly allowedTransitions: Record<StudentStatus, StudentStatus[]> = {
    applicant: ['accepted', 'dismissed'],
    accepted: ['enrolled'],
    enrolled: ['active'],
    active: ['suspended', 'graduated', 'withdrawn', 'dismissed'],
    suspended: ['active', 're_enrolled', 'dismissed'],
    re_enrolled: ['active', 'suspended', 'dismissed'],
    dismissed: ['archived'],
    graduated: ['archived'],
    withdrawn: ['archived'],
    archived: ['inactive'],
    frozen: ['active', 'archived'],
    inactive: ['applicant', 'archived', 'active'],
    on_leave: ['active', 'archived'],
  };

  public static validateTransition(currentStatus: StudentStatus, newStatus: StudentStatus): void {
    if (currentStatus === newStatus) return;

    const allowed = this.allowedTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new BusinessRuleError(
        `لا يمكن الانتقال من حالة "${currentStatus}" إلى حالة "${newStatus}". يرجى مراجعة لوائح النظام.`
      );
    }
  }
}
