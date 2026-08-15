import { getSupabaseClient } from '../client';
import { ConfigurationItem, ConfigurationAudit, ConfigurationLevel } from '../../types';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { v4 as uuidv4 } from 'uuid';

export class ConfigurationRepository {
  public async getEffectiveConfig(key: string, context: { tenantId: string, schoolId?: string, branchId?: string, userId?: string }): Promise<any> {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase client not initialized");

      // Fetch all potential matches for the key in order of precedence
      // This is a simplified fetch; in production, this would be a more complex query
      // ordering by level precedence (e.g., user > branch > school > tenant > global)
      const { data, error } = await supabase
        .from('configuration_items')
        .select('*')
        .eq('key', key)
        .eq('tenantId', context.tenantId)
        .eq('isDeleted', false)
        .order('level', { ascending: false }); // Assuming level enum maps to order

      if (error) throw error;
      
      // Merge logic based on precedence would go here
      return data && data.length > 0 ? data[0].value : null;
    } catch (err: any) {
      EnterpriseLogger.error("Failed to fetch effective configuration:", "ConfigurationRepository", { key, context, error: err });
      throw err;
    }
  }

  public async saveConfig(item: ConfigurationItem, userId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase client not initialized");

    const { error } = await supabase.from('configuration_items').upsert({
      ...item,
      modifiedAt: new Date().toISOString(),
      modifiedBy: userId
    });
    if (error) throw error;
  }
}
