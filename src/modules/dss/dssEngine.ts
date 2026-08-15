import { Insight, ExecutiveAlert } from './types';
import { BIEngine } from '../bi/biEngine';
import { MonitoringEngine } from '../monitoring/monitoringEngine';

export class DSSEngine {
  
  static getExecutiveInsights(): Insight[] {
    const academicKPIs = BIEngine.getAcademicKPIs([]);
    const revenueTrends = BIEngine.getRevenueTrends();
    
    // Aggregating insights based on existing engines (No duplicated calculations)
    return [
      {
        id: 'ins_1',
        category: 'academic',
        summary: `Average academic score is ${academicKPIs[0]?.value || 0}.`,
        recommendation: 'Maintain current teaching quality standards.'
      },
      {
        id: 'ins_2',
        category: 'financial',
        summary: 'Revenue trend is showing growth.',
        recommendation: 'Reinvest in infrastructure expansion.'
      }
    ];
  }

  static getExecutiveAlerts(): ExecutiveAlert[] {
    const incidents = MonitoringEngine.getIncidents();
    return incidents.map(i => ({
      id: i.id,
      source: i.module,
      message: i.description,
      severity: i.severity === 'critical' ? 'critical' : 'warning'
    }));
  }
}
