import { FallbackStorage } from './FallbackStorage';
import { UnitOfWork } from '../UnitOfWork';
import { CollectionReceipt, CollectionAllocation, CollectionStatus } from '../../types';

/**
 * Enterprise Collections Repository (DAL)
 * Handles all CRUD and query operations for collections and allocations.
 * Implements strict Tenant Isolation, Optimistic Locking, and UnitOfWork transaction integration.
 */
export class CollectionsRepository {

  // =========================================================================
  // 1. CollectionReceipt DAL Operations
  // =========================================================================

  public static async getCollectionById(schoolId: string, id: string): Promise<CollectionReceipt | null> {
    let receipts = FallbackStorage.getCollectionReceipts();
    if (UnitOfWork.isTransactionActive()) {
      receipts = UnitOfWork.getPendingAll('collection_receipts', receipts);
    }
    const receipt = receipts.find(r => r.id === id);
    if (!receipt) return null;

    if (receipt.schoolId !== schoolId) {
      throw new Error('حظر أمني للمستأجر: لا يمكن الوصول لعملية تحصيل لجهة أخرى.');
    }
    return receipt;
  }

  public static async getCollectionsByAccountId(schoolId: string, accountId: string): Promise<CollectionReceipt[]> {
    let receipts = FallbackStorage.getCollectionReceipts();
    if (UnitOfWork.isTransactionActive()) {
      receipts = UnitOfWork.getPendingAll('collection_receipts', receipts);
    }
    return receipts.filter(r => r.schoolId === schoolId && r.receivableAccountId === accountId);
  }

  public static async getAllCollections(schoolId: string, options?: { status?: CollectionStatus }): Promise<CollectionReceipt[]> {
    let receipts = FallbackStorage.getCollectionReceipts();
    if (UnitOfWork.isTransactionActive()) {
      receipts = UnitOfWork.getPendingAll('collection_receipts', receipts);
    }
    let filtered = receipts.filter(r => r.schoolId === schoolId);
    if (options?.status) {
      filtered = filtered.filter(r => r.status === options.status);
    }
    return filtered;
  }

  public static async createCollection(schoolId: string, collection: Partial<CollectionReceipt>): Promise<CollectionReceipt> {
    let receipts = FallbackStorage.getCollectionReceipts();
    if (UnitOfWork.isTransactionActive()) {
      receipts = UnitOfWork.getPendingAll('collection_receipts', receipts);
    }

    const newReceipt: CollectionReceipt = {
      id: collection.id || `coll_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      schoolId: schoolId,
      receivableAccountId: collection.receivableAccountId || '',
      sourceType: collection.sourceType || 'Receivable',
      sourceId: collection.sourceId,
      amount: collection.amount || 0,
      paymentMethod: collection.paymentMethod || 'Cash',
      paymentMethodDetails: collection.paymentMethodDetails,
      status: collection.status || 'Draft',
      currency: collection.currency || 'LYD',
      exchangeRate: collection.exchangeRate || 1,
      collectedAt: collection.collectedAt || new Date().toISOString(),
      collectedBy: collection.collectedBy || 'system',
      approvedAt: collection.approvedAt,
      approvedBy: collection.approvedBy,
      notes: collection.notes,
      version: 1,
      createdAt: new Date().toISOString(),
      createdBy: collection.createdBy || 'system'
    };

    if (UnitOfWork.isTransactionActive()) {
      UnitOfWork.enlistCreate('collection_receipts', newReceipt.id, newReceipt);
      return newReceipt;
    }

    receipts.push(newReceipt);
    FallbackStorage.saveCollectionReceipts(receipts);
    return newReceipt;
  }

  public static async updateCollection(
    schoolId: string,
    id: string,
    updates: Partial<CollectionReceipt>
  ): Promise<CollectionReceipt> {
    let receipts = FallbackStorage.getCollectionReceipts();
    if (UnitOfWork.isTransactionActive()) {
      receipts = UnitOfWork.getPendingAll('collection_receipts', receipts);
    }

    const existingIndex = receipts.findIndex(r => r.id === id && r.schoolId === schoolId);
    if (existingIndex === -1) {
      throw new Error(`حركة التحصيل المطلوبة غير موجودة: ${id}`);
    }

    const existing = receipts[existingIndex];

    // Optimistic Locking validation
    if (updates.version !== undefined && existing.version !== updates.version) {
      throw new Error('حدث تعارض أثناء التحديث (Optimistic Locking). يرجى إعادة المحاولة.');
    }

    const updatedReceipt: CollectionReceipt = {
      ...existing,
      ...updates,
      version: existing.version + 1
    };

    if (UnitOfWork.isTransactionActive()) {
      UnitOfWork.enlistUpdate('collection_receipts', id, updatedReceipt);
      return updatedReceipt;
    }

    receipts[existingIndex] = updatedReceipt;
    FallbackStorage.saveCollectionReceipts(receipts);
    return updatedReceipt;
  }

  // =========================================================================
  // 2. CollectionAllocation DAL Operations
  // =========================================================================

  public static async getCollectionAllocationsByCollectionId(schoolId: string, collectionId: string): Promise<CollectionAllocation[]> {
    let allocations = FallbackStorage.getCollectionAllocations();
    if (UnitOfWork.isTransactionActive()) {
      allocations = UnitOfWork.getPendingAll('collection_allocations', allocations);
    }
    return allocations.filter(a => a.schoolId === schoolId && a.collectionId === collectionId);
  }

  public static async createCollectionAllocation(schoolId: string, allocation: Partial<CollectionAllocation>): Promise<CollectionAllocation> {
    let allocations = FallbackStorage.getCollectionAllocations();
    if (UnitOfWork.isTransactionActive()) {
      allocations = UnitOfWork.getPendingAll('collection_allocations', allocations);
    }

    const newAllocation: CollectionAllocation = {
      id: allocation.id || `alloc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      schoolId: schoolId,
      collectionId: allocation.collectionId || '',
      targetType: allocation.targetType || 'Receivable',
      targetId: allocation.targetId || '',
      amountAllocated: allocation.amountAllocated || 0,
      allocatedAt: allocation.allocatedAt || new Date().toISOString(),
      allocatedBy: allocation.allocatedBy || 'system',
      notes: allocation.notes
    };

    if (UnitOfWork.isTransactionActive()) {
      UnitOfWork.enlistCreate('collection_allocations', newAllocation.id, newAllocation);
      return newAllocation;
    }

    allocations.push(newAllocation);
    FallbackStorage.saveCollectionAllocations(allocations);
    return newAllocation;
  }
}
