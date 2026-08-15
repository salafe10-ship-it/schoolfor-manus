/**
 * Enterprise Business Intelligence Framework
 */

export type IndicatorCategory = 'executive' | 'operational' | 'academic' | 'financial' | 'risk';

export interface KPI {
  id: string;
  name: string;
  category: IndicatorCategory;
  value: number;
  trend: 'up' | 'down' | 'stable';
  target: number;
}

export interface TrendData {
  category: string;
  period: string;
  value: number;
}
