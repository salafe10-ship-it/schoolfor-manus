export interface ClosingAuditLog {
  id: string;
  schoolId: string;
  periodId: string;
  periodName: string;
  closingType: 'monthly' | 'quarterly' | 'yearly';
  executedBy: {
    userId: string;
    userName: string;
    userRole: string;
    ipAddress: string;
  };
  executedAt: string;
  status: 'success' | 'failed';
  auditReference: string;
  details: {
    discrepancyAmount?: number;
    unpostedCount?: number;
    unbalancedCount?: number;
    reason?: string;
    errors?: string[];
    elapsedTimeMs?: number;
  };
}

export interface ClosingPolicyConfig {
  requireAuditOverrideForReopening: boolean;
  minReasonLength: number;
  strictTrialBalanceMatch: boolean;
  allowForceCloseWithDiscrepancy: boolean;
}
