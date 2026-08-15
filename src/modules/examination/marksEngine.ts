import { Mark, ApprovalStatus, MarkAuditEntry } from './types';
import { ExaminationAuditor } from './audit';

export class MarksEngine {
  static validateMarkRange(marksObtained: number, maxScore: number): boolean {
    return marksObtained >= 0 && marksObtained <= maxScore;
  }

  static createMark(mark: Mark, userId: string): Mark {
    if (!this.validateMarkRange(mark.marksObtained, mark.maxScore)) {
      throw new Error(`Invalid marks: ${mark.marksObtained} outside range [0, ${mark.maxScore}]`);
    }

    const auditEntry: MarkAuditEntry = {
      timestamp: new Date().toISOString(),
      userId,
      action: 'created',
      newValue: mark.marksObtained
    };

    mark.auditHistory.push(auditEntry);
    ExaminationAuditor.log(
      'create_mark',
      mark.id,
      userId,
      {
        tenantId: mark.tenantId,
        schoolId: mark.schoolId,
        branchId: mark.branchId,
        academicYearId: mark.academicYearId,
        sessionId: 'current_session',
        ipAddress: '127.0.0.1',
        device: 'web_client'
      },
      null,
      mark.marksObtained,
      'New mark created'
    );
    return mark;
  }

  static approveMark(mark: Mark, approverId: string): Mark {
    if (mark.status === 'approved') {
      throw new Error('Cannot modify approved mark.');
    }

    mark.status = 'approved';
    mark.approvalTimestamp = new Date().toISOString();

    const auditEntry: MarkAuditEntry = {
      timestamp: mark.approvalTimestamp,
      userId: approverId,
      action: 'approved',
      newValue: 'approved'
    };
    mark.auditHistory.push(auditEntry);

    ExaminationAuditor.log(
      'approve_mark',
      mark.id,
      approverId,
      {
        tenantId: mark.tenantId,
        schoolId: mark.schoolId,
        branchId: mark.branchId,
        academicYearId: mark.academicYearId,
        sessionId: 'current_session',
        ipAddress: '127.0.0.1',
        device: 'web_client'
      },
      'draft',
      'approved',
      'Mark approved'
    );
    return mark;
  }

  static updateMark(mark: Mark, newMarksObtained: number, userId: string): Mark {
    if (mark.status === 'approved') {
      throw new Error('Cannot modify approved mark.');
    }
    
    if (!this.validateMarkRange(newMarksObtained, mark.maxScore)) {
      throw new Error(`Invalid marks: ${newMarksObtained} outside range [0, ${mark.maxScore}]`);
    }

    const auditEntry: MarkAuditEntry = {
      timestamp: new Date().toISOString(),
      userId,
      action: 'updated',
      previousValue: mark.marksObtained,
      newValue: newMarksObtained
    };

    mark.marksObtained = newMarksObtained;
    mark.auditHistory.push(auditEntry);

    ExaminationAuditor.log(
      'update_mark',
      mark.id,
      userId,
      {
        tenantId: mark.tenantId,
        schoolId: mark.schoolId,
        branchId: mark.branchId,
        academicYearId: mark.academicYearId,
        sessionId: 'current_session',
        ipAddress: '127.0.0.1',
        device: 'web_client'
      },
      auditEntry.previousValue,
      auditEntry.newValue,
      'Mark updated'
    );
    return mark;
  }
}
