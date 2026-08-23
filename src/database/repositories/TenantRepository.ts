import { getSupabaseClient } from '../client';
import { Tenant, Subscription, UsageMetric } from '../../types';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { FallbackStorage } from './FallbackStorage';
import { v4 as uuidv4 } from 'uuid';

export class TenantRepository {
  public async getById(id: string): Promise<Tenant | undefined> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
        try {
            const supabase = getSupabaseClient();
            if (supabase) {
                const { data, error } = await supabase.from('tenants').select('*').eq('id', id).single();
                if (!error && data) return data as Tenant;
            }
        } catch (err: any) {
            EnterpriseLogger.error("Failed to fetch tenant:", "TenantRepository", { error: err });
        }
    }
    FallbackStorage.assertCanonicalPersistence(`tenant read ${id}`);
    return FallbackStorage.getTenants().find(t => t.id === id);
  }

  public async saveTenant(tenant: Tenant): Promise<void> {
      const supabase = getSupabaseClient();
      if (!supabase) {
          FallbackStorage.assertCanonicalPersistence(`tenant write ${tenant.id}`);
          throw new Error('مصدر المستأجرين المركزي غير متاح.');
      }
      const { error } = await supabase.from('tenants').upsert({
          id: tenant.id,
          name: tenant.name,
          status: tenant.status,
          subscription: (tenant as any).subscription,
          settings: (tenant as any).settings
      });
      if (error) throw new Error(`فشل حفظ المستأجر مركزياً: ${error.message}`);
  }
}
