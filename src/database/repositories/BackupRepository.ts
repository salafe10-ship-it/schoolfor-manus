import { getSupabaseClient } from '../client';
import { BackupDefinition, BackupJob } from '../../types';
import { FallbackStorage } from './FallbackStorage';

export class BackupRepository {
  public async getDefinition(id: string): Promise<BackupDefinition | undefined> {
    const rows = await FallbackStorage.performRead<BackupDefinition>(
      'system',
      'backup_definitions.getDefinition',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { data, error } = await supabase.from('backup_definitions').select('*').eq('id', id).maybeSingle();
        if (error) throw error;
        return data ? [data as BackupDefinition] : [];
      },
      () => FallbackStorage.getBackupDefinitions().filter(definition => definition.id === id)
    );
    return rows[0];
  }

  public async saveJob(job: BackupJob): Promise<void> {
      // Implement upsert logic
  }
}
