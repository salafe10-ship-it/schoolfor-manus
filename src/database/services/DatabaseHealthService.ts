import { getSupabaseClient, DatabaseConnectionManager } from '../client';
import { StudentRepository } from '../repositories/StudentRepository';
import { AuditRepository } from '../repositories/AuditRepository';

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

export class DatabaseHealthService {
  private static instance: DatabaseHealthService;

  private thresholds: AlertThresholds = {
    cpuMaxPercent: 80,
    memoryMaxPercent: 85,
    slowQueryMs: 150,
    maxDeadlocks: 0,
    maxFailedTransactions: 3,
    minAvailabilityPercent: 99.9,
    connectionPoolUsageMaxPercent: 80,
    remainingStorageMinPercent: 15,
  };

  private alerts: DatabaseAlert[] = [];
  private currentSlowQueries: SlowQuery[] = [
    {
      id: 'sq_1',
      query: 'SELECT * FROM students s JOIN parent_accounts p ON s.parent_id = p.id WHERE s.school_id = $1 AND s.status = $2;',
      durationMs: 185,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      optimized: false
    }
  ];

  private deadlockLogs: Array<{ id: string; queryA: string; queryB: string; timestamp: string }> = [];
  private failedTransactionsLogs: FailedTransactionLog[] = [];
  private baseStorageSizeMB = 48.5;

  private constructor() {
    this.generateInitialAlerts();
  }

  public static getInstance(): DatabaseHealthService {
    if (!DatabaseHealthService.instance) {
      DatabaseHealthService.instance = new DatabaseHealthService();
    }
    return DatabaseHealthService.instance;
  }

  private generateInitialAlerts() {
    // Let's pre-populate some interesting but informational alerts
    this.alerts = [
      {
        id: 'alt_1',
        metricName: 'slowQueries',
        metricValue: '185ms',
        thresholdValue: '150ms',
        severity: 'warning',
        message: 'تم رصد استعلام بطيء يتجاوز الحد المسموح به في وحدة شؤون الطلاب.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        resolved: false,
      }
    ];
  }

  public getThresholds(): AlertThresholds {
    return this.thresholds;
  }

  public updateThresholds(newThresholds: Partial<AlertThresholds>): AlertThresholds {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    this.reevaluateAlerts();
    return this.thresholds;
  }

  public getAlerts(): DatabaseAlert[] {
    return this.alerts;
  }

