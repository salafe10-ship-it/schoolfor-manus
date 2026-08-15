import { CollectionStatus } from '../../types';
import { CollectionDomainException } from './CollectionDomainRules';
import { CollectionsRepository } from '../repositories/CollectionsRepository';

export class CollectionStateMachine {

  private static readonly VALID_TRANSITIONS: Record<CollectionStatus, CollectionStatus[]> = {
    'Draft': ['Pending Approval', 'Cancelled'],
    'Pending Approval': ['Approved', 'Cancelled'],
    'Approved': ['Collected', 'Partially Allocated', 'Allocated', 'Cancelled'],
    'Collected': ['Partially Allocated', 'Allocated', 'Cancelled', 'Reversed'],
    'Partially Allocated': ['Allocated', 'Reversed', 'Cancelled'],
    'Allocated': ['Deposited', 'Refunded', 'Reversed', 'Archived'],
    'Deposited': ['Reconciled', 'Reversed', 'Archived'],
    'Reconciled': ['Archived'],
    'Cancelled': ['Archived'],
    'Refunded': ['Archived'],
    'Reversed': ['Archived'],
    'Archived': [] // Terminal state
  };

  /**
   * Validates if a state transition is legal under ERP compliance rules.
   */
  public static validateTransition(from: CollectionStatus, to: CollectionStatus): void {
    if (from === to) return;

    const allowed = this.VALID_TRANSITIONS[from];
    if (!allowed || !allowed.includes(to)) {
      throw new CollectionDomainException(
        `خطأ حوكمة دورة حياة التحصيل: لا يمكن تغيير حالة سند التحصيل من (${from}) إلى (${to}). انتقال غير مسموح به.`,
        'INVALID_COLLECTION_STATUS_TRANSITION'
      );
    }
  }

  /**
   * Transitions a collection receipt to a new target status within a transaction.
   */
  public static async transitionCollection(
    schoolId: string,
    collectionId: string,
    targetStatus: CollectionStatus,
    reason: string,
    operatorName: string
  ): Promise<any> {
    const receipt = await CollectionsRepository.getCollectionById(schoolId, collectionId);
    if (!receipt) {
      throw new Error(`مستند التحصيل غير موجود: ${collectionId}`);
    }

    const originalStatus = receipt.status;
    this.validateTransition(originalStatus, targetStatus);

    const updated = await CollectionsRepository.updateCollection(schoolId, collectionId, {
      status: targetStatus,
      notes: receipt.notes ? `${receipt.notes}\n[تحديث الحالة]: تم التغيير إلى ${targetStatus} بواسطة ${operatorName}. السبب: ${reason}` : `تم التغيير إلى ${targetStatus} بواسطة ${operatorName}. السبب: ${reason}`,
      version: receipt.version
    });

    return updated;
  }
}
