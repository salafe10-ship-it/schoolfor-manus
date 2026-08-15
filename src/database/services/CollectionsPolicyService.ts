import { FallbackStorage } from '../repositories/FallbackStorage';

export type AllocationPolicyType = 
  | 'FIFO' 
  | 'LIFO' 
  | 'PRO_RATA' 
  | 'MANUAL' 
  | 'Oldest Due First' 
  | 'Oldest Invoice First' 
  | 'Oldest Installment First' 
  | 'Specific Invoice' 
  | 'Specific Installment' 
  | 'Proportional Allocation' 
  | 'Manual Allocation'
  | 'Customer Preference';

export interface CollectionAllocationPolicy {
  schoolId: string;
  defaultPolicy: AllocationPolicyType;
  allowOverpayment: boolean;
  autoApproveCollections: boolean;
  requireDoubleApprovalForWriteOffs: boolean;
}

/**
 * Enterprise Collections Policy Service
 * Centralizes organizational business preferences for allocation rules and control variables.
 */
export class CollectionsPolicyService {

  private static policies: Record<string, CollectionAllocationPolicy> = {};

  /**
   * Gets the collection allocation policy for a school (with standard defaults).
   */
  public static getPolicy(schoolId: string): CollectionAllocationPolicy {
    if (!this.policies[schoolId]) {
      this.policies[schoolId] = {
        schoolId,
        defaultPolicy: 'FIFO',
        allowOverpayment: false,
        autoApproveCollections: false,
        requireDoubleApprovalForWriteOffs: true
      };
    }
    return this.policies[schoolId];
  }

  /**
   * Updates the allocation policy for a school.
   */
  public static updatePolicy(schoolId: string, updates: Partial<CollectionAllocationPolicy>): CollectionAllocationPolicy {
    const current = this.getPolicy(schoolId);
    this.policies[schoolId] = {
      ...current,
      ...updates
    };
    return this.policies[schoolId];
  }
}
