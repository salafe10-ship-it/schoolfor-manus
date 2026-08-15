import { ReceivableAccount, ReceivableTransaction, ReceivableAdjustment, ReceivableStatus } from '../../types';
import { AccountsReceivableRepository } from '../repositories/AccountsReceivableRepository';
import { AccountsReceivableValidator } from './AccountsReceivableValidator';
import { PostingEngine } from './PostingEngine';
import { EnterpriseLogger } from './EnterpriseLogger';

/**
 * Enterprise Accounts Receivable Policy Service
 * Handles core CPA and IFRS aligned policies for receivables:
 * 1. FIFO / Specific Receipt Allocation Policies.
 * 2. Receivable Adjustments (Write-offs, Waivers, Discounts, Corrections, Refund Offsets, Settlements).
 * 3. Portfolio balances consolidation and reconciliation.
 */
export class AccountsReceivablePolicyService {

  /**
   * Performs automated FIFO (First-In-First-Out) receipt allocation for a payment.
   * Resolves the oldest outstanding debit transactions with the available payment credit.
   */
  public static async allocatePaymentFIFO(
    schoolId: string,
    accountId: string,
    paymentId: string,
    paymentAmount: number,
    auditContext: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<{ allocatedAmount: number; remainingPayment: number; allocations: any[] }> {
    const account = await AccountsReceivableRepository.getAccountById(schoolId, accountId);
    if (!account) {
      throw new Error(`حساب الذمم المدنية غير موجود: ${accountId}`);
    }

    let remainingCredit = paymentAmount;
    const allocations: any[] = [];

    // Fetch all debit transactions sorted by transaction date (oldest first)
    const txs = await AccountsReceivableRepository.getTransactionsByAccountId(schoolId, accountId);
    const debitTxs = txs
      .filter(t => t.type === 'debit' && t.balance > 0 && t.status !== 'Collected' && t.status !== 'Closed')
      .sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());

    for (const tx of debitTxs) {
      if (remainingCredit <= 0) break;

      const allocateToThis = Math.min(tx.balance, remainingCredit);
      const newTxBalance = tx.balance - allocateToThis;
      remainingCredit -= allocateToThis;

      // Update Transaction status
      let newTxStatus: ReceivableStatus = tx.status;
      if (newTxBalance === 0) {
        newTxStatus = 'Collected';
      } else if (newTxBalance < tx.amount) {
        newTxStatus = 'Partially Collected';
      }

      await AccountsReceivableRepository.updateTransaction(schoolId, tx.id, {
        balance: newTxBalance,
        status: newTxStatus
      });

      // Record Allocation record
      const alloc = await AccountsReceivableRepository.createAllocation(schoolId, {
        settlementId: paymentId,
        receivableTransactionId: tx.id,
        allocatedAmount: allocateToThis,
        allocatedBy: auditContext.userName
      });

      allocations.push(alloc);
    }

    // Update Account totals
    const updatedPaid = (account.totalPaid || 0) + (paymentAmount - remainingCredit);
    const updatedOutstanding = Math.max(0, (account.totalBilled || 0) - updatedPaid);
    
    let newAccStatus: ReceivableStatus = account.status;
    if (updatedOutstanding === 0) {
      newAccStatus = 'Collected';
    } else if (updatedPaid > 0) {
      newAccStatus = 'Partially Collected';
    }

    await AccountsReceivableRepository.updateAccount(schoolId, accountId, {
      totalPaid: updatedPaid,
      totalOutstanding: updatedOutstanding,
      status: newAccStatus,
      version: account.version
    });

    // Create Receivable Settlement record
    await AccountsReceivableRepository.createSettlement(schoolId, {
      receivableAccountId: accountId,
      paymentId: paymentId,
      amountSettled: paymentAmount - remainingCredit,
      method: 'bank_transfer'
    });

    await AccountsReceivableRepository.logAudit(schoolId, {
      userId: auditContext.userId,
      userName: auditContext.userName,
      action: 'ALLOCATE_PAYMENT_FIFO',
      entityType: 'ReceivableAccount',
      entityId: accountId,
      details: `تم تخصيص دفعة مالية بقيمة ${paymentAmount - remainingCredit} ${account.currency} بنظام الأقدمية FIFO.`
    });

    return {
      allocatedAmount: paymentAmount - remainingCredit,
      remainingPayment: remainingCredit,
      allocations
    };
  }

