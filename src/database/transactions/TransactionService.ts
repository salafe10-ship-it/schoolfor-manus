import { UnitOfWork } from '../UnitOfWork';
import { EnterpriseLogger } from '../services/EnterpriseLogger';

export class TransactionService {
  /**
   * Run a block of work inside a transaction using UnitOfWork.
   */
  public static async run<T>(params: {
    operationName: string;
    tenantId: string;
    schoolId?: string;
    userId: string;
    userName: string;
    ipAddress: string;
    affectedTables: string[];
    executionBlock: () => Promise<T> | T;
  }): Promise<{ success: boolean; result: T | null; error?: string }> {
    EnterpriseLogger.info(
      `Starting UnitOfWork transaction for ${params.operationName}`,
      'TransactionService',
      { affectedTables: params.affectedTables }
    );

    try {
      const result = await UnitOfWork.runInTransaction(params.schoolId || params.tenantId, {
        operationName: params.operationName,
        tenantId: params.tenantId,
        userId: params.userId,
        userName: params.userName,
        ipAddress: params.ipAddress,
        affectedTables: params.affectedTables,
      }, params.executionBlock);

      return {
        success: true,
        result: result,
      };
    } catch (error: any) {
      EnterpriseLogger.error(
        `Error in transaction ${params.operationName}: ${error?.message || error}`,
        'TransactionService',
        { error }
      );
      return {
        success: false,
        result: null,
        error: error.message || String(error),
      };
    }
  }
}
