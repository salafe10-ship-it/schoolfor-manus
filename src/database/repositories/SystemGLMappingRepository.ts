import { getSupabaseClient } from '../client';
import { SystemGLMapping } from '../../types';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { FallbackStorage } from './FallbackStorage';
import { v4 as uuidv4 } from 'uuid';

export class SystemGLMappingRepository {

  public async getBySchoolId(schoolId: string): Promise<SystemGLMapping[]> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('system_gl_mappings')
            .select('*')
            .eq('school_id', schoolId);
          if (!error && data) {
            return data.map(d => this.mapFromDatabase(d));
          }
        }
      } catch (err: any) {
        EnterpriseLogger.error("Failed to fetch system GL mappings from Supabase:", "SystemGLMappingRepository", { error: err });
      }
    }
    return FallbackStorage.getSystemGLMappings().filter(m => m.schoolId === schoolId);
  }

  public async updateMapping(schoolId: string, functionKey: string, accountId: string): Promise<void> {
    // Check if mapping exists
    const mappings = await this.getBySchoolId(schoolId);
    const existing = mappings.find(m => m.functionKey === functionKey);

    if (existing) {
        // Update
        await FallbackStorage.performWrite<void>(
            schoolId,
            'system_gl_mappings',
            existing.id,
            'UPDATE',
            { ...existing, accountId },
            async () => {
                const supabase = getSupabaseClient();
                if (!supabase) throw new Error("No Supabase client available");
                const { error } = await supabase
                    .from('system_gl_mappings')
                    .update({ account_id: accountId })
                    .eq('id', existing.id);
                if (error) throw error;
            },
            () => {
                const list = FallbackStorage.getSystemGLMappings();
                const idx = list.findIndex(m => m.id === existing.id);
                if (idx !== -1) list[idx].accountId = accountId;
                FallbackStorage.saveSystemGLMappings(list);
            }
        );
    } else {
        // Create
        const id = uuidv4();
        const newMapping: SystemGLMapping = {
            id,
            schoolId,
            functionKey,
            accountId,
            description: '' // Need to handle description
        };
        await FallbackStorage.performWrite<void>(
            schoolId,
            'system_gl_mappings',
            id,
            'INSERT',
            newMapping,
            async () => {
                const supabase = getSupabaseClient();
                if (!supabase) throw new Error("No Supabase client available");
                const { error } = await supabase
                    .from('system_gl_mappings')
                    .insert([this.mapToDatabase(newMapping)]);
                if (error) throw error;
            },
            () => {
                const list = FallbackStorage.getSystemGLMappings();
                list.push(newMapping);
                FallbackStorage.saveSystemGLMappings(list);
            }
        );
    }
  }

  private mapFromDatabase(data: any): SystemGLMapping {
    return {
      id: data.id,
      schoolId: data.school_id,
      functionKey: data.function_key,
      accountId: data.account_id,
      description: data.description
    };
  }

  private mapToDatabase(m: SystemGLMapping): any {
    return {
      id: m.id,
      school_id: m.schoolId,
      function_key: m.functionKey,
      account_id: m.accountId,
      description: m.description
    };
  }
}
