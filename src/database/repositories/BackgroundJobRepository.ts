import { getSupabaseClient } from '../client';
import { BackgroundJob } from '../../types';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { FallbackStorage } from './FallbackStorage';
import { v4 as uuidv4 } from 'uuid';

export class BackgroundJobRepository {
  public async create(job: BackgroundJob): Promise<void> {
    await FallbackStorage.performWrite(
      job.tenantId,
      'background_jobs',
      job.id,
      'INSERT',
      job,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client available");
        await supabase.from('background_jobs').insert([job]);
      },
      () => {
        const list = FallbackStorage.getBackgroundJobs();
        list.push(job);
        FallbackStorage.saveBackgroundJobs(list);
      }
    );
  }

  public async getPendingJobs(): Promise<BackgroundJob[]> {
    return FallbackStorage.getBackgroundJobs().filter(j => j.status === 'pending' || j.status === 'queued');
  }
}
