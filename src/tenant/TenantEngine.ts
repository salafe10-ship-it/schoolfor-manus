import type { TrustedIdentity } from '../middleware/trustedAuthentication';
import { FallbackStorage } from '../database/repositories/FallbackStorage';
import { getSupabaseAdminClient, getSupabaseClient, getSupabaseClientForAccessToken } from '../database/client';
import { branchesSeed, schoolsSeed } from '../database/seed/mockData';
import { UnitOfWork } from '../database/UnitOfWork';
import type { TenantContext } from './TenantContext';
import type { Perf004TraceLike } from '../performance/Perf004LatencyDiagnostics';

export type TenantDataProvider = {
  resolveSnapshot?(identity: TrustedIdentity, diagnosticTrace?: Perf004TraceLike): Promise<TenantLookupSnapshot | null>;
  schoolExists(tenantId: string, schoolId: string, accessToken?: string): Promise<boolean>;
  listBranches(tenantId: string, schoolId: string, accessToken?: string): Promise<string[]>;
  listAcademicYears(tenantId: string, schoolId: string, branchId?: string, accessToken?: string): Promise<Array<{
    id: string;
    name?: string;
    isActive?: boolean;
    isCurrent?: boolean;
    tenantId?: string;
    schoolId?: string;
    branchId?: string | null;
  }>>;
};

export type TenantLookupSnapshot = {
  schoolExists: boolean;
  branchIds: string[];
  academicYears: Array<{
    id: string;
    name?: string;
    isActive?: boolean;
    isCurrent?: boolean;
    tenantId?: string;
    schoolId?: string;
    branchId?: string | null;
  }>;
};

export class TenantIsolationError extends Error {
  public readonly statusCode = 403;
  public readonly errorCode = 'TENANT_ISOLATION_ERROR';

