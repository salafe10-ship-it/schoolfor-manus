import { authenticatedRequest } from './authenticatedRequest';

export type CentralTenantSubscriptionChanges = {
  planCode?: string;
  status?: string;
  endsAt?: string | null;
  seatLimit?: number;
  tenantStatus?: 'provisioning' | 'active' | 'suspended';
};

export function toDisplayPlan(value: unknown): string {
  const normalized = String(value || '').trim().toLowerCase();
  const labels: Record<string, string> = { basic: 'Basic', business: 'Business', enterprise: 'Enterprise', standard: 'Standard' };
  return labels[normalized] || String(value || '');
}

export function normalizeCentralTenant(rawTenant: any): any {
  const subscription = rawTenant?.subscription && typeof rawTenant.subscription === 'object' ? rawTenant.subscription : null;
  return {
    ...rawTenant,
    id: rawTenant?.id,
    legalName: rawTenant?.legal_name ?? rawTenant?.legalName,
    planCode: rawTenant?.plan_code ?? rawTenant?.planCode,
    schoolsCount: Number(rawTenant?.schools_count ?? rawTenant?.schoolsCount ?? 0),
    branchesCount: Number(rawTenant?.branches_count ?? rawTenant?.branchesCount ?? 0),
    usersCount: Number(rawTenant?.users_count ?? rawTenant?.usersCount ?? 0),
    studentsCount: Number(rawTenant?.students_count ?? rawTenant?.studentsCount ?? 0),
    subscription: subscription ? {
      ...subscription,
      planCode: subscription.plan_code ?? subscription.planCode,
      startsAt: subscription.starts_at ?? subscription.startsAt,
      endsAt: subscription.ends_at ?? subscription.endsAt,
      seatLimit: Number(subscription.seat_limit ?? subscription.seatLimit ?? 0),
      autoRenew: Boolean(subscription.auto_renew ?? subscription.autoRenew),
    } : null,
  };
}

export async function updateCanonicalTenantSubscription(tenant: any, changes: CentralTenantSubscriptionChanges = {}) {
  if (!tenant?.id || !tenant.subscription) {
    throw new Error('لا يوجد اشتراك كانونى مرتبط بهذه المدرسة؛ افتح دليل المستأجرين وأنشئ الاشتراك قبل تعديل الترخيص.');
  }

  const currentSubscription = tenant.subscription;
  const planCode = String(changes.planCode || currentSubscription.planCode || currentSubscription.plan_code || tenant.planCode || tenant.plan_code || '').trim().toLowerCase();
  const startsAt = currentSubscription.startsAt || currentSubscription.starts_at;
  const seatLimit = changes.seatLimit ?? Number(currentSubscription.seatLimit ?? currentSubscription.seat_limit);
  if (!planCode || !startsAt || !Number.isSafeInteger(seatLimit) || seatLimit < 1) {
    throw new Error('بيانات الاشتراك الكانوني غير مكتملة؛ لم يتم تنفيذ تعديل جزئي.');
  }

  const response = await authenticatedRequest(`/api/admin/central/tenants/${encodeURIComponent(tenant.id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'update',
      planCode,
      ...(changes.tenantStatus ? { status: changes.tenantStatus } : {}),
      subscription: {
        planCode,
        status: changes.status || currentSubscription.status || 'active',
        seatLimit,
        startsAt,
        endsAt: changes.endsAt === undefined ? (currentSubscription.endsAt || currentSubscription.ends_at || null) : changes.endsAt,
        autoRenew: currentSubscription.autoRenew ?? currentSubscription.auto_renew ?? true,
      },
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success || !payload?.tenant) {
    throw new Error(payload?.message || 'تعذر حفظ الاشتراك في المصدر المركزي.');
  }
  return normalizeCentralTenant(payload.tenant);
}

export async function updateCanonicalTenantStatus(tenant: any, status: 'provisioning' | 'active' | 'suspended') {
  if (!tenant?.id) throw new Error('لا يوجد مستأجر كانونى محدد لتغيير حالته.');
  const response = await authenticatedRequest(`/api/admin/central/tenants/${encodeURIComponent(tenant.id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation: 'status', status }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success || !payload?.tenant) {
    throw new Error(payload?.message || 'تعذر تغيير حالة المستأجر في المصدر المركزي.');
  }
  return normalizeCentralTenant(payload.tenant);
}
