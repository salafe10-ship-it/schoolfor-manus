import { Metric, Incident } from './types';
import { AuditEngine } from '../audit/auditEngine';

export class MonitoringEngine {
  private static metrics: Metric[] = [];
  private static incidents: Incident[] = [];

  static recordMetric(metric: Omit<Metric, 'id' | 'timestamp'>) {
    const entry: Metric = {
      ...metric,
      id: `met_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    this.metrics.push(entry);
    
    // Auto-detect slow ops
    if (metric.metricType === 'latency' && metric.value > 1000) {
      this.reportIncident(metric.module, `Slow operation detected: ${metric.value}ms`, 'warning');
    }
  }

  static reportIncident(module: string, description: string, severity: 'critical' | 'warning' | 'info') {
    const incident: Incident = {
      id: `inc_${Date.now()}`,
      module,
      description,
      severity,
      timestamp: new Date().toISOString(),
      resolved: false
    };
    this.incidents.push(incident);

    // Audit the incident
    AuditEngine.log({
        correlationId: `audit_mon_${Date.now()}`,
        tenantId: 'system',
        schoolId: 'system',
        branchId: 'system',
        academicYearId: 'system',
        module: 'monitoring',
        operation: 'incident_detected',
        userId: 'system',
        sessionId: 'system',
        reason: description,
        source: 'monitoring_engine',
        ipAddress: '0.0.0.0',
        device: 'server'
    });
  }

  static getMetrics(): Metric[] { return this.metrics; }
  static getIncidents(): Incident[] { return this.incidents; }
}
