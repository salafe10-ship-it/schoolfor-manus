import { UnitOfWork } from '../UnitOfWork';
import type { TransactionSession } from '../transactions/TransactionContracts';
import type { TenantContext } from '../../tenant/TenantContext';
import { DatabaseError, ValidationError } from '../../utils/errors';
import type { Perf004TraceLike } from '../../performance/Perf004LatencyDiagnostics';
import type { SupabaseClient } from '@supabase/supabase-js';

export type StudentReadDiagnostic = {
  requestId: string;
  correlationId: string;
  log(stage: string, status: string, safeClassification?: string): void;
};

export type CanonicalStudentReadParams = {
  quickSearch?: string;
  classroom?: string;
  section?: string;
  status?: string;
  gender?: string;
  feesOutstandingOnly?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

type CanonicalStudentRow = {
  id: string;
  tenant_id: string;
  school_id: string;
  branch_id: string | null;
  student_number: string;
  legal_first_name: string;
  legal_middle_name: string | null;
  legal_last_name: string;
  preferred_name: string | null;
  date_of_birth: string;
  gender: string | null;
  nationality: string | null;
  guardian_id: string | null;
  guardian_version: number | null;
  guardian_relationship_id: string | null;
  guardian_relationship_version: number | null;
  parent_name: string | null;
  parent_phone: string | null;
  guardian_relation: string | null;
  class_reference: string | null;
  section_reference: string | null;
  status: string;
  version: number;
  created_at: string;
  deleted_at: string | null;
  total_count: number;
};

const SORT_COLUMNS: Record<string, string> = {
  registrationDate: 'created_at',
  createdAt: 'created_at',
  studentNumber: 'student_number',
  name: 'legal_last_name',
  status: 'status',
  dateOfBirth: 'date_of_birth'
};

export const CANONICAL_STUDENT_SORT_FIELDS = Object.freeze(Object.keys(SORT_COLUMNS));

function boundedInteger(value: number | undefined, fallback: number, maximum: number): number {
  if (!Number.isInteger(value) || value === undefined) return fallback;
  return Math.min(Math.max(value, 1), maximum);
}

function normalizePage(value: number | undefined): number {
  if (value === undefined) return 1;
  if (!Number.isInteger(value) || value < 1) {
    throw new ValidationError('رقم الصفحة يجب أن يكون عددًا صحيحًا موجبًا.');
  }
  return boundedInteger(value, 1, 1000000);
}

function normalizeLimit(value: number | undefined, maximum = 100): number {
  if (value === undefined) return 50;
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new ValidationError(`حجم الصفحة يجب أن يكون بين 1 و${maximum}.`);
  }
  return value;
}

function sqlSearchTerm(value: string | undefined): string | null {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return normalized || null;
}

function mapStatus(status: string): string {
  return status === 'admitted' ? 'accepted' : status;
}

function safePostgresClassification(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code || '')
    : '';
  if (code === '42P01' || code === '42703') return 'SCHEMA_OBJECT_MISSING_OR_INVALID';
  if (code === '22P02') return 'PARAMETER_FORMAT_INVALID';
  if (code === '42501') return 'DATABASE_PERMISSION_OR_RLS';
  if (code.startsWith('08')) return 'DATABASE_CONNECTION';
  if (code.startsWith('23')) return 'DATABASE_CONSTRAINT';
  return 'DATABASE_ERROR_UNCLASSIFIED';
}

export function mapCanonicalStudentRow(row: CanonicalStudentRow): Record<string, unknown> {
  const name = [row.legal_first_name, row.legal_middle_name, row.legal_last_name]
    .filter(Boolean)
    .join(' ');

  return {
    id: row.id,
    schoolId: row.school_id,
    branchId: row.branch_id || '',
    name,
    legalFirstName: row.legal_first_name,
    legalMiddleName: row.legal_middle_name || '',
    legalLastName: row.legal_last_name,
    preferredName: row.preferred_name || '',
    studentNumber: row.student_number,
    studentCode: row.student_number,
    nationalId: '',
    classroom: row.class_reference || '',
    section: row.section_reference || '',
    parentName: row.parent_name || '',
    parentPhone: row.parent_phone || '',
    guardianRelation: row.guardian_relation || '',
    guardianId: row.guardian_id || undefined,
    guardianVersion: row.guardian_version || undefined,
    guardianRelationshipId: row.guardian_relationship_id || undefined,
    guardianRelationshipVersion: row.guardian_relationship_version || undefined,
    registrationDate: row.created_at,
    birthDate: row.date_of_birth,
    gender: row.gender || undefined,
    nationality: row.nationality || undefined,
    academicYear: undefined,
    status: mapStatus(row.status),
    feesPaid: 0,
    feesRemaining: 0,
    version: row.version,
    isDeleted: Boolean(row.deleted_at)
  };
}

