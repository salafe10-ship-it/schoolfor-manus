import { getSupabaseClient } from '../client';
import { COATemplate, AuditMetadata } from '../../types';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { FallbackStorage } from './FallbackStorage';
import { v4 as uuidv4 } from 'uuid';

export class COATemplateRepository {

  public async getAll(): Promise<COATemplate[]> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('coa_templates')
            .select('*')
            .order('name', { ascending: true });
          if (!error && data) {
            return data.map(d => this.mapFromDatabase(d));
          }
        }
      } catch (err: any) {
        EnterpriseLogger.error("Failed to fetch templates from Supabase:", "COATemplateRepository", { error: err });
      }
    }
    return FallbackStorage.getCOATemplates();
  }

  public async create(item: Omit<COATemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<COATemplate> {
    const id = uuidv4();
    const newTemplate: COATemplate = {
      ...item,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return FallbackStorage.performWrite<COATemplate>(
      'system',
      'coa_templates',
      id,
      'INSERT',
      newTemplate,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client available");
        const { data, error } = await supabase
          .from('coa_templates')
          .insert([this.mapToDatabase(newTemplate)])
          .select()
          .single();
        if (error) throw error;
        return this.mapFromDatabase(data);
      },
      () => {
        const list = FallbackStorage.getCOATemplates();
        list.push(newTemplate);
        FallbackStorage.saveCOATemplates(list);
      }
    );
  }

  // Helper mappings
  private mapFromDatabase(data: any): COATemplate {
    return {
      id: data.id,
      name: data.name,
      country: data.country,
      baseCurrency: data.base_currency,
      description: data.description,
      orgType: data.org_type,
      status: data.status,
      isDefault: data.is_default,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapToDatabase(t: COATemplate): any {
    return {
      id: t.id,
      name: t.name,
      country: t.country,
      base_currency: t.baseCurrency,
      description: t.description,
      org_type: t.orgType,
      status: t.status,
      is_default: t.isDefault,
      created_at: t.createdAt,
      updated_at: t.updatedAt
    };
  }
}
