import { TreasuryTransactionStatus, TreasuryTransaction } from '../../types';
import { TreasuryRepository } from '../repositories/TreasuryRepository';
import { TreasuryDomainRules } from './TreasuryDomainRules';

export class TreasuryStateMachine {
  
  private static readonly VALID_TRANSITIONS: Record<TreasuryTransactionStatus, TreasuryTransactionStatus[]> = {
    'Draft': ['Pending Approval', 'Cancelled'],
    'Pending Approval': ['Approved', 'Draft', 'Cancelled'],
    'Approved': ['Executed', 'Cancelled'],
    'Executing': [],
    'Executed': ['Posted', 'Cancelled'],
    'Posted': ['Reconciled', 'Reversed'],
    'Reconciled': ['Archived'],
    'Cancelled': [],
    'Reversed': [],
    'Archived': []
  };

  /**
   * Validates if a status transition is permitted under treasury regulations
   */
  public static canTransition(from: TreasuryTransactionStatus, to: TreasuryTransactionStatus): boolean {
    const allowed = this.VALID_TRANSITIONS[from];
    return allowed ? allowed.includes(to) : false;
  }

  /**
   * Transitions a treasury transaction to a new state after auditing validity
   */
  public static async transitionTransaction(
    schoolId: string,
    transactionId: string,
    newStatus: TreasuryTransactionStatus,
    operatorName: string,
    notes?: string
  ): Promise<TreasuryTransaction> {
    const transaction = await TreasuryRepository.getTransactionById(schoolId, transactionId);
    if (!transaction) {
      throw new Error(`حركة الخزينة غير موجودة في النظام: ${transactionId}`);
    }

    // 1. Immutability checks on terminal / posted states if changing from them
    if (transaction.status === 'Archived' || transaction.status === 'Cancelled' || transaction.status === 'Reversed') {
      throw new Error(`لا يمكن تغيير حالة الحركة لأنها في حالة نهائية مغلقة: ${transaction.status}`);
    }

    // 2. Validate state machine transitions
    if (!this.canTransition(transaction.status, newStatus)) {
      throw new Error(
        `فشل نظام التحكم بالدورة المستندية: الانتقال من حالة (${transaction.status}) إلى حالة (${newStatus}) غير مسموح به في اللائحة المالية للشركة.`
      );
    }

    // 3. Prepare updates
    const updates: Partial<TreasuryTransaction> = {
      status: newStatus,
      notes: notes ? `${transaction.notes || ''}\n[حالة ${newStatus}]: ${notes}` : transaction.notes
    };

    // Auto update transition timestamps & operators
    const timestamp = new Date().toISOString();
    if (newStatus === 'Approved') {
      updates.approvedBy = operatorName;
      updates.approvedAt = timestamp;
    } else if (newStatus === 'Executed') {
      updates.executedBy = operatorName;
      updates.executedAt = timestamp;
    } else if (newStatus === 'Posted') {
      updates.postedBy = operatorName;
      updates.postedAt = timestamp;
    } else if (newStatus === 'Reconciled') {
      updates.reconciledBy = operatorName;
      updates.reconciledAt = timestamp;
    }

    // 4. Commit status update through Repository (DAL)
    return await TreasuryRepository.updateTransaction(schoolId, transactionId, updates);
  }
}