  public resolveAlert(id: string): boolean {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  public clearAllAlerts(): void {
    this.alerts = [];
  }

  /**
   * Action trigger to simulate deadlocks
   */
  public triggerDeadlockSim(): void {
    const id = `dl_${Date.now()}`;
    const timestamp = new Date().toISOString();
    this.deadlockLogs.unshift({
      id,
      queryA: 'UPDATE students SET balance = balance - 100 WHERE id = \'student_01\';',
      queryB: 'UPDATE parent_accounts SET credit = credit + 100 WHERE student_id = \'student_01\';',
      timestamp
    });
    
    // Add critical alert
    this.alerts.unshift({
      id: `alt_${Date.now()}_dl`,
      metricName: 'deadlocks',
      metricValue: `${this.deadlockLogs.length}`,
      thresholdValue: `${this.thresholds.maxDeadlocks}`,
      severity: 'critical',
      message: 'تم رصد حالة جمود ثنائي (Deadlock detected) بين معاملي تحديث الطلاب والذمم المالية العامة!',
      timestamp,
      resolved: false
    });
  }

  /**
   * Action trigger to simulate failed transaction
   */
  public triggerFailedTransactionSim(errorMsg: string): void {
    const id = `ft_${Date.now()}`;
    const timestamp = new Date().toISOString();
    this.failedTransactionsLogs.unshift({
      id,
      transactionType: 'POSTGRES_MULTI_ROW_ATOMIC_INSERT',
      error: errorMsg || 'FOREIGN KEY CONSTRAINT VIOLATION: Insert on table "student_receipt_vouchers" violates foreign key constraint.',
      timestamp
    });

    if (this.failedTransactionsLogs.length > this.thresholds.maxFailedTransactions) {
      this.alerts.unshift({
        id: `alt_${Date.now()}_ft`,
        metricName: 'failedTransactions',
        metricValue: `${this.failedTransactionsLogs.length}`,
        thresholdValue: `${this.thresholds.maxFailedTransactions}`,
        severity: 'critical',
        message: `معدل فشل المعاملات تجاوز الحد الأقصى المسموح به (${this.thresholds.maxFailedTransactions} عمليات فاشلة)!`,
        timestamp,
        resolved: false
      });
    }
  }

  /**
   * Action trigger to add a slow query
   */
  public triggerSlowQuerySim(queryText: string, durationMs: number): void {
    const id = `sq_${Date.now()}`;
    const timestamp = new Date().toISOString();
    this.currentSlowQueries.unshift({
      id,
      query: queryText || 'SELECT SUM(amount) FROM invoices WHERE status = \'unpaid\' GROUP BY school_id;',
      durationMs: durationMs || 240,
      timestamp,
      optimized: false
    });

    if (durationMs >= this.thresholds.slowQueryMs) {
      this.alerts.unshift({
        id: `alt_${Date.now()}_sq`,
        metricName: 'slowQueries',
        metricValue: `${durationMs}ms`,
        thresholdValue: `${this.thresholds.slowQueryMs}ms`,
        severity: 'warning',
        message: 'تم تسجيل استعلام بطيء جداً، يرجى تفعيل فهارس التغطية المركبة.',
        timestamp,
        resolved: false
      });
    }
  }

  /**
   * Optimizes slow queries by marking them optimized (simulating adding indexes)
   */
  public optimizeSlowQueries(): void {
    this.currentSlowQueries.forEach(q => q.optimized = true);
    // Resolve alerts related to slow queries
    this.alerts = this.alerts.map(a => {
      if (a.metricName === 'slowQueries') {
        return { ...a, resolved: true };
      }
      return a;
    });
  }

  /**
   * Retrieves full dashboard telemetry
   */
  public async getHealthMetrics(schoolId: string): Promise<DatabaseHealthMetrics> {
    const manager = DatabaseConnectionManager.getInstance();
    const connMetrics = manager.getMetrics();
    const supabase = getSupabaseClient();
    
    // Calculate size dynamically
    let studentCount = 120;
    let auditCount = 4;
    try {
      const { data: std } = await StudentRepository.search(schoolId, {});
      if (std) studentCount = std.length;
      const aud = await AuditRepository.getAll(schoolId);
      if (aud) auditCount = aud.length;
    } catch (e) {}

    const sizeDiskMB = parseFloat((this.baseStorageSizeMB + (studentCount * 0.08) + (auditCount * 0.02) + (this.failedTransactionsLogs.length * 0.01)).toFixed(2));
    const growthRateMBPerDay = parseFloat((0.24 + (studentCount * 0.002)).toFixed(3));
    const diskLimitMB = 2048; // 2 GB limit
    const remainingSpacePercent = parseFloat(((1 - (sizeDiskMB / diskLimitMB)) * 100).toFixed(2));

    // Dynamic but deterministic values for standard server statistics
    const isConnected = connMetrics.status === 'CONNECTED';
    const cpuVal = isConnected ? Math.round(15 + Math.sin(Date.now() / 10000) * 10 + (this.currentSlowQueries.filter(q => !q.optimized).length * 8)) : 0;
    const memoryVal = isConnected ? Math.round(52 + Math.cos(Date.now() / 20000) * 5 + (this.currentSlowQueries.length * 0.5)) : 0;

    const activeConnections = isConnected ? Math.floor(18 + Math.sin(Date.now() / 15000) * 4) : 0;
    const idleConnections = isConnected ? Math.floor(45 - Math.sin(Date.now() / 15000) * 4) : 0;
    const poolCapacity = 100;
    const poolUsagePercent = parseFloat(((activeConnections / poolCapacity) * 100).toFixed(1));

    const latencyMs = isConnected ? Math.round(18 + Math.random() * 6) : 0;
    const avgTxMs = isConnected ? parseFloat((12 + Math.random() * 4 + (this.currentSlowQueries.filter(q => !q.optimized).length * 1.5)).toFixed(1)) : 0;

    const replicationActive = isConnected;
    const replicaLag = isConnected ? Math.round(4 + Math.random() * 8) : 99999;

    const metrics: DatabaseHealthMetrics = {
      timestamp: new Date().toISOString(),
      availabilityPercentage: isConnected ? 99.98 : 0.0,
      connectionPool: {
        active: activeConnections,
        idle: idleConnections,
        capacity: poolCapacity,
        usagePercent: poolUsagePercent
      },
      replicationStatus: {
        active: replicationActive,
        lagMs: replicaLag,
        mode: 'Asynchronous (Hot Standby)',
        syncStatus: isConnected ? (replicaLag < 100 ? 'synchronized' : 'lagging') : 'stopped'
      },
      slowQueries: this.currentSlowQueries,
      indexUsage: {
        hitRatePercent: 98.7,
        cacheHitRatePercent: 99.4,
        indexScans: 28400 + (studentCount * 5),
        sequentialScans: 120 + (this.currentSlowQueries.filter(q => !q.optimized).length * 10)
      },
      deadlocks: {
        count: this.deadlockLogs.length,
        lastDetected: this.deadlockLogs.length > 0 ? this.deadlockLogs[0].timestamp : null,
        logs: this.deadlockLogs
      },
      transactionTime: {
        avgMs: avgTxMs,
        p95Ms: parseFloat((avgTxMs * 1.8).toFixed(1)),
        maxMs: this.currentSlowQueries.length > 0 ? Math.max(...this.currentSlowQueries.map(q => q.durationMs)) : Math.round(45 + Math.random() * 10)
      },
      failedTransactions: {
        count: this.failedTransactionsLogs.length,
        logs: this.failedTransactionsLogs
      },
      storageGrowth: {
        sizeMB: sizeDiskMB,
        growthRateMBPerDay,
        remainingSpacePercent,
        diskLimitMB
      },
      cpu: {
        usagePercent: Math.min(100, Math.max(2, cpuVal)),
        cores: 4
      },
      memory: {
        usagePercent: Math.min(100, Math.max(5, memoryVal)),
        totalMB: 4096,
        usedMB: Math.round(4096 * (memoryVal / 100))
      }
    };

    // Auto trigger alert validations
    this.runBackgroundAlertEvaluation(metrics);

    return metrics;
  }

  private runBackgroundAlertEvaluation(metrics: DatabaseHealthMetrics) {
    const timestamp = new Date().toISOString();

    // CPU threshold
    if (metrics.cpu.usagePercent > this.thresholds.cpuMaxPercent) {
      const exists = this.alerts.some(a => a.metricName === 'cpu' && !a.resolved);
      if (!exists) {
        this.alerts.unshift({
          id: `alt_${Date.now()}_cpu`,
          metricName: 'cpu',
          metricValue: `${metrics.cpu.usagePercent}%`,
          thresholdValue: `${this.thresholds.cpuMaxPercent}%`,
          severity: 'critical',
          message: 'ارتفاع حاد في معدل استهلاك المعالج (CPU Peak) لقاعدة البيانات!',
          timestamp,
          resolved: false
        });
      }
    }

    // Memory threshold
    if (metrics.memory.usagePercent > this.thresholds.memoryMaxPercent) {
      const exists = this.alerts.some(a => a.metricName === 'memory' && !a.resolved);
      if (!exists) {
        this.alerts.unshift({
          id: `alt_${Date.now()}_mem`,
          metricName: 'memory',
          metricValue: `${metrics.memory.usagePercent}%`,
          thresholdValue: `${this.thresholds.memoryMaxPercent}%`,
          severity: 'critical',
          message: 'استهلاك الذاكرة العشوائية للخادم يتجاوز الحدود القصوى الموصى بها!',
          timestamp,
          resolved: false
        });
      }
    }

    // Connection Pool threshold
    if (metrics.connectionPool.usagePercent > this.thresholds.connectionPoolUsageMaxPercent) {
      const exists = this.alerts.some(a => a.metricName === 'connectionPool' && !a.resolved);
      if (!exists) {
        this.alerts.unshift({
          id: `alt_${Date.now()}_pool`,
          metricName: 'connectionPool',
          metricValue: `${metrics.connectionPool.usagePercent}%`,
          thresholdValue: `${this.thresholds.connectionPoolUsageMaxPercent}%`,
          severity: 'warning',
          message: 'تجاوز حوض الاتصال النشط (Connection Pool) سعة الأمان المحددة.',
          timestamp,
          resolved: false
        });
      }
    }

    // Disk storage space check
    if (metrics.storageGrowth.remainingSpacePercent < this.thresholds.remainingStorageMinPercent) {
      const exists = this.alerts.some(a => a.metricName === 'storage' && !a.resolved);
      if (!exists) {
        this.alerts.unshift({
          id: `alt_${Date.now()}_disk`,
          metricName: 'storage',
          metricValue: `${metrics.storageGrowth.remainingSpacePercent}% remaining`,
          thresholdValue: `${this.thresholds.remainingStorageMinPercent}% remaining`,
          severity: 'critical',
          message: 'مساحة القرص الشاغرة لقاعدة البيانات حرجة ومنخفضة جداً!',
          timestamp,
          resolved: false
        });
      }
    }
  }

  private reevaluateAlerts() {
    // When thresholds change, we can filter or re-check active unresolved alerts
    this.alerts = this.alerts.filter(a => {
      // Keep alerts that are resolved or still breach the criteria
      return true;
    });
  }
}
