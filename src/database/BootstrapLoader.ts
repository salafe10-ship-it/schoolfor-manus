import { FallbackStorage } from './repositories/FallbackStorage';
import { currencySeed } from './seeds/CurrencySeed';
import { EnterpriseLogger } from './services/EnterpriseLogger';
import { EnterpriseErrorLogger } from '../utils/EnterpriseErrorLogger';
import { EnterpriseAuditLogger } from '../utils/EnterpriseAuditLogger';

/**
 * Enterprise Bootstrap Loader
 * Idempotently initializes the system databases with foundational seed data
 * on the first run.
 */
export class BootstrapLoader {
  private static isInitialized = false;

  public static init() {
    if (this.isInitialized) return;

    EnterpriseLogger.info("🚀 [Bootstrap]: Starting enterprise data initialization...", "BootstrapLoader");

    // Initialize unified system error logger
    EnterpriseErrorLogger.initialize();

    // Initialize unified system audit trail logger
    EnterpriseAuditLogger.initialize();

    // 1. Currency Master Data
    const currencyData = FallbackStorage.safeReadFile<any[]>('currency_master_database.json', []);
    if (!currencyData || currencyData.length === 0) {
      FallbackStorage.safeWriteFile('currency_master_database.json', currencySeed);
      EnterpriseLogger.info("✅ [Bootstrap]: Currency master database initialized.", "BootstrapLoader");
    }
    
    this.isInitialized = true;
    EnterpriseLogger.info("🏁 [Bootstrap]: Enterprise data initialization complete.", "BootstrapLoader");
  }
}