async function queryCanonicalStudents(
  transaction: TransactionSession,
  context: TenantContext,
  params: CanonicalStudentReadParams,
  diagnosticTrace?: Perf004TraceLike,
  maximumLimit = 100,
  studentReadDiagnostic?: StudentReadDiagnostic
): Promise<{ rows: Record<string, unknown>[]; totalCount: number }> {
  const page = normalizePage(params.page);
  const limit = normalizeLimit(params.limit, maximumLimit);
  const offset = (page - 1) * limit;
  const requestedSortBy = params.sortBy || 'registrationDate';
  const sortColumn = SORT_COLUMNS[requestedSortBy];
  if (!sortColumn) throw new ValidationError('حقل الترتيب المطلوب غير معتمد.');
  if (params.sortOrder !== undefined && params.sortOrder !== 'asc' && params.sortOrder !== 'desc') {
    throw new ValidationError('اتجاه الترتيب غير معتمد.');
  }
  const sortDirection = params.sortOrder === 'asc' ? 'ASC' : 'DESC';
  const search = sqlSearchTerm(params.quickSearch);
  const values: unknown[] = [context.tenantId, context.schoolId, context.branchId];
  const predicates = [
    's.tenant_id = $1',
    's.school_id = $2',
    's.branch_id = $3',
    's.deleted_at IS NULL'
  ];

  if (search) {
    values.push(`%${search.replace(/[%_]/g, '\\$&')}%`);
    predicates.push(`(
      s.student_number ILIKE $${values.length} ESCAPE '\\'
      OR s.legal_first_name ILIKE $${values.length} ESCAPE '\\'
      OR s.legal_middle_name ILIKE $${values.length} ESCAPE '\\'
      OR s.legal_last_name ILIKE $${values.length} ESCAPE '\\'
      OR s.preferred_name ILIKE $${values.length} ESCAPE '\\'
    )`);
  }
  if (params.status) {
    values.push(params.status === 'accepted' ? 'admitted' : params.status);
    predicates.push(`s.status = $${values.length}`);
  }
  if (params.gender) {
    values.push(params.gender);
    predicates.push(`s.gender = $${values.length}`);
  }
  if (params.classroom) {
    values.push(params.classroom);
    predicates.push(`enrollment.class_reference = $${values.length}`);
  }
  if (params.section) {
    values.push(params.section);
    predicates.push(`enrollment.section_reference = $${values.length}`);
  }

  values.push(limit, offset);
  const limitIndex = values.length - 1;
  const offsetIndex = values.length;
  const sql = `
    SELECT
      s.id, s.tenant_id, s.school_id, s.branch_id, s.student_number,
      s.legal_first_name, s.legal_middle_name, s.legal_last_name,
      s.preferred_name, s.date_of_birth, s.gender, s.nationality,
      s.status, s.version, s.created_at, s.deleted_at,
      enrollment.class_reference, enrollment.section_reference,
      guardian.guardian_id, guardian.guardian_version,
      guardian.guardian_relationship_id, guardian.guardian_relationship_version,
      guardian.parent_name, guardian.parent_phone, guardian.guardian_relation,
      COUNT(*) OVER()::integer AS total_count
    FROM public.students AS s
    LEFT JOIN LATERAL (
      SELECT e.class_reference, e.section_reference
      FROM public.enrollments AS e
      WHERE e.tenant_id = s.tenant_id
        AND e.school_id = s.school_id
        AND (e.branch_id = s.branch_id OR (e.branch_id IS NULL AND s.branch_id IS NULL))
        AND e.student_id = s.id
        AND e.deleted_at IS NULL
        AND e.enrollment_status IN ('pending', 'active')
      ORDER BY e.starts_on DESC, e.created_at DESC
      LIMIT 1
    ) AS enrollment ON TRUE
    LEFT JOIN LATERAL (
      SELECT
        g.id AS guardian_id,
        g.version AS guardian_version,
        sg.id AS guardian_relationship_id,
        sg.version AS guardian_relationship_version,
        concat_ws(' ', g.legal_first_name, g.legal_middle_name, g.legal_last_name) AS parent_name,
        g.phone AS parent_phone,
        sg.relationship_type AS guardian_relation
      FROM public.student_guardians AS sg
      INNER JOIN public.guardians AS g
        ON g.tenant_id = sg.tenant_id
       AND g.id = sg.guardian_id
      WHERE sg.tenant_id = s.tenant_id
        AND sg.school_id = s.school_id
        AND (sg.branch_id = s.branch_id OR sg.branch_id IS NULL)
        AND sg.student_id = s.id
        AND sg.status = 'active'
        AND sg.deleted_at IS NULL
        AND g.deleted_at IS NULL
        AND g.status = 'active'
      ORDER BY sg.is_primary DESC, sg.created_at ASC
      LIMIT 1
    ) AS guardian ON TRUE
    WHERE ${predicates.join('\n      AND ')}
    ORDER BY s.${sortColumn} ${sortDirection}, s.id ASC
    LIMIT $${limitIndex} OFFSET $${offsetIndex}`;

  diagnosticTrace?.mark('student_postgres_query_started');
  diagnosticTrace?.count?.('studentDbQueries');
  studentReadDiagnostic?.log('postgres_call', 'STARTED');
  try {
    if (diagnosticTrace?.recordQuery) {
      await diagnosticTrace.recordQuery(transaction, sql, values, 'student');
    }
    const result = await transaction.query<CanonicalStudentRow>(sql, values);
    studentReadDiagnostic?.log('postgres_call', 'SUCCESS');
    diagnosticTrace?.mark('student_postgres_query_completed');
    diagnosticTrace?.mark('student_mapping_started');
    const rows = result.rows.map(mapCanonicalStudentRow);
    diagnosticTrace?.mark('student_mapping_completed');
    return { rows, totalCount: result.rows[0]?.total_count || 0 };
  } catch (error) {
    studentReadDiagnostic?.log('postgres_call', 'FAIL', safePostgresClassification(error));
    throw error;
  }
}

