import { FallbackStorage } from '../repositories/FallbackStorage';
import { EnterpriseLogger } from './EnterpriseLogger';

export class PersistenceHealthService {
  /**
   * Check if the official database connection (Supabase) is healthy and responsive
   */
  public static async isDatabaseHealthy(): Promise<boolean> {
    try {
      return await FallbackStorage.isHealthy();
    } catch (err: any) {
      EnterpriseLogger.error(
        'Critical database health check failure',
        'PersistenceHealth',
        { error: err?.message || String(err) }
      );
      return false;
    }
  }
}
