/**
 * Enterprise Monitoring Domain
 */

export type MetricType = 'latency' | 'error_rate' | 'throughput';

export interface Metric {
  id: string;
  module: string;
  metricType: MetricType;
  value: number;
  timestamp: string;
}

export interface Incident {
  id: string;
  module: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  resolved: boolean;
}
