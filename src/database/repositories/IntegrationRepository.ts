import { getSupabaseClient } from '../client';
import { APIConfiguration, IntegrationLog } from '../../types';
import { FallbackStorage } from './FallbackStorage';
import { v4 as uuidv4 } from 'uuid';

export class IntegrationRepository {
  public async getApiConfig(id: string): Promise<APIConfiguration | undefined> {
    const rows = await FallbackStorage.performRead<APIConfiguration>(
      'system',
      'api_configurations.getApiConfig',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { data, error } = await supabase.from('api_configurations').select('*').eq('id', id).maybeSingle();
        if (error) throw error;
        return data ? [data as APIConfiguration] : [];
      },
      () => FallbackStorage.getApiConfigurations().filter(a => a.id === id)
    );
    return rows[0];
  }

  public async logInteraction(log: IntegrationLog): Promise<void> {
      // Logic to save logs
  }
}