async function queryCanonicalStudentsFromSupabase(
  supabase: SupabaseClient,
  context: TenantContext,
  params: CanonicalStudentReadParams,
  maximumLimit = 100
): Promise<{ rows: Record<string, unknown>[]; totalCount: number }> {
  const page = normalizePage(params.page);
  const limit = normalizeLimit(params.limit, maximumLimit);
  const offset = (page - 1) * limit;
  const requestedSortBy = params.sortBy || 'registrationDate';
  const sortColumn = SORT_COLUMNS[requestedSortBy];
  if (!sortColumn) throw new ValidationError('حقل الترتيب المطلوب غير معتمد.');
  if (params.sortOrder !== undefined && params.sortOrder !== 'asc' && params.sortOrder !== 'desc') {
    throw new ValidationError('اتجاه الترتيب غير معتمد.');
  }

  let eligibleStudentIds: string[] | undefined;
  if (params.classroom || params.section) {
    let enrollmentQuery = supabase
      .from('enrollments')
      .select('student_id')
      .eq('tenant_id', context.tenantId)
      .eq('school_id', context.schoolId)
      .or(`branch_id.is.null,branch_id.eq.${context.branchId}`)
      .is('deleted_at', null)
      .in('enrollment_status', ['pending', 'active']);
    if (params.classroom) enrollmentQuery = enrollmentQuery.eq('class_reference', params.classroom);
    if (params.section) enrollmentQuery = enrollmentQuery.eq('section_reference', params.section);
    const { data: enrollmentRows, error: enrollmentError } = await enrollmentQuery;
    if (enrollmentError) throw enrollmentError;
    eligibleStudentIds = [...new Set((enrollmentRows || []).map(row => String((row as { student_id?: unknown }).student_id || '')).filter(Boolean))];
    if (eligibleStudentIds.length === 0) return { rows: [], totalCount: 0 };
  }

  let studentQuery = supabase
    .from('students')
    .select('id,tenant_id,school_id,branch_id,student_number,legal_first_name,legal_middle_name,legal_last_name,preferred_name,date_of_birth,gender,nationality,status,version,created_at,deleted_at', { count: 'exact' })
    .eq('tenant_id', context.tenantId)
    .eq('school_id', context.schoolId)
    .eq('branch_id', context.branchId)
    .is('deleted_at', null);
  if (eligibleStudentIds) studentQuery = studentQuery.in('id', eligibleStudentIds);
  if (params.status) studentQuery = studentQuery.eq('status', params.status === 'accepted' ? 'admitted' : params.status);
  if (params.gender) studentQuery = studentQuery.eq('gender', params.gender);
  const search = sqlSearchTerm(params.quickSearch);
  if (search) {
    const safeSearch = search.replace(/[%,()\\]/g, '');
    if (safeSearch) {
      const pattern = `*${safeSearch}*`;
      studentQuery = studentQuery.or([
        `student_number.ilike.${pattern}`,
        `legal_first_name.ilike.${pattern}`,
        `legal_middle_name.ilike.${pattern}`,
        `legal_last_name.ilike.${pattern}`,
        `preferred_name.ilike.${pattern}`
      ].join(','));
    }
  }

  const { data: studentRows, error: studentError, count } = await studentQuery
    .order(sortColumn, { ascending: params.sortOrder === 'asc' })
    .range(offset, offset + limit - 1);
  if (studentError) throw studentError;

  const rows = (studentRows || []) as Array<Record<string, unknown>>;
  const studentIds = rows.map(row => String(row.id || '')).filter(Boolean);
  const guardianLinks: Array<Record<string, unknown>> = [];
  if (studentIds.length) {
    const { data, error } = await supabase
      .from('student_guardians')
      .select('id,version,tenant_id,school_id,branch_id,guardian_id,student_id,relationship_type,status,deleted_at,is_primary,created_at')
      .eq('tenant_id', context.tenantId)
      .eq('school_id', context.schoolId)
      .or(`branch_id.is.null,branch_id.eq.${context.branchId}`)
      .in('student_id', studentIds)
      .eq('status', 'active')
      .is('deleted_at', null);
    if (error) throw error;
    guardianLinks.push(...((data || []) as Array<Record<string, unknown>>));
  }

  const guardianIds = [...new Set(guardianLinks.map(row => String(row.guardian_id || '')).filter(Boolean))];
  const guardianById = new Map<string, Record<string, unknown>>();
  if (guardianIds.length) {
    const { data, error } = await supabase
      .from('guardians')
      .select('id,version,tenant_id,school_id,branch_id,legal_first_name,legal_middle_name,legal_last_name,phone,status,deleted_at')
      .eq('tenant_id', context.tenantId)
      .eq('school_id', context.schoolId)
      .in('id', guardianIds)
      .eq('status', 'active')
      .is('deleted_at', null);
    if (error) throw error;
    for (const row of (data || []) as Array<Record<string, unknown>>) guardianById.set(String(row.id), row);
  }

  const mappedRows = rows.map(row => {
    const links = guardianLinks
      .filter(link => String(link.student_id || '') === String(row.id || ''))
      .sort((left, right) => Number(right.is_primary === true) - Number(left.is_primary === true) || String(left.created_at || '').localeCompare(String(right.created_at || '')));
    const link = links[0];
    const guardian = link ? guardianById.get(String(link.guardian_id || '')) : undefined;
    return mapCanonicalStudentRow({
      ...row,
      guardian_id: guardian?.id || null,
      guardian_version: guardian?.version || null,
      guardian_relationship_id: link?.id || null,
      guardian_relationship_version: link?.version || null,
      parent_name: guardian ? [guardian.legal_first_name, guardian.legal_middle_name, guardian.legal_last_name].filter(Boolean).join(' ') : null,
      parent_phone: guardian?.phone || null,
      guardian_relation: link?.relationship_type || null,
      class_reference: null,
      section_reference: null,
      total_count: count || 0
    } as unknown as CanonicalStudentRow);
  });

  return { rows: mappedRows, totalCount: count || 0 };
}

