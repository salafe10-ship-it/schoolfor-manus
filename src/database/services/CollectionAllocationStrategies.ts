import { CollectionReceipt, CollectionAllocation, Invoice, InstallmentSchedule, ReceivableAccount } from '../../types';
import { InvoiceRepository } from '../repositories/InvoiceRepository';
import { CollectionsRepository } from '../repositories/CollectionsRepository';
import { FallbackStorage } from '../repositories/FallbackStorage';
import { InstallmentEngine } from './InstallmentEngine';
import { AccountsReceivableEngine } from './AccountsReceivableEngine';

/**
 * World-Class Strategy Pattern for Collection Allocations
 */
export interface ICollectionAllocationStrategy {
  allocate(
    schoolId: string,
    receipt: CollectionReceipt,
    remainingAmount: number,
    unpaidInvoices: Invoice[],
    unpaidSchedules: InstallmentSchedule[],
    account: ReceivableAccount,
    operator: { userId: string; userName: string; ipAddress: string },
    manualInstructions?: { targetType: 'Invoice' | 'Installment'; targetId: string; amount: number }[]
  ): Promise<{ allocations: CollectionAllocation[]; remainingAmount: number }>;
}

/**
 * Oldest Due First / FIFO Allocation Strategy
 */
export class OldestDueAllocationStrategy implements ICollectionAllocationStrategy {
  public async allocate(
    schoolId: string,
    receipt: CollectionReceipt,
    remainingAmount: number,
    unpaidInvoices: Invoice[],
    unpaidSchedules: InstallmentSchedule[],
    account: ReceivableAccount,
    operator: { userId: string; userName: string; ipAddress: string }
  ): Promise<{ allocations: CollectionAllocation[]; remainingAmount: number }> {
    const allocations: CollectionAllocation[] = [];
    interface AllocatableItem {
      id: string;
      type: 'Invoice' | 'Installment';
      dueDate: string;
      outstanding: number;
      original: any;
    }
    const items: AllocatableItem[] = [];

    for (const inv of unpaidInvoices) {
      const outstanding = inv.remainingAmount !== undefined ? inv.remainingAmount : inv.amount;
      if (outstanding > 0) {
        items.push({
          id: inv.id,
          type: 'Invoice',
          dueDate: inv.dueDate || '',
          outstanding,
          original: inv
        });
      }
    }

    for (const s of unpaidSchedules) {
      const outstanding = (s.amount || 0) - (s.paidAmount || 0);
      if (outstanding > 0) {
        items.push({
          id: s.id,
          type: 'Installment',
          dueDate: s.dueDate || '',
          outstanding,
          original: s
        });
      }
    }

    // Sort items by dueDate ascending (oldest first)
    items.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    for (const item of items) {
      if (remainingAmount <= 0) break;
      const allocateAmount = Math.min(item.outstanding, remainingAmount);
      if (allocateAmount > 0) {
        if (item.type === 'Invoice') {
          const invoice = item.original;
          const updatedRemaining = Math.max(0, item.outstanding - allocateAmount);
          const updatedStatus = updatedRemaining === 0 ? 'Paid' : 'Partially Paid';
          await InvoiceRepository.update(schoolId, invoice.id, {
            remainingAmount: updatedRemaining,
            status: updatedStatus as any
          });

          const alloc = await CollectionsRepository.createCollectionAllocation(schoolId, {
            collectionId: receipt.id,
            targetType: 'Invoice',
            targetId: invoice.id,
            amountAllocated: allocateAmount,
            allocatedBy: operator.userName,
            notes: `توزيع تلقائي (الأقدم استحقاقاً) للفاتورة رقم ${invoice.invoiceNumber}`
          });
          allocations.push(alloc);
        } else {
          const schedule = item.original;
          await InstallmentEngine.applyPayment({
            schoolId,
            planId: schedule.planId,
            scheduleId: schedule.id,
            amount: allocateAmount,
            paymentMethod: receipt.paymentMethod,
            reference: receipt.id,
            type: allocateAmount === item.outstanding ? 'Full' : 'Partial',
            userId: operator.userId,
            userName: operator.userName,
            ipAddress: operator.ipAddress
          });

          const alloc = await CollectionsRepository.createCollectionAllocation(schoolId, {
            collectionId: receipt.id,
            targetType: 'Installment',
            targetId: schedule.id,
            amountAllocated: allocateAmount,
            allocatedBy: operator.userName,
            notes: `توزيع تلقائي (الأقدم استحقاقاً) للقسط رقم ${schedule.installmentNumber}`
          });
          allocations.push(alloc);
        }
        remainingAmount -= allocateAmount;
      }
    }
    return { allocations, remainingAmount };
  }
}