  constructor(public readonly reason: string, message = 'Tenant context is invalid or missing') {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

type AcademicYearCandidate = {
  id: string;
  name?: string;
  isActive?: boolean;
  isCurrent?: boolean;
  tenantId?: string;
  schoolId?: string;
  branchId?: string | null;
};

function normalizeAcademicYearLabel(value: unknown): string {
  return clean(value).replace(/[\u2013\u2014/]/g, '-').replace(/\s+/g, '');
}

function resolveAcademicYearRecord(
  years: AcademicYearCandidate[],
  requestedAcademicYear: string,
): AcademicYearCandidate | undefined {
  const activeYears = years.filter(year => year.isActive !== false);
  if (!requestedAcademicYear) {
    const currentYears = activeYears.filter(year => year.isCurrent === true);
    return currentYears.length === 1 ? currentYears[0] : activeYears.length === 1 ? activeYears[0] : undefined;
  }

  const requestedLabel = normalizeAcademicYearLabel(requestedAcademicYear);
  const directMatch = years.find(year => year.id === requestedAcademicYear || normalizeAcademicYearLabel(year.name) === requestedLabel);
  if (directMatch) return directMatch;

  // Older sessions stored the display label (for example 2026-2027) while
  // the canonical database row uses a UUID or a slash-separated label. When
  // the claim is unmistakably a year label, bind it to the current scoped
  // row; the query is already restricted to the trusted tenant/school/branch.
  // Arbitrary invalid identifiers still fail closed below.
  if (/^\d{4}-\d{4}$/.test(requestedLabel)) {
    const currentYears = activeYears.filter(year => year.isCurrent === true);
    if (currentYears.length === 1) return currentYears[0];
    if (activeYears.length === 1) return activeYears[0];
  }
  return undefined;
}

function databaseProviderConfigured(): boolean {
  const url = clean(process.env.SUPABASE_URL);
  const key = clean(process.env.SUPABASE_ANON_KEY);
  return Boolean(url && key && !url.includes('your-project') && !key.includes('your-anon-key'));
}

class DefaultTenantDataProvider implements TenantDataProvider {
  async resolveSnapshot(identity: TrustedIdentity, diagnosticTrace?: Perf004TraceLike): Promise<TenantLookupSnapshot | null> {
    if (!UnitOfWork.hasTransactionDriver()) return null;

    const userId = clean(identity.id);
    const tenantId = clean(identity.tenantId);
    const schoolId = clean(identity.schoolId);
    const role = clean(identity.role);
    if (!userId || !tenantId || !schoolId || !role) throw new TenantIsolationError('MISSING_TENANT', 'لا يمكن إنشاء سياق مستأجر بدون هوية موثوقة.');

    const trustedContext = {
      tenantId,
      schoolId,
      branchId: clean(identity.branchId),
      academicYear: clean(identity.academicYear),
      userId,
      role
    };

    const readSnapshot = async (): Promise<TenantLookupSnapshot> => {
      const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
      if (!transaction) throw new Error('Tenant lookup requires the configured PostgreSQL transaction driver.');

      diagnosticTrace?.mark('tenant_postgres_query_started');
      diagnosticTrace?.count?.('tenantDbQueries');
      const result = await transaction.query<{
        school_exists: boolean;
        branch_ids: string[];
        academic_years: Array<{
          id: string;
          name?: string;
          status?: string;
          is_current?: boolean;
          tenant_id?: string;
          school_id?: string;
          branch_id?: string | null;
        }>;
      }>(
          `SELECT
             EXISTS (
               SELECT 1 FROM public.schools
               WHERE tenant_id = $1::uuid AND id = $2::uuid AND deleted_at IS NULL
             ) AS school_exists,
             COALESCE((
               SELECT json_agg(id::text ORDER BY id)
               FROM public.branches
               WHERE tenant_id = $1::uuid AND school_id = $2::uuid
                 AND deleted_at IS NULL AND status IN ('provisioning', 'active')
             ), '[]'::json) AS branch_ids,
             COALESCE((
               SELECT json_agg(json_build_object(
                 'id', id::text,
                 'name', name,
                 'status', status,
                 'is_current', is_current,
                 'tenant_id', tenant_id::text,
                 'school_id', school_id::text,
                 'branch_id', branch_id::text
               ) ORDER BY starts_on, id)
               FROM public.academic_years
               WHERE tenant_id = $1::uuid AND school_id = $2::uuid
                 AND deleted_at IS NULL AND status IN ('planned', 'active')
                 AND ($3::uuid IS NULL OR branch_id IS NULL OR branch_id = $3::uuid)
             ), '[]'::json) AS academic_years`,
        [tenantId, schoolId, clean(identity.branchId) || null]
      );

      diagnosticTrace?.mark('tenant_postgres_query_completed');
      const row = result.rows[0];
      const postgresSnapshot: TenantLookupSnapshot = {
        schoolExists: Boolean(row?.school_exists),
        branchIds: Array.isArray(row?.branch_ids) ? row.branch_ids.map(String).filter(Boolean) : [],
        academicYears: Array.isArray(row?.academic_years)
          ? row.academic_years.map(year => ({
            id: String(year.id),
            name: year.name ? String(year.name) : undefined,
            // A planned academic year may be prepared and displayed by the
            // administration, but it must never compete with the operational
            // year when resolving a trusted transaction context.
            isActive: year.status === 'active',
            isCurrent: Boolean(year.is_current),
            tenantId: year.tenant_id ? String(year.tenant_id) : undefined,
            schoolId: year.school_id ? String(year.school_id) : undefined,
            branchId: year.branch_id ? String(year.branch_id) : null
          }))
          : []
      };

      // Render's tenant pool can be pointed at a database that is healthy but
      // does not contain the control-plane school rows. The authenticated
      // Supabase channel remains the canonical read source for this project,
      // so retry the strictly scoped lookup there before rejecting a valid
      // tenant. This keeps the PostgreSQL transaction path authoritative when
      // it has the rows, while preventing a stale/mismatched pool from
      // blocking the school dashboard and Student Affairs entry point.
      const branchId = clean(identity.branchId);
      const postgresContextLooksValid = postgresSnapshot.schoolExists
        && (!branchId || postgresSnapshot.branchIds.includes(branchId));
      if (postgresContextLooksValid) return postgresSnapshot;

      // This is a server-side lookup only. The anon client is intentionally
      // not used here because production RLS can hide a valid school row;
      // service-role access is still restricted by the verified identity
      // values in the predicates below and never leaves the server.
      const supabase = getSupabaseAdminClient();
      if (!supabase) return postgresSnapshot;
      try {
        let academicYearQuery = supabase
          .from('academic_years')
          .select('id,name,status,is_current,tenant_id,school_id,branch_id')
          .eq('tenant_id', tenantId)
          .eq('school_id', schoolId)
          .is('deleted_at', null)
          .in('status', ['planned', 'active']);
        if (branchId) academicYearQuery = academicYearQuery.or(`branch_id.is.null,branch_id.eq.${branchId}`);
        const [schoolResult, branchResult, academicYearResult] = await Promise.all([
          supabase
            .from('schools')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('id', schoolId)
            .is('deleted_at', null)
            .maybeSingle(),
          supabase
            .from('branches')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('school_id', schoolId)
            .is('deleted_at', null)
            .in('status', ['provisioning', 'active']),
          academicYearQuery
        ]);
        if (schoolResult.error || branchResult.error || academicYearResult.error || !schoolResult.data) {
          return postgresSnapshot;
        }
        return {
          schoolExists: true,
          branchIds: (branchResult.data || []).map((branch: any) => String(branch.id)).filter(Boolean),
          academicYears: (academicYearResult.data || []).map((year: any) => ({
            id: String(year.id),
            name: year.name ? String(year.name) : undefined,
            isActive: year.status === 'active',
            isCurrent: Boolean(year.is_current),
            tenantId: year.tenant_id ? String(year.tenant_id) : undefined,
            schoolId: year.school_id ? String(year.school_id) : undefined,
            branchId: year.branch_id ? String(year.branch_id) : null
          }))
        };
      } catch {
        return postgresSnapshot;
      }
    };

    if (UnitOfWork.isTransactionActive()) {
      return readSnapshot();
    }

    return UnitOfWork.runInTransaction(
      schoolId,
      {
        operationName: 'TenantEngine authenticated lookup',
        userId,
        userName: identity.name || identity.email,
        ipAddress: 'internal',
        affectedTables: ['schools', 'branches', 'academic_years'],
        tenantId,
        diagnosticTrace
      },
      readSnapshot,
      trustedContext
    );
  }

  async schoolExists(tenantId: string, schoolId: string, accessToken?: string): Promise<boolean> {
    const supabase = getSupabaseClientForAccessToken(accessToken) || getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('id', schoolId)
          .is('deleted_at', null)
          .maybeSingle();
        if (!error && data) return true;
      } catch {
        if (databaseProviderConfigured()) return false;
      }
    }
    if (databaseProviderConfigured()) return false;
    return schoolsSeed.some(school => school.id === schoolId);
  }

