import { authenticatedRequest } from '../../../utils/authenticatedRequest';

export type DashboardMetric = {
  status: 'live' | 'unavailable';
  count: number | null;
  /** Legacy internal clients may still omit these fields; customer responses do. */
  source?: string | null;
  message?: string;
};

export type DashboardMetrics = {
  students: DashboardMetric;
  enrollments: DashboardMetric;
  attendance: DashboardMetric;
  teachers: DashboardMetric;
  finance: DashboardMetric;
  exams: DashboardMetric;
  notifications: DashboardMetric;
  activities: DashboardMetric;
};

export const DashboardRepository = {
  async getMetrics(signal?: AbortSignal): Promise<DashboardMetrics> {
    const response = await authenticatedRequest('/api/dashboard/metrics', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal,
      cache: 'no-store'
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success !== true) {
      throw new Error(payload.message || 'تعذر تحميل مؤشرات Dashboard من المصدر الحي.');
    }
    return payload.data as DashboardMetrics;
  }
};