/**
 * Oldest Invoice First Allocation Strategy
 */
export class OldestInvoiceAllocationStrategy implements ICollectionAllocationStrategy {
  public async allocate(
    schoolId: string,
    receipt: CollectionReceipt,
    remainingAmount: number,
    unpaidInvoices: Invoice[],
    unpaidSchedules: InstallmentSchedule[],
    account: ReceivableAccount,
    operator: { userId: string; userName: string; ipAddress: string }
  ): Promise<{ allocations: CollectionAllocation[]; remainingAmount: number }> {
    const allocations: CollectionAllocation[] = [];
    const sortedInvoices = [...unpaidInvoices].sort((a, b) => {
      const dateA = a.invoiceDate || a.createdAt || '';
      const dateB = b.invoiceDate || b.createdAt || '';
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

    for (const invoice of sortedInvoices) {
      if (remainingAmount <= 0) break;
      const outstanding = invoice.remainingAmount !== undefined ? invoice.remainingAmount : invoice.amount;
      const allocateAmount = Math.min(outstanding, remainingAmount);
      if (allocateAmount > 0) {
        const updatedRemaining = Math.max(0, outstanding - allocateAmount);
        const updatedStatus = updatedRemaining === 0 ? 'Paid' : 'Partially Paid';
        await InvoiceRepository.update(schoolId, invoice.id, {
          remainingAmount: updatedRemaining,
          status: updatedStatus as any
        });

        const alloc = await CollectionsRepository.createCollectionAllocation(schoolId, {
          collectionId: receipt.id,
          targetType: 'Invoice',
          targetId: invoice.id,
          amountAllocated: allocateAmount,
          allocatedBy: operator.userName,
          notes: `توزيع تلقائي (الفاتورة الأقدم) للفاتورة رقم ${invoice.invoiceNumber}`
        });
        allocations.push(alloc);
        remainingAmount -= allocateAmount;
      }
    }
    return { allocations, remainingAmount };
  }
}

/**
 * Oldest Installment First Allocation Strategy
 */
export class OldestInstallmentAllocationStrategy implements ICollectionAllocationStrategy {
  public async allocate(
    schoolId: string,
    receipt: CollectionReceipt,
    remainingAmount: number,
    unpaidInvoices: Invoice[],
    unpaidSchedules: InstallmentSchedule[],
    account: ReceivableAccount,
    operator: { userId: string; userName: string; ipAddress: string }
  ): Promise<{ allocations: CollectionAllocation[]; remainingAmount: number }> {
    const allocations: CollectionAllocation[] = [];
    const sortedSchedules = [...unpaidSchedules].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    for (const schedule of sortedSchedules) {
      if (remainingAmount <= 0) break;
      const outstanding = (schedule.amount || 0) - (schedule.paidAmount || 0);
      const allocateAmount = Math.min(outstanding, remainingAmount);
      if (allocateAmount > 0) {
        await InstallmentEngine.applyPayment({
          schoolId,
          planId: schedule.planId,
          scheduleId: schedule.id,
          amount: allocateAmount,
          paymentMethod: receipt.paymentMethod,
          reference: receipt.id,
          type: allocateAmount === outstanding ? 'Full' : 'Partial',
          userId: operator.userId,
          userName: operator.userName,
          ipAddress: operator.ipAddress
        });

        const alloc = await CollectionsRepository.createCollectionAllocation(schoolId, {
          collectionId: receipt.id,
          targetType: 'Installment',
          targetId: schedule.id,
          amountAllocated: allocateAmount,
          allocatedBy: operator.userName,
          notes: `توزيع تلقائي (القسط الأقدم) للقسط رقم ${schedule.installmentNumber}`
        });
        allocations.push(alloc);
        remainingAmount -= allocateAmount;
      }
    }
    return { allocations, remainingAmount };
  }
}

/**
 * Specific Invoice Allocation Strategy
 */
export class SpecificInvoiceAllocationStrategy implements ICollectionAllocationStrategy {
  public async allocate(
    schoolId: string,
    receipt: CollectionReceipt,
    remainingAmount: number,
    unpaidInvoices: Invoice[],
    unpaidSchedules: InstallmentSchedule[],
    account: ReceivableAccount,
    operator: { userId: string; userName: string; ipAddress: string }
  ): Promise<{ allocations: CollectionAllocation[]; remainingAmount: number }> {
    const allocations: CollectionAllocation[] = [];
    const targetInvoiceId = receipt.sourceId;
    if (!targetInvoiceId) {
      throw new Error(`سياسة التوزيع لفاتورة محددة تتطلب تحديد الفاتورة المرجعية بالسند.`);
    }
    const invoice = await InvoiceRepository.getById(schoolId, targetInvoiceId);
    if (!invoice) {
      throw new Error(`الفاتورة المحددة غير موجودة: ${targetInvoiceId}`);
    }
    const outstanding = invoice.remainingAmount !== undefined ? invoice.remainingAmount : invoice.amount;
    const allocateAmount = Math.min(outstanding, remainingAmount);
    if (allocateAmount > 0) {
      const updatedRemaining = Math.max(0, outstanding - allocateAmount);
      const updatedStatus = updatedRemaining === 0 ? 'Paid' : 'Partially Paid';
      await InvoiceRepository.update(schoolId, invoice.id, {
        remainingAmount: updatedRemaining,
        status: updatedStatus as any
      });

      const alloc = await CollectionsRepository.createCollectionAllocation(schoolId, {
        collectionId: receipt.id,
        targetType: 'Invoice',
        targetId: invoice.id,
        amountAllocated: allocateAmount,
        allocatedBy: operator.userName,
        notes: `توزيع مخصص للفاتورة رقم ${invoice.invoiceNumber}`
      });
      allocations.push(alloc);
      remainingAmount -= allocateAmount;
    }
    return { allocations, remainingAmount };
  }
}

/**
 * Specific Installment Allocation Strategy
 */
export class SpecificInstallmentAllocationStrategy implements ICollectionAllocationStrategy {
  public async allocate(
    schoolId: string,
    receipt: CollectionReceipt,
    remainingAmount: number,
    unpaidInvoices: Invoice[],
    unpaidSchedules: InstallmentSchedule[],
    account: ReceivableAccount,
    operator: { userId: string; userName: string; ipAddress: string }
  ): Promise<{ allocations: CollectionAllocation[]; remainingAmount: number }> {
    const allocations: CollectionAllocation[] = [];
    const targetSchedId = receipt.sourceId;
    if (!targetSchedId) {
      throw new Error(`سياسة التوزيع لقسط محدد تتطلب تحديد القسط المرجعي بالسند.`);
    }
    const schedule = FallbackStorage.getInstallmentSchedules().find(s => s.id === targetSchedId);
    if (!schedule) {
      throw new Error(`القسط المحدد غير موجود: ${targetSchedId}`);
    }
    const outstanding = (schedule.amount || 0) - (schedule.paidAmount || 0);
    const allocateAmount = Math.min(outstanding, remainingAmount);
    if (allocateAmount > 0) {
      await InstallmentEngine.applyPayment({
        schoolId,
        planId: schedule.planId,
        scheduleId: schedule.id,
        amount: allocateAmount,
        paymentMethod: receipt.paymentMethod,
        reference: receipt.id,
        type: allocateAmount === outstanding ? 'Full' : 'Partial',
        userId: operator.userId,
        userName: operator.userName,
        ipAddress: operator.ipAddress
      });

      const alloc = await CollectionsRepository.createCollectionAllocation(schoolId, {
        collectionId: receipt.id,
        targetType: 'Installment',
        targetId: schedule.id,
        amountAllocated: allocateAmount,
        allocatedBy: operator.userName,
        notes: `توزيع مخصص للقسط رقم ${schedule.installmentNumber}`
      });
      allocations.push(alloc);
      remainingAmount -= allocateAmount;
    }
    return { allocations, remainingAmount };
  }
}

/**
 * Proportional Allocation Strategy
 */
export class ProportionalAllocationStrategy implements ICollectionAllocationStrategy {
  public async allocate(
    schoolId: string,
    receipt: CollectionReceipt,
    remainingAmount: number,
    unpaidInvoices: Invoice[],
    unpaidSchedules: InstallmentSchedule[],
    account: ReceivableAccount,
    operator: { userId: string; userName: string; ipAddress: string }
  ): Promise<{ allocations: CollectionAllocation[]; remainingAmount: number }> {
    const allocations: CollectionAllocation[] = [];
    interface PropItem {
      id: string;
      type: 'Invoice' | 'Installment';
      outstanding: number;
      original: any;
    }
    const propItems: PropItem[] = [];
    let totalOutstanding = 0;

    for (const inv of unpaidInvoices) {
      const outstanding = inv.remainingAmount !== undefined ? inv.remainingAmount : inv.amount;
      if (outstanding > 0) {
        propItems.push({ id: inv.id, type: 'Invoice', outstanding, original: inv });
        totalOutstanding += outstanding;
      }
    }

    for (const s of unpaidSchedules) {
      const outstanding = (s.amount || 0) - (s.paidAmount || 0);
      if (outstanding > 0) {
        propItems.push({ id: s.id, type: 'Installment', outstanding, original: s });
        totalOutstanding += outstanding;
      }
    }

    if (totalOutstanding > 0) {
      let distributedSum = 0;
      const originalReceiptAmount = receipt.amount;

      for (let idx = 0; idx < propItems.length; idx++) {
        const item = propItems[idx];
        let allocToItem = 0;
        if (idx === propItems.length - 1) {
          allocToItem = Math.min(item.outstanding, originalReceiptAmount - distributedSum);
        } else {
          const share = Math.floor(originalReceiptAmount * (item.outstanding / totalOutstanding));
          allocToItem = Math.min(item.outstanding, share);
        }

        if (allocToItem > 0) {
          if (item.type === 'Invoice') {
            const invoice = item.original;
            const updatedRemaining = Math.max(0, item.outstanding - allocToItem);
            const updatedStatus = updatedRemaining === 0 ? 'Paid' : 'Partially Paid';
            await InvoiceRepository.update(schoolId, invoice.id, {
              remainingAmount: updatedRemaining,
              status: updatedStatus as any
            });

            const alloc = await CollectionsRepository.createCollectionAllocation(schoolId, {
              collectionId: receipt.id,
              targetType: 'Invoice',
              targetId: invoice.id,
              amountAllocated: allocToItem,
              allocatedBy: operator.userName,
              notes: `توزيع نسبي للفاتورة رقم ${invoice.invoiceNumber}`
            });
            allocations.push(alloc);
          } else {
            const schedule = item.original;
            await InstallmentEngine.applyPayment({
              schoolId,
              planId: schedule.planId,
              scheduleId: schedule.id,
              amount: allocToItem,
              paymentMethod: receipt.paymentMethod,
              reference: receipt.id,
              type: allocToItem === item.outstanding ? 'Full' : 'Partial',
              userId: operator.userId,
              userName: operator.userName,
              ipAddress: operator.ipAddress
            });

            const alloc = await CollectionsRepository.createCollectionAllocation(schoolId, {
              collectionId: receipt.id,
              targetType: 'Installment',
              targetId: schedule.id,
              amountAllocated: allocToItem,
              allocatedBy: operator.userName,
              notes: `توزيع نسبي للقسط رقم ${schedule.installmentNumber}`
            });
            allocations.push(alloc);
          }
          distributedSum += allocToItem;
          remainingAmount -= allocToItem;
        }
      }
    }
    return { allocations, remainingAmount };
  }
}

/**
 * Manual Allocation Strategy
 */
export class ManualAllocationStrategy implements ICollectionAllocationStrategy {
  public async allocate(
    schoolId: string,
    receipt: CollectionReceipt,
    remainingAmount: number,
    unpaidInvoices: Invoice[],
    unpaidSchedules: InstallmentSchedule[],
    account: ReceivableAccount,
    operator: { userId: string; userName: string; ipAddress: string },
    manualInstructions?: { targetType: 'Invoice' | 'Installment'; targetId: string; amount: number }[]
  ): Promise<{ allocations: CollectionAllocation[]; remainingAmount: number }> {
    const allocations: CollectionAllocation[] = [];
    if (!manualInstructions || manualInstructions.length === 0) {
      throw new Error(`خطأ توزيع يدوي: يجب توفير تعليمات التوزيع اليدوي مع سياسة التوزيع اليدوي.`);
    }

    const totalRequestedAlloc = manualInstructions.reduce((sum, inst) => sum + inst.amount, 0);
    if (totalRequestedAlloc > receipt.amount) {
      throw new Error(`خطأ توزيع يدوي: مجموع المبالغ الموزعة يدوياً (${totalRequestedAlloc}) يتجاوز مبلغ سند التحصيل (${receipt.amount}).`);
    }

    for (const inst of manualInstructions) {
      if (inst.amount <= 0) continue;
      if (inst.targetType === 'Invoice') {
        const invoice = await InvoiceRepository.getById(schoolId, inst.targetId);
        if (!invoice) {
          throw new Error(`توزيع يدوي: الفاتورة المستهدفة غير موجودة بالنظام: ${inst.targetId}`);
        }
        const outstanding = invoice.remainingAmount !== undefined ? invoice.remainingAmount : invoice.amount;
        if (inst.amount > outstanding) {
          throw new Error(`توزيع يدوي: المبلغ المخصص للفاتورة (${inst.amount}) يتجاوز المتبقي المستحق عليها (${outstanding}).`);
        }

        const updatedRemaining = Math.max(0, outstanding - inst.amount);
        const updatedStatus = updatedRemaining === 0 ? 'Paid' : 'Partially Paid';
        await InvoiceRepository.update(schoolId, invoice.id, {
          remainingAmount: updatedRemaining,
          status: updatedStatus as any
        });

        const alloc = await CollectionsRepository.createCollectionAllocation(schoolId, {
          collectionId: receipt.id,
          targetType: 'Invoice',
          targetId: invoice.id,
          amountAllocated: inst.amount,
          allocatedBy: operator.userName,
          notes: `توزيع يدوي مخصص للفاتورة رقم ${invoice.invoiceNumber}`
        });
        allocations.push(alloc);
        remainingAmount -= inst.amount;
      } else if (inst.targetType === 'Installment') {
        const schedule = FallbackStorage.getInstallmentSchedules().find(s => s.id === inst.targetId);
        if (!schedule) {
          throw new Error(`توزيع يدوي: القسط المستهدف غير موجود بالنظام: ${inst.targetId}`);
        }
        const outstanding = (schedule.amount || 0) - (schedule.paidAmount || 0);
        if (inst.amount > outstanding) {
          throw new Error(`توزيع يدوي: المبلغ المخصص للقسط (${inst.amount}) يتجاوز المتبقي المستحق عليه (${outstanding}).`);
        }

        await InstallmentEngine.applyPayment({
          schoolId,
          planId: schedule.planId,
          scheduleId: schedule.id,
          amount: inst.amount,
          paymentMethod: receipt.paymentMethod,
          reference: receipt.id,
          type: inst.amount === outstanding ? 'Full' : 'Partial',
          userId: operator.userId,
          userName: operator.userName,
          ipAddress: operator.ipAddress
        });

        const alloc = await CollectionsRepository.createCollectionAllocation(schoolId, {
          collectionId: receipt.id,
          targetType: 'Installment',
          targetId: schedule.id,
          amountAllocated: inst.amount,
          allocatedBy: operator.userName,
          notes: `توزيع يدوي مخصص للقسط رقم ${schedule.installmentNumber}`
        });
        allocations.push(alloc);
        remainingAmount -= inst.amount;
      }
    }
    return { allocations, remainingAmount };
  }
}

/**
 * Customer Preference Allocation Strategy
 */
export class CustomerPreferenceAllocationStrategy implements ICollectionAllocationStrategy {
  public async allocate(
    schoolId: string,
    receipt: CollectionReceipt,
    remainingAmount: number,
    unpaidInvoices: Invoice[],
    unpaidSchedules: InstallmentSchedule[],
    account: ReceivableAccount,
    operator: { userId: string; userName: string; ipAddress: string }
  ): Promise<{ allocations: CollectionAllocation[]; remainingAmount: number }> {
    const allocations: CollectionAllocation[] = [];
    const preferences = account.notes || '';
    const prefersInstallmentsFirst = preferences.includes('أقساط أولاً') || preferences.includes('installments_first');
    
    interface PrefItem {
      id: string;
      type: 'Invoice' | 'Installment';
      dueDate: string;
      outstanding: number;
      original: any;
    }
    const prefItems: PrefItem[] = [];

    for (const inv of unpaidInvoices) {
      const outstanding = inv.remainingAmount !== undefined ? inv.remainingAmount : inv.amount;
      if (outstanding > 0) {
        prefItems.push({
          id: inv.id,
          type: 'Invoice',
          dueDate: inv.dueDate || '',
          outstanding,
          original: inv
        });
      }
    }

    for (const s of unpaidSchedules) {
      const outstanding = (s.amount || 0) - (s.paidAmount || 0);
      if (outstanding > 0) {
        prefItems.push({
          id: s.id,
          type: 'Installment',
          dueDate: s.dueDate || '',
          outstanding,
          original: s
        });
      }
    }

    prefItems.sort((a, b) => {
      if (prefersInstallmentsFirst) {
        if (a.type !== b.type) {
          return a.type === 'Installment' ? -1 : 1;
        }
      } else {
        if (a.type !== b.type) {
          return a.type === 'Invoice' ? -1 : 1;
        }
      }
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    for (const item of prefItems) {
      if (remainingAmount <= 0) break;
      const allocateAmount = Math.min(item.outstanding, remainingAmount);
      if (allocateAmount > 0) {
        if (item.type === 'Invoice') {
          const invoice = item.original;
          const updatedRemaining = Math.max(0, item.outstanding - allocateAmount);
          const updatedStatus = updatedRemaining === 0 ? 'Paid' : 'Partially Paid';
          await InvoiceRepository.update(schoolId, invoice.id, {
            remainingAmount: updatedRemaining,
            status: updatedStatus as any
          });

          const alloc = await CollectionsRepository.createCollectionAllocation(schoolId, {
            collectionId: receipt.id,
            targetType: 'Invoice',
            targetId: invoice.id,
            amountAllocated: allocateAmount,
            allocatedBy: operator.userName,
            notes: `توزيع تفضيل العميل (فواتير أولاً) للفاتورة رقم ${invoice.invoiceNumber}`
          });
          allocations.push(alloc);
        } else {
          const schedule = item.original;
          await InstallmentEngine.applyPayment({
            schoolId,
            planId: schedule.planId,
            scheduleId: schedule.id,
            amount: allocateAmount,
            paymentMethod: receipt.paymentMethod,
            reference: receipt.id,
            type: allocateAmount === item.outstanding ? 'Full' : 'Partial',
            userId: operator.userId,
            userName: operator.userName,
            ipAddress: operator.ipAddress
          });

          const alloc = await CollectionsRepository.createCollectionAllocation(schoolId, {
            collectionId: receipt.id,
            targetType: 'Installment',
            targetId: schedule.id,
            amountAllocated: allocateAmount,
            allocatedBy: operator.userName,
            notes: `توزيع تفضيل العميل (أقساط أولاً) للقسط رقم ${schedule.installmentNumber}`
          });
          allocations.push(alloc);
        }
        remainingAmount -= allocateAmount;
      }
    }
    return { allocations, remainingAmount };
  }
}

/**
 * Fallback General Receivable Allocation Strategy (Case C)
 */
export class FallbackReceivableAllocationStrategy implements ICollectionAllocationStrategy {
  public async allocate(
    schoolId: string,
    receipt: CollectionReceipt,
    remainingAmount: number,
    unpaidInvoices: Invoice[],
    unpaidSchedules: InstallmentSchedule[],
    account: ReceivableAccount,
    operator: { userId: string; userName: string; ipAddress: string }
  ): Promise<{ allocations: CollectionAllocation[]; remainingAmount: number }> {
    const allocations: CollectionAllocation[] = [];
    await AccountsReceivableEngine.processReceivableCollection(
      schoolId,
      account.studentId,
      receipt.id,
      remainingAmount,
      {
        userId: operator.userId,
        userName: operator.userName,
        userRole: 'Accountant',
        ipAddress: operator.ipAddress
      }
    );

    const alloc = await CollectionsRepository.createCollectionAllocation(schoolId, {
      collectionId: receipt.id,
      targetType: 'Receivable',
      targetId: account.id,
      amountAllocated: remainingAmount,
      allocatedBy: operator.userName,
      notes: 'تسوية وتوزيع على ذمة الطالب العامة (FIFO)'
    });
    allocations.push(alloc);
    return { allocations, remainingAmount: 0 };
  }
}