  async listBranches(tenantId: string, schoolId: string, accessToken?: string): Promise<string[]> {
    const supabase = getSupabaseClientForAccessToken(accessToken) || getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('branches')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('school_id', schoolId)
          .is('deleted_at', null)
          .in('status', ['provisioning', 'active']);
        if (!error && Array.isArray(data) && data.length) return data.map(row => String(row.id)).filter(Boolean);
      } catch {
        if (databaseProviderConfigured()) return [];
      }
    }
    if (databaseProviderConfigured()) return [];
    return branchesSeed.filter(branch => branch.schoolId === schoolId).map(branch => branch.id);
  }

  async listAcademicYears(tenantId: string, schoolId: string, branchId?: string, accessToken?: string): Promise<Array<{
    id: string;
    name?: string;
    isActive?: boolean;
    isCurrent?: boolean;
    tenantId?: string;
    schoolId?: string;
    branchId?: string | null;
  }>> {
    const supabase = getSupabaseClientForAccessToken(accessToken) || getSupabaseClient();
    if (supabase) {
      try {
        let query = supabase
          .from('academic_years')
          .select('id,name,status,is_current,tenant_id,school_id,branch_id')
          .eq('tenant_id', tenantId)
          .eq('school_id', schoolId)
          .is('deleted_at', null)
          .in('status', ['planned', 'active']);
        if (branchId) query = query.or(`branch_id.is.null,branch_id.eq.${branchId}`);
        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length) {
          return data.map(row => ({
            id: String(row.id),
            name: row.name ? String(row.name) : undefined,
            isActive: row.status === 'active',
            isCurrent: Boolean((row as any).is_current),
            tenantId: row.tenant_id ? String(row.tenant_id) : undefined,
            schoolId: row.school_id ? String(row.school_id) : undefined,
            branchId: row.branch_id ? String(row.branch_id) : null
          }));
        }
      } catch {
        if (databaseProviderConfigured()) return [];
      }
    }
    if (databaseProviderConfigured()) return [];
    return FallbackStorage.getAcademicCalendars()
      .filter(calendar => calendar.schoolId === schoolId)
      .map(calendar => ({ id: calendar.id, name: calendar.name, isActive: calendar.isActive }));
  }
}

export class TenantContextResolver {
  constructor(private readonly provider: TenantDataProvider = new DefaultTenantDataProvider()) {}

