// src/modules/master-data/domain/MasterEntity.ts
/**
 * Master Data Platform.
 * Ensures data consistency across all ERP modules.
 */
export interface MasterEntity {
  id: string;
  tenantId: string;
  sourceSystem: string;
  data: Record<string, any>;
  lastVerifiedAt: Date;
}
