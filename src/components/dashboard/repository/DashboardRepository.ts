import { getTrustedAccessToken } from '../../../utils/auth';

export type DashboardMetric = {
  status: 'live' | 'unavailable';
  count: number | null;
  source: string | null;
  message?: string;
};

export type DashboardMetrics = {
  scope: {
    tenantId: string;
    schoolId: string;
    branchId: string;
  };
  students: DashboardMetric;
  enrollments: DashboardMetric;
  attendance: DashboardMetric;
  teachers: DashboardMetric;
  finance: DashboardMetric;
  exams: DashboardMetric;
  notifications: DashboardMetric;
  activities: DashboardMetric;
};

const getHeaders = (): HeadersInit => {
  const token = getTrustedAccessToken();
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : ''
  };
};

export const DashboardRepository = {
  async getMetrics(signal?: AbortSignal): Promise<DashboardMetrics> {
    const response = await fetch('/api/dashboard/metrics', {
      method: 'GET',
      headers: getHeaders(),
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