  async resolveForRead(identity: TrustedIdentity | null | undefined, accessToken?: string, diagnosticTrace?: Perf004TraceLike): Promise<TenantContext> {
    const userId = clean(identity?.id);
    const tenantId = clean(identity?.tenantId);
    const schoolId = clean(identity?.schoolId);
    const role = clean(identity?.role);
    if (!userId || !tenantId || !schoolId || !role) {
      throw new TenantIsolationError('MISSING_TENANT', 'لا يمكن إنشاء سياق قراءة بدون هوية موثوقة.');
    }

    const snapshotProvider = this.provider as TenantDataProvider;
    const snapshot = snapshotProvider.resolveSnapshot
      ? await snapshotProvider.resolveSnapshot(identity as TrustedIdentity, diagnosticTrace)
      : null;
    const schoolValid = snapshot
      ? snapshot.schoolExists
      : accessToken
        ? await this.provider.schoolExists(tenantId, schoolId, accessToken)
        : await this.provider.schoolExists(tenantId, schoolId);
    if (!schoolValid) throw new TenantIsolationError('INVALID_TENANT', 'المدرسة المرتبطة بالهوية غير موجودة.');

    const branchIds = snapshot
      ? snapshot.branchIds
      : accessToken
        ? await this.provider.listBranches(tenantId, schoolId, accessToken)
        : await this.provider.listBranches(tenantId, schoolId);
    const branchId = clean(identity?.branchId);
    if (!branchId) throw new TenantIsolationError('MISSING_BRANCH', 'لا يوجد فرع موثوق محدد لهذه الجلسة.');
    if (!branchIds.includes(branchId)) throw new TenantIsolationError('INVALID_BRANCH', 'الفرع لا ينتمي إلى المدرسة الموثوقة.');

    const requestedAcademicYear = clean(identity?.academicYear);
    if (requestedAcademicYear) {
      const academicYears = snapshot
        ? snapshot.academicYears
        : accessToken
          ? await this.provider.listAcademicYears(tenantId, schoolId, branchId, accessToken)
          : await this.provider.listAcademicYears(tenantId, schoolId, branchId);
      const academicYearRecord = resolveAcademicYearRecord(academicYears, requestedAcademicYear);
      if (!academicYearRecord || academicYearRecord.isActive === false) {
        throw new TenantIsolationError('INVALID_ACADEMIC_YEAR', 'السنة الدراسية الموثوقة غير صالحة.');
      }
      if (academicYearRecord.tenantId && academicYearRecord.tenantId !== tenantId) {
        throw new TenantIsolationError('INVALID_ACADEMIC_YEAR', 'السنة الدراسية لا تنتمي إلى المستأجر الموثوق.');
      }
      if (academicYearRecord.schoolId && academicYearRecord.schoolId !== schoolId) {
        throw new TenantIsolationError('INVALID_ACADEMIC_YEAR', 'السنة الدراسية لا تنتمي إلى المدرسة الموثوقة.');
      }
      if (academicYearRecord.branchId && academicYearRecord.branchId !== branchId) {
        throw new TenantIsolationError('INVALID_ACADEMIC_YEAR', 'السنة الدراسية لا تنتمي إلى الفرع الموثوق.');
      }
    }

    return { tenantId, schoolId, branchId, academicYear: requestedAcademicYear, userId, role };
  }

