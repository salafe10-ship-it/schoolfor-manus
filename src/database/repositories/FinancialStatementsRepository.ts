import { FinancialStatementsSet } from './FinancialStatementsTypes';
import { FinancialStatementsStorageResolver } from '../services/FinancialStatementsStorageStrategy';

export type { StatementOfChangesInEquity, FinancialStatementsSet } from './FinancialStatementsTypes';

export class FinancialStatementsRepository {

  /**
   * Save a financial statement set by delegating to the resolved storage provider strategy
   */
  public static async saveStatementSet(schoolId: string, statementSet: FinancialStatementsSet): Promise<void> {
    const provider = await FinancialStatementsStorageResolver.resolveProvider();
    await provider.save(schoolId, statementSet);
  }

  /**
   * Retrieve a specific statement set by ID by delegating to the resolved storage provider strategy
   */
  public static async getStatementSetById(schoolId: string, statementId: string): Promise<FinancialStatementsSet | null> {
    const provider = await FinancialStatementsStorageResolver.resolveProvider();
    return provider.getById(schoolId, statementId);
  }

  /**
   * Retrieve all statement sets for a school by delegating to the resolved storage provider strategy
   */
  public static async getAllStatementSets(schoolId: string): Promise<FinancialStatementsSet[]> {
    const provider = await FinancialStatementsStorageResolver.resolveProvider();
    return provider.getAll(schoolId);
  }
}
