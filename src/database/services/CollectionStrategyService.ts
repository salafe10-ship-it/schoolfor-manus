import { CollectionCase, CollectionPromise, ReceivableAccount } from '../../types';
import { AccountsReceivableRepository } from '../repositories/AccountsReceivableRepository';
import { AgingEngine } from './AgingEngine';

export type CollectionActionType = 
  | 'Friendly Reminder'
  | 'SMS'
  | 'Email'
  | 'WhatsApp'
  | 'Collection Call'
  | 'Legal Notice'
  | 'Payment Promise'
  | 'Installment Renegotiation';

/**
 * Enterprise Collection Strategy Service
 * Governs collection policies, overdue recovery workflows, parent payment promises,
 * and installment renegotiation policies.
 */
export class CollectionStrategyService {

  /**
   * Evaluates the recommended action based on the number of days past due.
   */
  public static getRecommendedAction(daysPastDue: number): { action: CollectionActionType; description: string; gravity: 'low' | 'medium' | 'high' | 'critical' } {
    if (daysPastDue <= 0) {
      return {
        action: 'Friendly Reminder',
        description: 'تذكير ودّي قبل الاستحقاق أو في يوم الاستحقاق.',
        gravity: 'low'
      };
    } else if (daysPastDue >= 1 && daysPastDue <= 15) {
      return {
        action: 'SMS',
        description: 'إرسال رسالة نصية قصيرة SMS تذكيرية أولى بالسداد لتفادي فرض غرامات أو وقف الخدمات.',
        gravity: 'low'
      };
    } else if (daysPastDue >= 16 && daysPastDue <= 30) {
      return {
        action: 'Email',
        description: 'إرسال بريد إلكتروني رسمي يحتوي على تفاصيل المطالبة المالية وروابط الدفع الفوري.',
        gravity: 'medium'
      };
    } else if (daysPastDue >= 31 && daysPastDue <= 45) {
      return {
        action: 'WhatsApp',
        description: 'تواصل مباشر عبر قناة الواتساب الرسمية للمدرسة لضمان استلام وقراءة الإخطار.',
        gravity: 'medium'
      };
    } else if (daysPastDue >= 46 && daysPastDue <= 60) {
      return {
        action: 'Collection Call',
        description: 'إجراء مكالمة هاتفية مباشرة من وحدة التحصيل لتسجيل أسباب التأخر والاتفاق على موعد دفع.',
        gravity: 'high'
      };
    } else if (daysPastDue >= 61 && daysPastDue <= 75) {
      return {
        action: 'Payment Promise',
        description: 'أخذ تعهد دفع رسمي وجدولة تاريخ الالتزام بالسداد.',
        gravity: 'high'
      };
    } else if (daysPastDue >= 76 && daysPastDue <= 90) {
      return {
        action: 'Installment Renegotiation',
        description: 'إعادة جدولة الأقساط المتعثرة بالشراكة مع الإدارة المالية للتسهيل على ولي الأمر.',
        gravity: 'high'
      };
    } else {
      return {
        action: 'Legal Notice',
        description: 'إرسال إنذار قانوني نهائي وإحالة الملف للمستشار القانوني للمؤسسة.',
        gravity: 'critical'
      };
    }
  }

  /**
   * Initiates or retrieves a Collection Case for an overdue account.
   */
  public static async initiateCollectionCase(
    schoolId: string,
    accountId: string,
    auditContext: { userId: string; userName: string }
  ): Promise<CollectionCase> {
    const account = await AccountsReceivableRepository.getAccountById(schoolId, accountId);
    if (!account) {
      throw new Error(`حساب الذمم غير موجود: ${accountId}`);
    }

    let existingCase = await AccountsReceivableRepository.getCollectionCaseByAccountId(schoolId, accountId);
    if (existingCase) {
      return existingCase;
    }

    // Determine overdue amount
    const overdueAmount = account.totalOutstanding;

    const newCase = await AccountsReceivableRepository.createCollectionCase(schoolId, {
      receivableAccountId: accountId,
      status: 'open',
      assignedTo: 'فريق التحصيل المركزي',
      totalOverdueAmount: overdueAmount,
      notes: `تم فتح ملف تحصيل تلقائياً نظراً لوجود مبالغ مستحقة غير مدفوعة بقيمة ${overdueAmount} ${account.currency}`
    });

    await AccountsReceivableRepository.logAudit(schoolId, {
      userId: auditContext.userId,
      userName: auditContext.userName,
      action: 'INITIATE_COLLECTION_CASE',
      entityType: 'CollectionCase',
      entityId: newCase.id,
      details: `تم إنشاء ملف تحصيل رقم ${newCase.caseNumber} للذمة المالية ${accountId}.`
    });

    return newCase;
  }

