/**
 * Dashboard Framework
 */

export type DashboardType = 'executive' | 'school' | 'branch' | 'financial' | 'academic' | 'hr' | 'operations' | 'admissions' | 'attendance' | 'examination' | 'library' | 'inventory';

export interface WidgetDefinition {
  id: string;
  type: string;
  title: string;
  priority: number;
}

export interface DashboardDefinition {
  id: string;
  title: string;
  role: string;
  type: DashboardType;
  widgets: WidgetDefinition[];
}
