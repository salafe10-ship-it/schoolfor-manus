import { Tenant, SubscriptionPlan, Subscription } from '../../types';
import { TenantRepository } from '../repositories/TenantRepository';
import { EnterpriseAuditLogger } from '../../utils/EnterpriseAuditLogger';
import { v4 as uuidv4 } from 'uuid';
import { IoCContainer } from '../IoCContainer';

export class TenantService {
  public static $inject = ['TenantRepository'];

  constructor(private repo: TenantRepository) {}

  private static get repoInstance(): TenantRepository {
    return IoCContainer.getInstance().resolve<TenantRepository>('TenantRepository');
  }

  public static async createTenant(tenantData: Omit<Tenant, 'id' | 'createdAt'>): Promise<Tenant> {
    const tenant: Tenant = {
      ...tenantData,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };

    await this.repoInstance.saveTenant(tenant);

    await EnterpriseAuditLogger.log(
        'CREATE',
        'TENANT',
        tenant.id,
        'system',
        `تم إنشاء عميل جديد: ${tenant.name}`
    );

    return tenant;
  }

  public static async checkLimit(tenantId: string, featureId: string, usageAmount: number): Promise<boolean> {
      // Implement quota check logic
      return true;
  }

  // المزيد من الوظائف: Activate, Suspend, Renew, Upgrade, etc.
}
