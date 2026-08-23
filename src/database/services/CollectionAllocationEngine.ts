import { CollectionReceipt, CollectionAllocation, Invoice, InstallmentSchedule, ReceivableAccount } from '../../types';
import { FallbackStorage } from '../repositories/FallbackStorage';
import { CollectionsRepository } from '../repositories/CollectionsRepository';
import { InvoiceRepository } from '../repositories/InvoiceRepository';
import { AccountsReceivableRepository } from '../repositories/AccountsReceivableRepository';
import { AccountsReceivableEngine } from './AccountsReceivableEngine';
import { CollectionsPolicyService, AllocationPolicyType } from './CollectionsPolicyService';
import { CollectionAllocationStrategyFactory } from './CollectionAllocationStrategyFactory';
import { FinancialConfigurationRepository } from '../repositories/FinancialConfigurationRepository';

/**
 * Enterprise Collection Allocation Engine (Phase 2.5)
 * Distributes payment receipts across outstanding financial entities (Invoices, Installments, Receivables)
 * under flexible organizational allocation policies (FIFO, MANUAL, etc.) using the Strategy Pattern.
 */
export class CollectionAllocationEngine {

  /**
   * Distributes the collected amount of a receipt across target financial documents.
   */
  public static async allocateCollection(
    schoolId: string,
    collectionId: string,
    policyOverride?: AllocationPolicyType,
    operatorContext?: { userId: string; userName: string; ipAddress: string },
    manualInstructions?: { targetType: 'Invoice' | 'Installment'; targetId: string; amount: number }[]
  ): Promise<CollectionAllocation[]> {
    FallbackStorage.assertCanonicalPersistence('collection allocation installment read');
    const receipt = await CollectionsRepository.getCollectionById(schoolId, collectionId);
    if (!receipt) {
      throw new Error(`سند التحصيل غير موجود: ${collectionId}`);
    }

    if (receipt.status !== 'Approved' && receipt.status !== 'Collected' && receipt.status !== 'Partially Allocated') {
      throw new Error(`حظر دورة حياة المستند: لا يمكن توزيع مبالغ لسند تحصيل بحالة (الحالة الحالية: ${receipt.status}). يجب أن يكون معتمداً أولاً.`);
    }

    const config = await FinancialConfigurationRepository.getBySchoolId(schoolId);
    const selectedPolicy = policyOverride || (config?.collections?.allocationPolicy as AllocationPolicyType) || CollectionsPolicyService.getPolicy(schoolId).defaultPolicy;
    const operator = operatorContext || { userId: 'system', userName: 'system', ipAddress: '127.0.0.1' };

    let remainingAmount = receipt.amount;

    const account = await AccountsReceivableRepository.getAccountById(schoolId, receipt.receivableAccountId);
    if (!account) {
      throw new Error(`حساب الذمم المدنية غير موجود لسند التحصيل: ${receipt.receivableAccountId}`);
    }

    // Retrieve all unpaid Invoices and Installments for the student
    const invoicesResult = await InvoiceRepository.getAll(schoolId, { studentId: account.studentId });
    const unpaidInvoices = (invoicesResult.data || []).filter(
      inv => inv.status !== 'Paid' && inv.status !== 'Cancelled' && inv.status !== 'Draft'
    );

    const allSchedules = FallbackStorage.getInstallmentSchedules();
    const studentPlans = FallbackStorage.getInstallmentPlans().filter(
      p => p.studentId === account.studentId && p.schoolId === schoolId && p.status === 'Approved'
    );
    const planIds = studentPlans.map(p => p.id);
    const unpaidSchedules = allSchedules.filter(
      s => planIds.includes(s.planId) && s.status !== 'Paid' && s.status !== 'Cancelled'
    );

    // --- STRATEGY PATTERN RESOLUTION ---
    const strategy = await CollectionAllocationStrategyFactory.getStrategy(schoolId, selectedPolicy);
    const { allocations, remainingAmount: finalRemaining } = await strategy.allocate(
      schoolId,
      receipt,
      remainingAmount,
      unpaidInvoices,
      unpaidSchedules,
      account,
      operator,
      manualInstructions
    );

    remainingAmount = finalRemaining;

    // Centralized Subledger Update for student's general AR account
    const totalAllocated = receipt.amount - remainingAmount;
    if (totalAllocated > 0 && selectedPolicy !== 'FIFO' && selectedPolicy !== 'Oldest Due First' && receipt.sourceType !== 'Receivable') {
      const newPaid = (account.totalPaid || 0) + totalAllocated;
      const newOutstanding = Math.max(0, (account.totalOutstanding || 0) - totalAllocated);
      const nextAccStatus = newOutstanding === 0 ? 'Collected' : 'Partially Collected';

      await AccountsReceivableRepository.updateAccount(schoolId, account.id, {
        totalPaid: newPaid,
        totalOutstanding: newOutstanding,
        status: nextAccStatus as any,
        version: account.version
      });

      await AccountsReceivableEngine.syncStudentAccount(schoolId, account.studentId);
    }

    // Update receipt status depending on the remaining balance
    const nextStatus = remainingAmount <= 0 ? 'Allocated' : 'Partially Allocated';
    await CollectionsRepository.updateCollection(schoolId, receipt.id, {
      status: nextStatus,
      notes: receipt.notes ? `${receipt.notes}\n[محرك التوزيع]: تم توزيع المبلغ بنجاح باستخدام سياسة (${selectedPolicy}). المتبقي: ${remainingAmount}.` : `تم توزيع المبلغ بنجاح باستخدام سياسة (${selectedPolicy}). المتبقي: ${remainingAmount}.`
    });

    return allocations;
  }
}
