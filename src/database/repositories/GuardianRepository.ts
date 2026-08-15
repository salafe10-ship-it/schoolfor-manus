import { getSupabaseClient } from '../client';
import { FallbackStorage } from './FallbackStorage';
import { Guardian } from '../../types';
import { IBaseRepository } from './IBaseRepository';
import { ValidationError } from '../../utils/errors';

export class GuardianRepository implements IBaseRepository<Guardian> {
  public async getById(schoolId: string, id: string): Promise<Guardian | null> {
    const rows = await FallbackStorage.performRead<Guardian>(
      schoolId,
      'guardians.getById',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { data, error } = await supabase
          .from('guardians')
          .select('*')
          .eq('school_id', schoolId)
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return data ? [data as Guardian] : [];
      },
      () => FallbackStorage.getGuardians().filter(g => g.schoolId === schoolId && g.id === id)
    );
    return rows[0] || null;
  }

  public async getAll(schoolId: string, options?: any): Promise<{ data: Guardian[]; count: number }> {
    const data = await FallbackStorage.performRead<Guardian>(
      schoolId,
      'guardians.getAll',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        let query = supabase.from('guardians').select('*', { count: 'exact' }).eq('school_id', schoolId);
        if (options?.search) {
          query = query.or(`name.ilike.%${options.search}%,national_id.ilike.%${options.search}%`);
        }
        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as Guardian[];
      },
      () => {
        let fallback = FallbackStorage.getGuardians().filter(g => g.schoolId === schoolId);
        if (options?.search) {
          const s = options.search.toLowerCase();
          fallback = fallback.filter(g => g.name.toLowerCase().includes(s) || g.nationalId.includes(s));
        }
        return fallback;
      }
    );
    return { data, count: data.length };
  }

  public async create(schoolId: string, item: Partial<Guardian>): Promise<Guardian> {
    throw new ValidationError('Guardian mutations must use the canonical StudentRegistrationService boundary.', {
      errorCode: 'STU-GUARD-001',
      reason: 'LEGACY_GUARDIAN_CREATE_BLOCKED',
      schoolId,
      itemId: item.id
    });
  }

  public async update(schoolId: string, id: string, item: Partial<Guardian>): Promise<Guardian> {
    throw new ValidationError('Guardian mutations must use the canonical StudentRegistrationService boundary.', {
      errorCode: 'STU-GUARD-002',
      reason: 'LEGACY_GUARDIAN_UPDATE_BLOCKED',
      schoolId,
      id
    });
  }

  public async delete(schoolId: string, id: string): Promise<boolean> {
    throw new ValidationError('Guardian mutations must use the canonical StudentRegistrationService boundary.', {
      errorCode: 'STU-GUARD-003',
      reason: 'LEGACY_GUARDIAN_DELETE_BLOCKED',
      schoolId,
      id
    });
  }

  public async exists(schoolId: string, id: string): Promise<boolean> {
    const record = await this.getById(schoolId, id);
    return record !== null;
  }

  public async count(schoolId: string, options?: any): Promise<number> {
    const { count } = await this.getAll(schoolId, options);
    return count;
  }

  public static enlistCreateGuardian(schoolId: string, guardianId: string, guardian: any) {
    throw new ValidationError('Guardian mutations must use the canonical StudentRegistrationService boundary.', {
      errorCode: 'STU-GUARD-001',
      reason: 'LEGACY_GUARDIAN_CREATE_BLOCKED',
      schoolId,
      guardianId
    });
  }

  public static enlistUpdateGuardian(guardianId: string, updatedGuardian: any) {
    throw new ValidationError('Guardian mutations must use the canonical StudentRegistrationService boundary.', {
      errorCode: 'STU-GUARD-002',
      reason: 'LEGACY_GUARDIAN_UPDATE_BLOCKED',
      guardianId
    });
  }
}