  /**
   * Applies a financial adjustment (Write-off, Waiver, Discount, Correction, Refund Offset, Settlement)
   * under strict audit trails and double-entry integration guidelines.
   */
  public static async applyAdjustment(
    schoolId: string,
    accountId: string,
    params: {
      type: 'write_off' | 'waiver' | 'settlement' | 'discount' | 'correction' | 'refund_offset';
      amount: number;
      reason: string;
      invoiceId?: string;
      receivableTransactionId?: string;
    },
    auditContext: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<ReceivableAdjustment> {
    const account = await AccountsReceivableRepository.getAccountById(schoolId, accountId);
    if (!account) {
      throw new Error(`حساب الذمم المدنية غير موجود: ${accountId}`);
    }

    if (params.amount <= 0) {
      throw new Error('قيمة التعديل يجب أن تكون أكبر من الصفر.');
    }

    // 1. Create adjustment draft
    const adj = await AccountsReceivableRepository.createAdjustment(schoolId, {
      receivableAccountId: accountId,
      invoiceId: params.invoiceId,
      receivableTransactionId: params.receivableTransactionId,
      type: params.type,
      amount: params.amount,
      reason: params.reason,
      status: 'approved', // auto-approve in enterprise core rules if logged by accountant
      approvedBy: auditContext.userName
    });

    // 2. Modify corresponding transactions & outstanding balance
    if (params.type === 'write_off' || params.type === 'waiver' || params.type === 'discount' || params.type === 'settlement') {
      let amountToReduce = params.amount;

      // Log specific write-off tracking if applicable
      if (params.type === 'write_off') {
        await AccountsReceivableRepository.createWriteOff(schoolId, {
          receivableAccountId: accountId,
          amount: params.amount,
          reason: params.reason,
          approvedBy: auditContext.userName,
          ledgerVoucherId: `V_WOFF_${Date.now()}`
        });
      }

      // If tied to a specific transaction, reduce that transaction balance
      if (params.receivableTransactionId) {
        const tx = await AccountsReceivableRepository.getTransactionById(schoolId, params.receivableTransactionId);
        if (tx) {
          const appliedToTx = Math.min(tx.balance, amountToReduce);
          const newBal = tx.balance - appliedToTx;
          await AccountsReceivableRepository.updateTransaction(schoolId, tx.id, {
            balance: newBal,
            status: newBal === 0 ? 'Closed' : tx.status
          });
        }
      } else {
        // Apply FIFO reduction on outstanding debit transactions
        const txs = await AccountsReceivableRepository.getTransactionsByAccountId(schoolId, accountId);
        const activeDebits = txs.filter(t => t.type === 'debit' && t.balance > 0).sort((a,b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());
        
        for (const tx of activeDebits) {
          if (amountToReduce <= 0) break;
          const reduceThis = Math.min(tx.balance, amountToReduce);
          amountToReduce -= reduceThis;

          await AccountsReceivableRepository.updateTransaction(schoolId, tx.id, {
            balance: tx.balance - reduceThis,
            status: (tx.balance - reduceThis) === 0 ? 'Closed' : tx.status
          });
        }
      }

      // Update account figures
      const newOutstanding = Math.max(0, account.totalOutstanding - params.amount);
      const newStatus: ReceivableStatus = newOutstanding === 0 ? 'Closed' : (params.type === 'write_off' ? 'Written Off' : account.status);

      await AccountsReceivableRepository.updateAccount(schoolId, accountId, {
        totalOutstanding: newOutstanding,
        status: newStatus,
        version: account.version
      });
    } else if (params.type === 'correction') {
      // Correction can increase or decrease billed amount
      const newBilled = account.totalBilled + params.amount;
      const newOutstanding = Math.max(0, newBilled - account.totalPaid);
      await AccountsReceivableRepository.updateAccount(schoolId, accountId, {
        totalBilled: newBilled,
        totalOutstanding: newOutstanding,
        version: account.version
      });
    } else if (params.type === 'refund_offset') {
      // Refund Offset decreases paid, increases outstanding
      const newPaid = Math.max(0, account.totalPaid - params.amount);
      const newOutstanding = account.totalOutstanding + params.amount;
      await AccountsReceivableRepository.updateAccount(schoolId, accountId, {
        totalPaid: newPaid,
        totalOutstanding: newOutstanding,
        status: 'Open',
        version: account.version
      });
    }

    // 3. Post to General Ledger using PostingEngine to register proper GAAP double entry
    try {
      const entryId = `jrnl_adj_${Date.now()}`;
      const isReduction = ['write_off', 'waiver', 'discount', 'settlement'].includes(params.type);
      
      const debitAccount = isReduction ? '5101' : '1201'; // Bad Debt Expense (5101) or Accounts Receivable (1201)
      const creditAccount = isReduction ? '1201' : '4101'; // Accounts Receivable (1201) or Earned Revenue (4101)

      const newEntryDraft = await PostingEngine.createJournalEntryDraft(schoolId, {
        id: entryId,
        date: new Date().toISOString().split('T')[0],
        description: `تسوية وتعديل مالي من نوع ${params.type} لحساب الذمم ${accountId}. السبب: ${params.reason}`,
        status: 'draft',
        items: [
          { accountId: debitAccount, debit: params.amount, credit: 0 },
          { accountId: creditAccount, debit: 0, credit: params.amount }
        ],
        totalDebit: params.amount,
        totalCredit: params.amount,
        referenceType: 'reversal',
        referenceId: accountId,
        meta: {
          userId: auditContext.userId,
          userName: auditContext.userName,
          userRole: auditContext.userRole as any,
          ipAddress: auditContext.ipAddress
        }
      } as any);

      await PostingEngine.postJournalEntry(schoolId, newEntryDraft.id, {
        userId: auditContext.userId,
        userName: auditContext.userName,
        userRole: auditContext.userRole as any,
        ipAddress: auditContext.ipAddress
      });
    } catch (err: any) {
      EnterpriseLogger.warn('Accounting Posting failed during AR adjustment, continuing offline:', 'AccountsReceivablePolicy', { error: err?.message || err });
    }

    // 4. Log Audit
    await AccountsReceivableRepository.logAudit(schoolId, {
      userId: auditContext.userId,
      userName: auditContext.userName,
      action: `AR_ADJUSTMENT_${params.type.toUpperCase()}`,
      entityType: 'ReceivableAdjustment',
      entityId: adj.id,
      details: `تم تطبيق تعديل مالي (${params.type}) بمبلغ ${params.amount} على الحساب ${accountId}. السبب: ${params.reason}`
    });

    return adj;
  }
}
