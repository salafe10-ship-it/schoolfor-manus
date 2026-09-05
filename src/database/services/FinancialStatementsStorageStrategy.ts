import { getSupabaseClient } from '../client';
import { FallbackStorage } from '../repositories/FallbackStorage';
import { FinancialStatementsSet } from '../repositories/FinancialStatementsTypes';
import { PersistenceHealthService } from './PersistenceHealthService';
import { EnterpriseLogger } from './EnterpriseLogger';

export interface IFinancialStatementsStorageProvider {
  save(schoolId: string, statementSet: FinancialStatementsSet): Promise<void>;
  getById(schoolId: string, statementId: string): Promise<FinancialStatementsSet | null>;
  getAll(schoolId: string): Promise<FinancialStatementsSet[]>;
}

export class ProductionDatabaseProvider implements IFinancialStatementsStorageProvider {
  public async save(schoolId: string, statementSet: FinancialStatementsSet): Promise<void> {
    FallbackStorage.assertCanonicalPersistence('financial statement fallback save');
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('خطأ إنتاجي حرج: عميل قاعدة البيانات غير متوفر أو غير مهيأ.');
    }
    const { error } = await supabase
      .from('financial_statements')
      .upsert({
        id: statementSet.id,
        school_id: schoolId,
        period_id: statementSet.periodId,
        period_name: statementSet.periodName,
        generated_at: statementSet.generatedAt,
        generated_by: statementSet.generatedBy,
        posting_version: statementSet.postingVersion,
        configuration_version: statementSet.configurationVersion,
        audit_reference: statementSet.auditReference,
        trial_balance: statementSet.trialBalance,
        general_ledger: statementSet.generalLedger,
        sub_ledger: statementSet.subLedger,
        income_statement: statementSet.incomeStatement,
        balance_sheet: statementSet.balanceSheet,
        cash_flow: statementSet.cashFlow,
        changes_in_equity: statementSet.changesInEquity,
        notes: statementSet.notes
      });
    
    if (error) {
      throw new Error(`فشل حفظ القوائم المالية في قاعدة البيانات الرسمية لبيئة الإنتاج: ${error.message}`);
    }
  }

  public async getById(schoolId: string, statementId: string): Promise<FinancialStatementsSet | null> {
    FallbackStorage.assertCanonicalPersistence('financial statement fallback read');
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('خطأ إنتاجي حرج: عميل قاعدة البيانات غير متوفر أو غير مهيأ.');
    }
    const { data, error } = await supabase
      .from('financial_statements')
      .select('*')
      .eq('id', statementId)
      .eq('school_id', schoolId)
      .maybeSingle();

    if (error) {
      throw new Error(`فشل قراءة القائمة المالية من قاعدة البيانات الرسمية للإنتاج: ${error.message}`);
    }
    return data ? mapStatementsFromDB(data) : null;
  }

  public async getAll(schoolId: string): Promise<FinancialStatementsSet[]> {
    FallbackStorage.assertCanonicalPersistence('financial statements fallback list read');
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('خطأ إنتاجي حرج: عميل قاعدة البيانات غير متوفر أو غير مهيأ.');
    }
    const { data, error } = await supabase
      .from('financial_statements')
      .select('*')
      .eq('school_id', schoolId)
      .order('generated_at', { ascending: false });

    if (error) {
      throw new Error(`فشل جلب القوائم المالية من قاعدة البيانات الرسمية للإنتاج: ${error.message}`);
    }
    return data ? data.map(d => mapStatementsFromDB(d)) : [];
  }
}

export class FallbackStorageProvider implements IFinancialStatementsStorageProvider {
  public async save(schoolId: string, statementSet: FinancialStatementsSet): Promise<void> {
    EnterpriseLogger.warn('Using LocalStorage/JSON fallback for Development/Test environment.', 'FinancialStatementsStorage');
    const key = `school_statements_${schoolId}`;
    const statements = await this.getAll(schoolId);
    
    const filtered = statements.filter(s => s.id !== statementSet.id);
    filtered.push(statementSet);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(filtered));
    } else {
      FallbackStorage.safeWriteFile(`statements_${schoolId}.json`, filtered);
    }
  }

  public async getById(schoolId: string, statementId: string): Promise<FinancialStatementsSet | null> {
    EnterpriseLogger.warn('Reading from local offline cache for Development/Test environment.', 'FinancialStatementsStorage');
    const list = await this.getAll(schoolId);
    return list.find(s => s.id === statementId) || null;
  }

  public async getAll(schoolId: string): Promise<FinancialStatementsSet[]> {
    EnterpriseLogger.warn('Reading from local offline cache for Development/Test environment.', 'FinancialStatementsStorage');
    if (typeof window !== 'undefined') {
      const key = `school_statements_${schoolId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } else {
      return FallbackStorage.safeReadFile<FinancialStatementsSet[]>(`statements_${schoolId}.json`, []);
    }
  }
}

export class FinancialStatementsStorageResolver {
  private static isProductionEnvironment(): boolean {
    const nodeEnv = typeof process !== 'undefined' && process.env?.NODE_ENV;
    const isNodeProd = nodeEnv === 'production';
    
    const isLocalHost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    return isNodeProd || (typeof window !== 'undefined' && !isLocalHost) || FallbackStorage.isCanonicalPersistenceRequired();
  }

  public static async resolveProvider(): Promise<IFinancialStatementsStorageProvider> {
    const isProd = this.isProductionEnvironment();
    const isHealthy = await PersistenceHealthService.isDatabaseHealthy();

    if (isProd) {
      if (!isHealthy) {
        throw new Error('خطأ إنتاجي حرج: قاعدة البيانات الرسمية غير متصلة أو غير مستقرة حالياً. يمنع تشغيل القوائم المالية خارج قاعدة البيانات الرسمية في بيئة الإنتاج.');
      }
      return new ProductionDatabaseProvider();
    }

    if (isHealthy) {
      return new ProductionDatabaseProvider();
    }
    return new FallbackStorageProvider();
  }
}

export function mapStatementsFromDB(data: any): FinancialStatementsSet {
  return {
    id: data.id,
    schoolId: data.school_id,
    periodId: data.period_id,
    periodName: data.period_name,
    generatedAt: data.generated_at,
    generatedBy: data.generated_by,
    postingVersion: data.posting_version,
    configurationVersion: data.configuration_version || '1.0.0',
    auditReference: data.audit_reference,
    trialBalance: typeof data.trial_balance === 'string' ? JSON.parse(data.trial_balance) : data.trial_balance,
    generalLedger: typeof data.general_ledger === 'string' ? JSON.parse(data.general_ledger) : data.general_ledger,
    subLedger: typeof data.sub_ledger === 'string' ? JSON.parse(data.sub_ledger) : data.sub_ledger,
    incomeStatement: typeof data.income_statement === 'string' ? JSON.parse(data.income_statement) : data.income_statement,
    balanceSheet: typeof data.balance_sheet === 'string' ? JSON.parse(data.balance_sheet) : data.balance_sheet,
    cashFlow: typeof data.cash_flow === 'string' ? JSON.parse(data.cash_flow) : data.cash_flow,
    changesInEquity: typeof data.changes_in_equity === 'string' ? JSON.parse(data.changes_in_equity) : data.changes_in_equity,
    notes: typeof data.notes === 'string' ? JSON.parse(data.notes) : data.notes
  };
}
