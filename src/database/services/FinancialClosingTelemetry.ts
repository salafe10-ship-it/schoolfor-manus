import { BusinessRuleException } from '../errors/BusinessRuleException';
import { EnterpriseLogger } from './EnterpriseLogger';

export interface TelemetryOperator {
  userId: string;
  userName: string;
  userRole: string;
  ipAddress: string;
}

export interface ClosingTelemetryRecord {
  correlationId: string;
  schoolId: string;
  periodId: string;
  closingType: 'monthly' | 'quarterly' | 'yearly' | 'reopening';
  startTime: string; // ISO DateTime
  endTime: string;   // ISO DateTime
  executionDurationMs: number;
  result: 'success' | 'failed';
  failureReason?: string;
  errorCategory?: 'Validation' | 'Business Rule' | 'Database' | 'Infrastructure' | 'Unexpected';
  engineVersion: string;
  operator: TelemetryOperator;
}

export class FinancialClosingTelemetry {
  private static readonly ENGINE_VERSION = '2.9.11';
  private static telemetryStore: ClosingTelemetryRecord[] = [];

  /**
   * Generates a simple, secure unique correlation ID
   */
  public static generateCorrelationId(): string {
    const timestamp = Date.now();
    const randomHex = Math.random().toString(16).substring(2, 10);
    return `TX-${timestamp}-${randomHex}`;
  }

  /**
   * Classifies an error into its enterprise diagnostics category
   */
  public static classifyError(error: any): 'Validation' | 'Business Rule' | 'Database' | 'Infrastructure' | 'Unexpected' {
    if (!error) return 'Unexpected';

    // 1. Business Rule Violations
    if (error.name === 'BusinessRuleException' || error instanceof BusinessRuleException) {
      return 'Business Rule';
    }

    const message = (error.message || '').toLowerCase();

    // 2. Validation Errors
    if (
      message.includes('validation') ||
      message.includes('not found') ||
      message.includes('غير موجود') ||
      message.includes('مفقود') ||
      message.includes('مخالفة معايير التشغيل') ||
      message.includes('parameter')
    ) {
      return 'Validation';
    }

    // 3. Database Errors
    if (
      message.includes('supabase') ||
      message.includes('postgres') ||
      message.includes('database') ||
      message.includes('query') ||
      message.includes('transaction') ||
      message.includes('connection') ||
      message.includes('storage')
    ) {
      return 'Database';
    }

    // 4. Infrastructure Errors
    if (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('disconnected') ||
      message.includes('memory') ||
      message.includes('overflow') ||
      message.includes('race condition') ||
      message.includes('قيد التنفيذ حالياً')
    ) {
      return 'Infrastructure';
    }

    // 5. Unexpected
    return 'Unexpected';
  }

  /**
   * Logs an execution to the structured telemetry store
   */
  public static logExecution(
    correlationId: string,
    schoolId: string,
    periodId: string,
    closingType: 'monthly' | 'quarterly' | 'yearly' | 'reopening',
    startTimeMs: number,
    result: 'success' | 'failed',
    operator: TelemetryOperator,
    error?: any
  ): ClosingTelemetryRecord {
    const endTimeMs = Date.now();
    const duration = endTimeMs - startTimeMs;

    const record: ClosingTelemetryRecord = {
      correlationId,
      schoolId,
      periodId,
      closingType,
      startTime: new Date(startTimeMs).toISOString(),
      endTime: new Date(endTimeMs).toISOString(),
      executionDurationMs: duration,
      result,
      engineVersion: this.ENGINE_VERSION,
      operator
    };

    if (result === 'failed' && error) {
      record.failureReason = error.message || String(error);
      record.errorCategory = this.classifyError(error);
    }

    // Store in-memory for analytics & metrics retrieval
    this.telemetryStore.push(record);

    // Route telemetry output through the enterprise unified logging governance standards
    if (record.result === 'success') {
      EnterpriseLogger.info(
        `Closing execution succeeded: [${record.correlationId}] type: ${record.closingType}, period: ${record.periodId}`,
        'TelemetryService',
        { record }
      );
    } else {
      EnterpriseLogger.error(
        `Closing execution failed: [${record.correlationId}] type: ${record.closingType}, period: ${record.periodId}. Reason: ${record.failureReason}`,
        'TelemetryService',
        { record }
      );
    }

    return record;
  }

  /**
   * Clears all stored telemetry data (useful for test/clean sweeps)
   */
  public static clearStore(): void {
    this.telemetryStore = [];
  }

  /**
   * Retrieves all logged telemetry entries
   */
  public static getLogs(): ClosingTelemetryRecord[] {
    return [...this.telemetryStore];
  }

  /**
   * Computes high-level operational metrics dynamically from logged telemetry
   */
  public static getMetrics() {
    const totalCount = this.telemetryStore.length;
    const successCount = this.telemetryStore.filter(r => r.result === 'success').length;
    const failedCount = this.telemetryStore.filter(r => r.result === 'failed').length;

    const totalDuration = this.telemetryStore.reduce((acc, r) => acc + r.executionDurationMs, 0);
    const averageDurationMs = totalCount > 0 ? totalDuration / totalCount : 0;

    // Aggregate failure reasons to find the most frequent ones
    const failureReasonMap: Record<string, number> = {};
    const categoryMap: Record<string, number> = {
      'Validation': 0,
      'Business Rule': 0,
      'Database': 0,
      'Infrastructure': 0,
      'Unexpected': 0
    };

    this.telemetryStore.forEach(r => {
      if (r.result === 'failed' && r.failureReason) {
        failureReasonMap[r.failureReason] = (failureReasonMap[r.failureReason] || 0) + 1;
        if (r.errorCategory) {
          categoryMap[r.errorCategory] = (categoryMap[r.errorCategory] || 0) + 1;
        }
      }
    });

    const mostFrequentFailures = Object.entries(failureReasonMap)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalCount,
      successCount,
      failedCount,
      averageDurationMs,
      mostFrequentFailures,
      errorCategories: categoryMap
    };
  }
}
