import { Mark, Result } from './types';

export interface AnalyticsSummary {
  averageScore: number;
  passRate: number;
  topPerformers: string[];
  riskStudents: string[];
}

export class AnalyticsEngine {
  
  static analyzeResults(results: Result[]): AnalyticsSummary {
    const total = results.length;
    if (total === 0) return { averageScore: 0, passRate: 0, topPerformers: [], riskStudents: [] };

    const totalMarks = results.reduce((sum, r) => sum + r.percentage, 0);
    const passed = results.filter(r => r.status === 'passed').length;
    
    const sorted = [...results].sort((a, b) => b.percentage - a.percentage);
    
    return {
      averageScore: totalMarks / total,
      passRate: (passed / total) * 100,
      topPerformers: sorted.slice(0, 3).map(r => r.studentId),
      riskStudents: sorted.slice(-3).map(r => r.studentId)
    };
  }
}