  /**
   * Evaluates the current collection step based on actual aging.
   */
  public static async evaluateCollectionStep(
    schoolId: string,
    caseId: string,
    auditContext: { userId: string; userName: string }
  ): Promise<{ case: CollectionCase; recommendedAction: CollectionActionType; actionDetails: string }> {
    const colCase = await AccountsReceivableRepository.getCollectionCaseById(schoolId, caseId);
    if (!colCase) {
      throw new Error(`ملف التحصيل غير موجود: ${caseId}`);
    }

    const account = await AccountsReceivableRepository.getAccountById(schoolId, colCase.receivableAccountId);
    if (!account) {
      throw new Error(`الحساب المالي المرتبط بالتحصيل غير موجود: ${colCase.receivableAccountId}`);
    }

    // Get worst-case aging buckets
    const agingBuckets = await AgingEngine.calculateAgingForAccount(schoolId, colCase.receivableAccountId);
    
    // Find highest overdue bucket
    let maxOverdueDays = 0;
    if (agingBuckets.some(b => b.bucketName === '120+ Days' && b.amount > 0)) maxOverdueDays = 125;
    else if (agingBuckets.some(b => b.bucketName === '91-120 Days' && b.amount > 0)) maxOverdueDays = 100;
    else if (agingBuckets.some(b => b.bucketName === '61-90 Days' && b.amount > 0)) maxOverdueDays = 75;
    else if (agingBuckets.some(b => b.bucketName === '31-60 Days' && b.amount > 0)) maxOverdueDays = 45;
    else if (agingBuckets.some(b => b.bucketName === '1-30 Days' && b.amount > 0)) maxOverdueDays = 15;

    const recommendation = this.getRecommendedAction(maxOverdueDays);

    // Update case with recommendation notes
    const updatedCase = await AccountsReceivableRepository.updateCollectionCase(schoolId, caseId, {
      totalOverdueAmount: account.totalOutstanding,
      nextActionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
      notes: colCase.notes + `\n[تحديث تلقائي]: الإجراء الموصى به الحالي هو: ${recommendation.action}. الوصف: ${recommendation.description}`
    });

    await AccountsReceivableRepository.logAudit(schoolId, {
      userId: auditContext.userId,
      userName: auditContext.userName,
      action: 'EVALUATE_COLLECTION_STEP',
      entityType: 'CollectionCase',
      entityId: caseId,
      details: `تم تقييم حالة التحصيل والتوصل إلى التوصية بالإجراء: ${recommendation.action}`
    });

    return {
      case: updatedCase,
      recommendedAction: recommendation.action,
      actionDetails: recommendation.description
    };
  }

  /**
   * Records a payment promise from a parent.
   */
  public static async recordPaymentPromise(
    schoolId: string,
    caseId: string,
    promiseAmount: number,
    promisedDate: string,
    auditContext: { userId: string; userName: string }
  ): Promise<CollectionPromise> {
    const colCase = await AccountsReceivableRepository.getCollectionCaseById(schoolId, caseId);
    if (!colCase) {
      throw new Error(`ملف التحصيل غير موجود: ${caseId}`);
    }

    const promise = await AccountsReceivableRepository.createPromise(schoolId, {
      collectionCaseId: caseId,
      receivableAccountId: colCase.receivableAccountId,
      promiseAmount: promiseAmount,
      promisedDate: promisedDate,
      status: 'pending',
      recordedBy: auditContext.userName
    });

    await AccountsReceivableRepository.updateCollectionCase(schoolId, caseId, {
      status: 'active',
      notes: colCase.notes + `\n[تعهد سداد]: تعهد ولي الأمر بدفع مبلغ ${promiseAmount} بتاريخ ${promisedDate}`
    });

    await AccountsReceivableRepository.logAudit(schoolId, {
      userId: auditContext.userId,
      userName: auditContext.userName,
      action: 'RECORD_PAYMENT_PROMISE',
      entityType: 'CollectionCase',
      entityId: caseId,
      details: `تسجيل وعد دفع بقيمة ${promiseAmount} لتاريخ ${promisedDate}`
    });

    return promise;
  }

  /**
   * Updates promise status and triggers collections state machine logic.
   */
  public static async updatePromiseStatus(
    schoolId: string,
    promiseId: string,
    status: 'kept' | 'broken' | 'cancelled',
    auditContext: { userId: string; userName: string }
  ): Promise<CollectionPromise> {
    const promise = await AccountsReceivableRepository.updatePromiseStatus(schoolId, promiseId, status);
    
    if (status === 'broken') {
      // Escalate collection case status
      const colCase = await AccountsReceivableRepository.getCollectionCaseById(schoolId, promise.collectionCaseId);
      if (colCase) {
        await AccountsReceivableRepository.updateCollectionCase(schoolId, colCase.id, {
          status: 'escalated',
          notes: colCase.notes + `\n[مخالفة]: نكث ولي الأمر بوعد السداد المستحق بتاريخ ${promise.promisedDate} بقيمة ${promise.promiseAmount}. تصعيد فوري للملف.`
        });

        // Log critical audit
        await AccountsReceivableRepository.logAudit(schoolId, {
          userId: auditContext.userId,
          userName: auditContext.userName,
          action: 'BROKEN_PROMISE_ESCALATION',
          entityType: 'CollectionCase',
          entityId: colCase.id,
          details: `تصعيد تلقائي لقضية التحصيل رقم ${colCase.caseNumber} بسبب الإخلال بوعد السداد.`
        });
      }
    }

    return promise;
  }
}
