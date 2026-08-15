// src/modules/monitoring/domain/MetricsCollector.ts
/**
 * Monitoring Foundation.
 * Collects system health and performance metrics.
 */
export interface Metric {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: Date;
}

export interface MetricsCollector {
  record(metric: Metric): void;
  getDashboardUrl(tenantId: string): string;
}
