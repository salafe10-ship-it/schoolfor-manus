import { getSupabaseClient } from '../client';
import { FallbackStorage } from './FallbackStorage';
import { StudentAsset } from '../../types';
import { IBaseRepository } from './IBaseRepository';

export class StudentAssetRepository implements IBaseRepository<StudentAsset> {
  // Static Helper
  public static async hasActiveAssets(schoolId: string, studentId: string): Promise<boolean> {
    const rows = await FallbackStorage.performRead<{ id: string }>(
      schoolId,
      'student_assets.hasActiveAssets',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { data, error } = await supabase
          .from('student_assets')
          .select('id')
          .eq('student_id', studentId)
          .eq('returned_date', null);
        if (error) throw error;
        return (data || []) as { id: string }[];
      },
      () => FallbackStorage.getStudentAssets()
        .filter(asset => asset.studentId === studentId && !asset.returnedDate)
        .map(asset => ({ id: asset.id }))
    );
    return rows.length > 0;
  }

  public async getById(schoolId: string, id: string): Promise<StudentAsset | null> {
    const rows = await FallbackStorage.performRead<StudentAsset>(
      schoolId,
      'student_assets.getById',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { data, error } = await supabase
          .from('student_assets')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return data ? [data as StudentAsset] : [];
      },
      () => FallbackStorage.getStudentAssets().filter(asset => asset.id === id)
    );
    return rows[0] || null;
  }

  public async getAll(schoolId: string, options?: { studentId?: string }): Promise<{ data: StudentAsset[]; count: number }> {
    const data = await FallbackStorage.performRead<StudentAsset>(
      schoolId,
      'student_assets.getAll',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        let query = supabase.from('student_assets').select('*', { count: 'exact' });
        if (options?.studentId) query = query.eq('student_id', options.studentId);
        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as StudentAsset[];
      },
      () => {
        let fallback = FallbackStorage.getStudentAssets();
        if (options?.studentId) fallback = fallback.filter(asset => asset.studentId === options.studentId);
        return fallback;
      }
    );
    return { data, count: data.length };
  }

  public async create(schoolId: string, item: Partial<StudentAsset>): Promise<StudentAsset> {
    const id = item.id || `asset_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newRecord: StudentAsset = {
      id,
      studentId: item.studentId || '',
      assetName: item.assetName || '',
      serialNumber: item.serialNumber,
      receivedDate: item.receivedDate || new Date().toISOString().split('T')[0],
      returnedDate: item.returnedDate,
      condition: item.condition || 'good'
    };

    return FallbackStorage.performWrite<StudentAsset>(
      schoolId,
      'student_assets',
      id,
      'INSERT',
      newRecord,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client");
        const { data, error } = await supabase.from('student_assets').insert([newRecord]).select().single();
        if (error) throw error;
        return data as StudentAsset;
      },
      () => {
        const all = FallbackStorage.getStudentAssets();
        all.unshift(newRecord);
        FallbackStorage.saveStudentAssets(all);
      }
    );
  }

  public async update(schoolId: string, id: string, item: Partial<StudentAsset>): Promise<StudentAsset> {
    const existing = await this.getById(schoolId, id);
    const updated = { ...existing, ...item } as StudentAsset;

    return FallbackStorage.performWrite<StudentAsset>(
      schoolId,
      'student_assets',
      id,
      'UPDATE',
      updated,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client");
        const { data, error } = await supabase.from('student_assets').update(item).eq('id', id).select().single();
        if (error) throw error;
        return data as StudentAsset;
      },
      () => {
        const all = FallbackStorage.getStudentAssets();
        const idx = all.findIndex(asset => asset.id === id);
        if (idx !== -1) {
          all[idx] = updated;
          FallbackStorage.saveStudentAssets(all);
        }
      }
    );
  }

  public async delete(schoolId: string, id: string): Promise<boolean> {
    return FallbackStorage.performWrite<boolean>(
      schoolId,
      'student_assets',
      id,
      'DELETE',
      true,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client");
        const { error } = await supabase.from('student_assets').delete().eq('id', id);
        if (error) throw error;
        return true;
      },
      () => {
        const all = FallbackStorage.getStudentAssets();
        const filtered = all.filter(asset => asset.id !== id);
        FallbackStorage.saveStudentAssets(filtered);
      }
    );
  }

  public async exists(schoolId: string, id: string): Promise<boolean> {
    const record = await this.getById(schoolId, id);
    return record !== null;
  }

  public async count(schoolId: string, options?: any): Promise<number> {
    const { count } = await this.getAll(schoolId, options);
    return count;
  }
}
