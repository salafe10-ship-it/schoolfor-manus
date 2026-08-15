import { getSupabaseClient } from '../client';
import { TemplateAccount } from '../../types';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { FallbackStorage } from './FallbackStorage';
import { v4 as uuidv4 } from 'uuid';

export class TemplateAccountRepository {

  public async getByTemplateId(templateId: string): Promise<TemplateAccount[]> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('template_accounts')
            .select('*')
            .eq('template_id', templateId)
            .order('code', { ascending: true });
          if (!error && data) {
            return data.map(d => this.mapFromDatabase(d));
          }
        }
      } catch (err: any) {
        EnterpriseLogger.error("Failed to fetch template accounts from Supabase:", "TemplateAccountRepository", { error: err });
      }
    }
    return FallbackStorage.getTemplateAccounts().filter(a => a.templateId === templateId);
  }

  public async create(item: Omit<TemplateAccount, 'id'>): Promise<TemplateAccount> {
    const id = uuidv4();
    const newAccount: TemplateAccount = { ...item, id };

    return FallbackStorage.performWrite<TemplateAccount>(
      'system',
      'template_accounts',
      id,
      'INSERT',
      newAccount,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client available");
        const { data, error } = await supabase
          .from('template_accounts')
          .insert([this.mapToDatabase(newAccount)])
          .select()
          .single();
        if (error) throw error;
        return this.mapFromDatabase(data);
      },
      () => {
        const list = FallbackStorage.getTemplateAccounts();
        list.push(newAccount);
        FallbackStorage.saveTemplateAccounts(list);
      }
    );
  }

  private mapFromDatabase(data: any): TemplateAccount {
    return {
      id: data.id,
      templateId: data.template_id,
      code: data.code,
      name: data.name,
      nature: data.nature,
      level: Number(data.level),
      parentAccountId: data.parent_account_id || undefined
    };
  }

  private mapToDatabase(a: TemplateAccount): any {
    return {
      id: a.id,
      template_id: a.templateId,
      code: a.code,
      name: a.name,
      nature: a.nature,
      level: a.level,
      parent_account_id: a.parentAccountId || null
    };
  }
}
