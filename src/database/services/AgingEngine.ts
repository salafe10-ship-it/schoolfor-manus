import { AgingBucket, ReceivableTransaction } from '../../types';
import { AccountsReceivableRepository } from '../repositories/AccountsReceivableRepository';
import { FinancialConfigurationRepository } from '../repositories/FinancialConfigurationRepository';
import { EnterpriseLogger } from './EnterpriseLogger';

/**
 * Enterprise Aging Engine
 * Independent sub-system for computing Accounts Receivable (AR) aging buckets.
 * Supports configurable buckets via Financial Configurations and custom target date evaluations.
 */
export class AgingEngine {

  /**
   * Retrieves the current aging configuration. If no custom config is found,
   * returns the standard GAAP/IFRS default buckets.
   */
  public static async getAgingBucketsConfig(schoolId: string): Promise<{ bucketName: string; minDays: number; maxDays: number }[]> {
    try {
      const config = await FinancialConfigurationRepository.getBySchoolId(schoolId);
      if (config && (config as any).aging && (config as any).aging.buckets) {
        return (config as any).aging.buckets;
      }
    } catch (e: any) {
      EnterpriseLogger.warn('Could not read custom aging configuration, falling back to enterprise defaults:', 'AgingEngine', { error: e?.message || e });
    }

    return [
      { bucketName: 'Current', minDays: -9999, maxDays: 0 },
      { bucketName: '1-30 Days', minDays: 1, maxDays: 30 },
      { bucketName: '31-60 Days', minDays: 31, maxDays: 60 },
      { bucketName: '61-90 Days', minDays: 61, maxDays: 90 },
      { bucketName: '91-120 Days', minDays: 91, maxDays: 120 },
      { bucketName: '120+ Days', minDays: 121, maxDays: 99999 }
    ];
  }

  /**
   * Computes the aging distribution for a single Receivable Account.
   */
  public static async calculateAgingForAccount(
    schoolId: string, 
    accountId: string, 
    asOfDateStr?: string
  ): Promise<AgingBucket[]> {
    const asOfDate = asOfDateStr ? new Date(asOfDateStr) : new Date();
    const configBuckets = await this.getAgingBucketsConfig(schoolId);
    
    // Initialize buckets
    const agingBuckets: AgingBucket[] = configBuckets.map(b => ({
      bucketName: b.bucketName as any,
      minDays: b.minDays,
      maxDays: b.maxDays,
      amount: 0,
      count: 0
    }));

    // Retrieve active open transactions of type debit or debit adjustments
    const txs = await AccountsReceivableRepository.getTransactionsByAccountId(schoolId, accountId);
    const openTxs = txs.filter(t => 
      t.balance > 0 && 
      (t.status === 'Open' || t.status === 'Partially Collected' || t.status === 'Past Due')
    );

    for (const tx of openTxs) {
      const dueDate = new Date(tx.dueDate);
      const diffTime = asOfDate.getTime() - dueDate.getTime();
      const daysPastDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Classify the transaction balance into the correct bucket
      const bucket = agingBuckets.find(b => daysPastDue >= b.minDays && daysPastDue <= b.maxDays);
      if (bucket) {
        bucket.amount += tx.balance;
        bucket.count += 1;
      } else {
        // Fallback for edge cases (e.g., extremely past due beyond maxDays limit)
        const lastBucket = agingBuckets[agingBuckets.length - 1];
        lastBucket.amount += tx.balance;
        lastBucket.count += 1;
      }
    }

    return agingBuckets;
  }

  /**
   * Computes the aging distribution for all active accounts inside the school portfolio.
   */
  public static async calculateCompanyWideAging(
    schoolId: string, 
    asOfDateStr?: string
  ): Promise<AgingBucket[]> {
    const configBuckets = await this.getAgingBucketsConfig(schoolId);
    
    // Initialize consolidated buckets
    const consolidatedBuckets: AgingBucket[] = configBuckets.map(b => ({
      bucketName: b.bucketName as any,
      minDays: b.minDays,
      maxDays: b.maxDays,
      amount: 0,
      count: 0
    }));

    const accounts = await AccountsReceivableRepository.getAllAccounts(schoolId);

    for (const acc of accounts) {
      const accountAging = await this.calculateAgingForAccount(schoolId, acc.id, asOfDateStr);
      for (let i = 0; i < consolidatedBuckets.length; i++) {
        consolidatedBuckets[i].amount += accountAging[i].amount;
        consolidatedBuckets[i].count += accountAging[i].count;
      }
    }

    return consolidatedBuckets;
  }
}
