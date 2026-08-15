import { ReceivableStatus, ReceivableAccount } from '../../types';
import { AccountsReceivableRepository } from '../repositories/AccountsReceivableRepository';
import { UnitOfWork } from '../UnitOfWork';

/**
 * Enterprise Accounts Receivable State Machine (Centralized & Independent)
 * Governs all transition rules, security gates, and audit trails for AR lifecycle.
 */
export class ReceivableStateMachine {

  private static readonly VALID_TRANSITIONS: Record<ReceivableStatus, ReceivableStatus[]> = {
    'Draft': ['Open', 'Closed', 'Archived'],
    'Open': ['Partially Collected', 'Collected', 'Past Due', 'In Collection', 'Payment Promise', 'Disputed', 'Written Off', 'Closed'],
    'Partially Collected': ['Collected', 'Past Due', 'In Collection', 'Payment Promise', 'Disputed', 'Written Off', 'Closed'],
    'Collected': ['Disputed', 'Closed', 'Archived'],
    'Past Due': ['In Collection', 'Payment Promise', 'Partially Collected', 'Collected', 'Disputed', 'Written Off', 'Closed'],
    'In Collection': ['Payment Promise', 'Partially Collected', 'Collected', 'Disputed', 'Written Off', 'Closed'],
    'Payment Promise': ['Partially Collected', 'Collected', 'Past Due', 'In Collection', 'Disputed', 'Written Off', 'Closed'],
    'Disputed': ['Open', 'Partially Collected', 'Collected', 'Past Due', 'Written Off', 'Closed'],
    'Written Off': ['Closed', 'Archived'],
    'Closed': ['Archived'],
    'Archived': []
  };

  /**
   * Validates if a transition from current state to target state is legally allowed.
   */
  public static validateTransition(fromStatus: ReceivableStatus, toStatus: ReceivableStatus): void {
    if (fromStatus === toStatus) return; // Self transition is always benign

    const allowed = this.VALID_TRANSITIONS[fromStatus] || [];
    if (!allowed.includes(toStatus)) {
      throw new Error(`مخالفة معمارية: لا يمكن تحويل حالة الذمة من '${fromStatus}' إلى '${toStatus}' بموجب محرك الـ State Machine المحاسبي.`);
    }
  }

  /**
   * Executes a verified state transition on an account under the transaction boundary.
   */
  public static async transitionAccount(
    schoolId: string,
    accountId: string,
    targetStatus: ReceivableStatus,
    reason: string,
    changerName: string
  ): Promise<ReceivableAccount> {
    const account = await AccountsReceivableRepository.getAccountById(schoolId, accountId);
    if (!account) {
      throw new Error(`حساب الذمم المطلوب غير موجود: ${accountId}`);
    }

    const currentStatus = account.status;
    if (currentStatus === targetStatus) {
      return account;
    }

    // Enforce transition rules
    this.validateTransition(currentStatus, targetStatus);

    // Perform state update in Repository (enlisted in UoW transaction)
    const updated = await AccountsReceivableRepository.updateAccount(schoolId, accountId, {
      status: targetStatus,
      version: account.version
    });

    // Record formal status change history
    await AccountsReceivableRepository.createStatusHistory(schoolId, {
      receivableAccountId: accountId,
      fromStatus: currentStatus,
      toStatus: targetStatus,
      changedBy: changerName,
      reason: reason
    });

    // Log to sub-ledger audit trail
    await AccountsReceivableRepository.logAudit(schoolId, {
      userId: changerName === 'system' ? 'system' : 'user',
      userName: changerName,
      action: 'STATE_TRANSITION',
      entityType: 'ReceivableAccount',
      entityId: accountId,
      details: `تغيير حالة حساب الذمم من ${currentStatus} إلى ${targetStatus}. السبب: ${reason}`
    });

    return updated;
  }
}
