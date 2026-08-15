import { getSupabaseClient } from '../client';
import { FallbackStorage } from './FallbackStorage';
import { StudentGuardian } from '../../types';
import { IBaseRepository } from './IBaseRepository';
import { requireRepositoryTenantContext } from '../../database/tenant/RepositoryIsolation';
import { ValidationError } from '../../utils/errors';

type ScopedStudentGuardian = StudentGuardian & {
  tenantId: string;
  schoolId: string;
  branchId: string;
  tenant_id?: string;
  school_id?: string;
  branch_id?: string;
};

function trustedScope(schoolId: string) {
  return requireRepositoryTenantContext({ schoolId });
}

function scopeValue(record: Partial<ScopedStudentGuardian>, key: 'tenant' | 'school' | 'branch'): string | undefined {
  const value = key === 'tenant'
    ? record.tenantId ?? record.tenant_id
    : key === 'school'
      ? record.schoolId ?? record.school_id
      : record.branchId ?? record.branch_id;
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function belongsToTrustedScope(record: Partial<ScopedStudentGuardian>, context: ReturnType<typeof trustedScope>): boolean {
  return scopeValue(record, 'tenant') === context.tenantId
    && scopeValue(record, 'school') === context.schoolId
    && scopeValue(record, 'branch') === context.branchId;
}

function canonicalMutationBlocked(operation: 'CREATE' | 'UPDATE' | 'DELETE'): never {
  throw new ValidationError(
    'Student guardian relationship mutations must use the canonical StudentRegistrationService boundary.',
    {
      errorCode: 'STU-GUARD-003',
      reason: 'LEGACY_RELATION_MUTATION_BLOCKED',
      operation
    }
  );
}

export class StudentGuardianRepository implements IBaseRepository<StudentGuardian> {
  public async getById(schoolId: string, id: string): Promise<StudentGuardian | null> {
    const context = trustedScope(schoolId);
    const rows = await FallbackStorage.performRead<StudentGuardian>(
      schoolId,
      'student_guardians.getById',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { data, error } = await supabase
          .from('student_guardians')
          .select('*')
          .eq('tenant_id', context.tenantId)
          .eq('school_id', context.schoolId)
          .eq('branch_id', context.branchId)
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return data ? [data as StudentGuardian] : [];
      },
      () => FallbackStorage.getStudentGuardians()
        .filter(sg => belongsToTrustedScope(sg as ScopedStudentGuardian, context) && sg.id === id)
    );
    return rows[0] || null;
  }

  public async getAll(schoolId: string, options?: { studentId?: string }): Promise<{ data: StudentGuardian[]; count: number }> {
    const context = trustedScope(schoolId);
    const data = await FallbackStorage.performRead<StudentGuardian>(
      schoolId,
      'student_guardians.getAll',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        let query = supabase
          .from('student_guardians')
          .select('*', { count: 'exact' })
          .eq('tenant_id', context.tenantId)
          .eq('school_id', context.schoolId)
          .eq('branch_id', context.branchId);
        if (options?.studentId) query = query.eq('student_id', options.studentId);
        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as StudentGuardian[];
      },
      () => {
        let fallback = FallbackStorage.getStudentGuardians()
          .filter(sg => belongsToTrustedScope(sg as ScopedStudentGuardian, context));
        if (options?.studentId) fallback = fallback.filter(sg => sg.studentId === options.studentId);
        return fallback;
      }
    );
    return { data, count: data.length };
  }

  public async create(schoolId: string, item: Partial<StudentGuardian>): Promise<StudentGuardian> {
    trustedScope(schoolId);
    return canonicalMutationBlocked('CREATE');
  }

  public async update(schoolId: string, id: string, item: Partial<StudentGuardian>): Promise<StudentGuardian> {
    trustedScope(schoolId);
    void id;
    void item;
    return canonicalMutationBlocked('UPDATE');
  }

  public async delete(schoolId: string, id: string): Promise<boolean> {
    trustedScope(schoolId);
    void id;
    return canonicalMutationBlocked('DELETE');
  }

  public async exists(schoolId: string, id: string): Promise<boolean> {
    const record = await this.getById(schoolId, id);
    return record !== null;
  }

  public async count(schoolId: string, options?: any): Promise<number> {
    const { count } = await this.getAll(schoolId, options);
    return count;
  }

  public static enlistCreateStudentGuardian(joinId: string, studentId: string, guardianId: string, relationship: string, joinItem: any) {
    void joinId;
    void studentId;
    void guardianId;
    void relationship;
    void joinItem;
    return canonicalMutationBlocked('CREATE');
  }
}