  async resolve(identity: TrustedIdentity | null | undefined, accessToken?: string, diagnosticTrace?: Perf004TraceLike): Promise<TenantContext> {
    const userId = clean(identity?.id);
    const tenantId = clean(identity?.tenantId);
    const schoolId = clean(identity?.schoolId);
    const role = clean(identity?.role);
    if (!userId || !tenantId || !schoolId || !role) {
      throw new TenantIsolationError('MISSING_TENANT', 'لا يمكن إنشاء سياق مستأجر بدون هوية موثوقة.');
    }
    const snapshotProvider = this.provider as TenantDataProvider;
    diagnosticTrace?.mark('tenant_engine_started');
    const snapshot = snapshotProvider.resolveSnapshot
      ? await snapshotProvider.resolveSnapshot(identity as TrustedIdentity, diagnosticTrace)
      : null;
    const schoolValid = snapshot
      ? snapshot.schoolExists
        : accessToken
          ? await this.provider.schoolExists(tenantId, schoolId, accessToken)
          : await this.provider.schoolExists(tenantId, schoolId);
    if (!schoolValid) {
      throw new TenantIsolationError('INVALID_TENANT', 'المدرسة المرتبطة بالهوية غير موجودة.');
    }

    const branchIds = snapshot
      ? snapshot.branchIds
        : accessToken
          ? await this.provider.listBranches(tenantId, schoolId, accessToken)
          : await this.provider.listBranches(tenantId, schoolId);
    const requestedBranch = clean(identity?.branchId);
    const branchId = requestedBranch || (branchIds.length === 1 ? branchIds[0] : '');
    if (!branchId) throw new TenantIsolationError('MISSING_BRANCH', 'لا يوجد فرع موثوق محدد لهذه الجلسة.');
    if (!branchIds.includes(branchId)) throw new TenantIsolationError('INVALID_BRANCH', 'الفرع لا ينتمي إلى المدرسة الموثوقة.');

    const academicYears = snapshot
      ? snapshot.academicYears
        : accessToken
          ? await this.provider.listAcademicYears(tenantId, schoolId, branchId, accessToken)
          : await this.provider.listAcademicYears(tenantId, schoolId, branchId);
    const requestedAcademicYear = clean(identity?.academicYear);
    const academicYearRecord = resolveAcademicYearRecord(academicYears, requestedAcademicYear);
    if (!academicYearRecord) {
      throw new TenantIsolationError(
        requestedAcademicYear ? 'INVALID_ACADEMIC_YEAR' : 'MISSING_ACADEMIC_YEAR',
        'السنة الدراسية الموثوقة غير صالحة أو غير محددة.'
      );
    }
    if (academicYearRecord.isActive === false) throw new TenantIsolationError('INVALID_ACADEMIC_YEAR', 'السنة الدراسية مغلقة أو غير فعالة.');
    if (academicYearRecord.tenantId && academicYearRecord.tenantId !== tenantId) {
      throw new TenantIsolationError('INVALID_ACADEMIC_YEAR', 'السنة الدراسية لا تنتمي إلى المستأجر الموثوق.');
    }
    if (academicYearRecord.schoolId && academicYearRecord.schoolId !== schoolId) {
      throw new TenantIsolationError('INVALID_ACADEMIC_YEAR', 'السنة الدراسية لا تنتمي إلى المدرسة الموثوقة.');
    }
    if (academicYearRecord.branchId && academicYearRecord.branchId !== branchId) {
      throw new TenantIsolationError('INVALID_ACADEMIC_YEAR', 'السنة الدراسية لا تنتمي إلى الفرع الموثوق.');
    }

    const context = { tenantId, schoolId, branchId, academicYear: academicYearRecord.id, userId, role };
    diagnosticTrace?.mark('tenant_engine_completed');
    return context;
  }
}

export const tenantContextResolver = new TenantContextResolver();

export class TenantEngine {
  resolveForRead(identity: TrustedIdentity | null | undefined, accessToken?: string, diagnosticTrace?: Perf004TraceLike): Promise<TenantContext> {
    return tenantContextResolver.resolveForRead(identity, accessToken, diagnosticTrace);
  }

  resolve(identity: TrustedIdentity | null | undefined, accessToken?: string, diagnosticTrace?: Perf004TraceLike): Promise<TenantContext> {
    return tenantContextResolver.resolve(identity, accessToken, diagnosticTrace);
  }

  validate(context: TenantContext): TenantContext {
    const values = [context.tenantId, context.schoolId, context.branchId, context.academicYear, context.userId, context.role];
    if (values.some(value => !clean(value))) throw new TenantIsolationError('INVALID_CONTEXT', 'سياق المستأجر غير مكتمل.');
    // A tenant may own one or more schools. Equality is not a valid invariant.
    // Scope membership is enforced by the resolved database-backed provider and
    // the comparisons in assertRequestTarget below.

    return context;
  }

  assertRequestTarget(context: TenantContext, target: Partial<Record<'tenantId' | 'schoolId' | 'branchId' | 'academicYear', unknown>>): void {
    const comparisons: Array<[string, unknown, string]> = [
      ['tenantId', target.tenantId, context.tenantId],
      ['schoolId', target.schoolId, context.schoolId],
      ['branchId', target.branchId, context.branchId],
      ['academicYear', target.academicYear, context.academicYear]
    ];
    for (const [field, requested, trusted] of comparisons) {
      const value = clean(requested);
      if (value && value !== trusted) throw new TenantIsolationError('TENANT_SPOOFING', `قيمة ${field} لا تطابق سياق المستأجر الموثوق.`);
    }
  }
}

export const tenantEngine = new TenantEngine();
