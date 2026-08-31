/**
 * Contract for a real database observability provider.
 *
 * This adapter intentionally has no in-memory defaults, seeded alerts,
 * generated telemetry, or simulation side effects. The server keeps the
 * related routes unavailable until an approved provider is configured.
 */

export interface ConnectionPoolMetrics {
  active: number;
  idle: number;
  capacity: number;
  usagePercent: number;
}

export interface ReplicationMetrics {
  active: boolean;
  lagMs: number;
  mode: string;
  syncStatus: 'synchronized' | 'lagging' | 'stopped';
}

export interface SlowQuery {
  id: string;
  query: string;
  durationMs: number;
  timestamp: string;
  optimized: boolean;
}

export interface IndexUsageMetrics {
  hitRatePercent: number;
  cacheHitRatePercent: number;
  indexScans: number;
  sequentialScans: number;
}

export interface DeadlockInfo {
  count: number;
  lastDetected: string | null;
  logs: Array<{ id: string; queryA: string; queryB: string; timestamp: string }>;
}

export interface TransactionTimeMetrics {
  avgMs: number;
  p95Ms: number;
  maxMs: number;
}

export interface FailedTransactionLog {
  id: string;
  transactionType: string;
  error: string;
  timestamp: string;
}

export interface StorageGrowthMetrics {
  sizeMB: number;
  growthRateMBPerDay: number;
  remainingSpacePercent: number;
  diskLimitMB: number;
}

export interface CpuMetrics {
  usagePercent: number;
  cores: number;
}

export interface MemoryMetrics {
  usagePercent: number;
  totalMB: number;
  usedMB: number;
}

export interface DatabaseHealthMetrics {
  timestamp: string;
  availabilityPercentage: number;
  connectionPool: ConnectionPoolMetrics;
  replicationStatus: ReplicationMetrics;
  slowQueries: SlowQuery[];
  indexUsage: IndexUsageMetrics;
  deadlocks: DeadlockInfo;
  transactionTime: TransactionTimeMetrics;
  failedTransactions: {
    count: number;
    logs: FailedTransactionLog[];
  };
  storageGrowth: StorageGrowthMetrics;
  cpu: CpuMetrics;
  memory: MemoryMetrics;
}

export interface AlertThresholds {
  cpuMaxPercent: number;
  memoryMaxPercent: number;
  slowQueryMs: number;
  maxDeadlocks: number;
  maxFailedTransactions: number;
  minAvailabilityPercent: number;
  connectionPoolUsageMaxPercent: number;
  remainingStorageMinPercent: number;
}

export interface DatabaseAlert {
  id: string;
  metricName: string;
  metricValue: string;
  thresholdValue: string;
  severity: 'warning' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

const unavailable = (): never => {
  throw new Error('Database observability provider is not configured.');
};

export class DatabaseHealthService {
  private static instance: DatabaseHealthService;

  private constructor() {}

  public static getInstance(): DatabaseHealthService {
    if (!DatabaseHealthService.instance) DatabaseHealthService.instance = new DatabaseHealthService();
    return DatabaseHealthService.instance;
  }

  public getThresholds(): AlertThresholds { return unavailable(); }
  public updateThresholds(_newThresholds: Partial<AlertThresholds>): AlertThresholds { return unavailable(); }
  public getAlerts(): DatabaseAlert[] { return unavailable(); }
  public resolveAlert(_id: string): boolean { return unavailable(); }
  public clearAllAlerts(): void { unavailable(); }
  public triggerDeadlockSim(): void { unavailable(); }
  public triggerFailedTransactionSim(_errorMsg: string): void { unavailable(); }
  public triggerSlowQuerySim(_queryText: string, _durationMs: number): void { unavailable(); }
  public optimizeSlowQueries(): void { unavailable(); }
  public async getHealthMetrics(_schoolId: string): Promise<DatabaseHealthMetrics> { return unavailable(); }
}
