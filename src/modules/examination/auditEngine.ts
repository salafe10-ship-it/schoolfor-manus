
import { Mark, Result, ApprovalStatus } from './types';
import { ResultCalculationEngine } from './calculationEngine';

export interface AuditIssue {
  recordId: string;
  type: 'inconsistency' | 'integrity_error' | 'security_flag';
  message: string;
  severity: 'critical' | 'warning' | 'info';
  isRepairable: boolean;
}

export interface AuditReport {
  timestamp: string;
  integrityScore: number; // 0-100
  issues: AuditIssue[];
}

export class AcademicAuditEngine {
  
  static runAudit(marks: Mark[], results: Result[]): AuditReport {
    const issues: AuditIssue[] = [];

    // 1. Audit Marks & Calculations Integrity
    this.auditMarks(marks, issues);
    this.auditResults(results, issues);

    // 2. Audit Cross-Module Consistency (Stubs)
    this.auditAttendanceConsistency(issues);
    this.auditCertificateConsistency(issues);
    this.auditPromotionConsistency(issues);

    return {
      timestamp: new Date().toISOString(),
      integrityScore: Math.max(0, 100 - (issues.length * 5)),
      issues
    };
  }

  private static auditMarks(marks: Mark[], issues: AuditIssue[]) {
    marks.forEach(mark => {
      if (mark.status !== 'approved' && (mark.marksObtained < 0 || mark.marksObtained > mark.maxScore)) {
        issues.push({ recordId: mark.id, type: 'integrity_error', message: 'Mark outside valid range', severity: 'critical', isRepairable: false });
      }
    });
  }

  private static auditResults(results: Result[], issues: AuditIssue[]) {
    results.forEach(result => {
        if (result.status === 'passed' && result.percentage < 50) {
            issues.push({ recordId: result.id, type: 'inconsistency', message: 'Pass status with failing percentage', severity: 'critical', isRepairable: true });
        }
    });
  }

  private static auditAttendanceConsistency(issues: AuditIssue[]) {
      // Stub for future implementation
  }

  private static auditCertificateConsistency(issues: AuditIssue[]) {
      // Stub for future implementation
  }

  private static auditPromotionConsistency(issues: AuditIssue[]) {
      // Stub for future implementation
  }

  static repairSafeInconsistencies(marks: Mark[], results: Result[]): { repairedMarks: Mark[], repairedResults: Result[] } {
    const repairedMarks = [...marks];
    const repairedResults = results.map(r => {
        if (r.status === 'passed' && r.percentage < 50) {
            return { ...r, status: 'failed' as const };
        }
        return r;
    });
    
    return { repairedMarks, repairedResults };
  }
}
