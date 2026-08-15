/**
 * Server-side transaction boundary shared by UnitOfWork and repositories.
 * This module contains contracts only and is safe to import from client code.
 */

export interface TransactionQueryResult<Row extends Record<string, unknown> = Record<string, unknown>> {
  rows: Row[];
  rowCount: number;
}

export interface TransactionSession {
  readonly id: string;
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    sqlText: string,
    parameters?: readonly unknown[]
  ): Promise<TransactionQueryResult<Row>>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  release(): Promise<void>;
}

export interface TransactionBeginOptions {
  transactionId: string;
  tenantId: string;
  schoolId: string;
  operationName: string;
  requestId?: string;
  correlationId?: string;
  timeoutMs?: number;
  /**
   * Trusted server-derived context. Never populate this from request payloads.
   * The PostgreSQL driver applies it with SET LOCAL inside the transaction.
   */
  trustedContext?: {
    tenantId: string;
    schoolId: string;
    branchId?: string;
    academicYear?: string;
    userId?: string;
    role?: string;
  };
  diagnosticTrace?: {
    mark(stage: string): void;
    count?(name: string, increment?: number): void;
    recordPoolMetric?(metric: {
      phase: 'requested' | 'acquired' | 'released';
      totalCount: number;
      idleCount: number;
      waitingCount: number;
      activeCount: number;
      acquisitionDurationMs?: number;
      waitDurationMs?: number;
      connectionCreationDurationMs?: number;
      transactionOccupancyDurationMs?: number;
      releaseDurationMs?: number;
    }): void;
  };
  diagnosticPrefix?: string;
}

export interface TransactionDriver {
  begin(options: TransactionBeginOptions): Promise<TransactionSession>;
}

export interface TransactionAwareRepository {
  execute<Row extends Record<string, unknown> = Record<string, unknown>>(
    transaction: TransactionSession,
    sqlText: string,
    parameters?: readonly unknown[]
  ): Promise<TransactionQueryResult<Row>>;
}