export class CanonicalStudentReadRepository {
  public static async advancedSearch(
    params: CanonicalStudentReadParams,
    trustedContext?: TenantContext,
    diagnosticTrace?: Perf004TraceLike,
    studentReadDiagnostic?: StudentReadDiagnostic,
    supabase?: SupabaseClient
  ): Promise<{
    data: Record<string, unknown>[];
    totalCount: number;
    page: number;
    limit: number;
  }> {
    const context = trustedContext;
    if (!context) throw new DatabaseError('Trusted tenant context is required before Student repository access.');
    if (!UnitOfWork.hasTransactionDriver()) {
      if (!supabase) throw new DatabaseError('Canonical Student reads require a trusted Supabase client or PostgreSQL transaction driver.');
      const result = await queryCanonicalStudentsFromSupabase(supabase, context, params, 100);
      return { data: result.rows, totalCount: result.totalCount, page: normalizePage(params.page), limit: normalizeLimit(params.limit) };
    }
    studentReadDiagnostic?.log('canonical_repository', 'REACHED');

    const page = normalizePage(params.page);
    const limit = normalizeLimit(params.limit);
    const executeRead = async () => {
      const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
      if (!transaction) throw new DatabaseError('Canonical Student read transaction is unavailable.');
      return queryCanonicalStudents(transaction, context, params, diagnosticTrace, 100, studentReadDiagnostic);
    };

    // PERF-007: Student Read may already be inside the request-scoped
    // transaction that performed trusted tenant validation. Reuse it rather
    // than opening a nested UnitOfWork or a second pool connection.
    const result = UnitOfWork.isTransactionActive()
      ? await executeRead()
      : await UnitOfWork.runInTransaction(
        context.schoolId,
        {
          operationName: 'Canonical Student Read',
          tenantId: context.tenantId,
          userId: context.userId,
          userName: context.userId,
          ipAddress: 'server',
          affectedTables: ['students'],
          diagnosticTrace
        },
        executeRead,
        context
      );

    return { data: result.rows, totalCount: result.totalCount, page, limit };
  }

  public static async exportSearch(
    params: Omit<CanonicalStudentReadParams, 'page' | 'limit'>,
    trustedContext?: TenantContext,
    diagnosticTrace?: Perf004TraceLike,
    supabase?: SupabaseClient
  ): Promise<{ data: Record<string, unknown>[]; totalCount: number }> {
    const context = trustedContext;
    if (!context) throw new DatabaseError('Trusted tenant context is required before Student export access.');
    if (!UnitOfWork.hasTransactionDriver()) {
      if (!supabase) throw new DatabaseError('Canonical Student exports require a trusted Supabase client or PostgreSQL transaction driver.');
      const result = await queryCanonicalStudentsFromSupabase(supabase, context, { ...params, page: 1, limit: 5001 }, 5001);
      return { data: result.rows, totalCount: result.totalCount };
    }

    const exportParams: CanonicalStudentReadParams = { ...params, page: 1, limit: 5001 };
    const executeRead = async () => {
      const transaction = UnitOfWork.getActiveContext()?.databaseTransaction;
      if (!transaction) throw new DatabaseError('Canonical Student export transaction is unavailable.');
      return queryCanonicalStudents(transaction, context, exportParams, diagnosticTrace, 5001);
    };

    const result = UnitOfWork.isTransactionActive()
      ? await executeRead()
      : await UnitOfWork.runInTransaction(
        context.schoolId,
        {
          operationName: 'Canonical Student Export Read',
          tenantId: context.tenantId,
          userId: context.userId,
          userName: context.userId,
          ipAddress: 'server',
          affectedTables: ['students', 'enrollments', 'guardians', 'student_guardians'],
          diagnosticTrace
        },
        executeRead,
        context
      );

    return { data: result.rows, totalCount: result.totalCount };
  }
}
