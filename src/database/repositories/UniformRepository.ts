import { getSupabaseClient } from '../client';
import { FallbackStorage } from './FallbackStorage';
import { UniformValidator } from '../../validation/validators';
import { IBaseRepository } from './IBaseRepository';

/**
 * Repository class handling CRUD and data fetching operations for School Uniforms inventory.
 * Fully conforms to the IBaseRepository<any> enterprise interface.
 */
export class UniformRepository implements IBaseRepository<any> {
  // Instance methods delegating to static methods for interface compliance

  /**
   * Retrieves a uniform item by ID.
   */
  public async getById(schoolId: string, id: string): Promise<any | null> {
    return UniformRepository.getById(schoolId, id);
  }

  /**
   * Retrieves all uniform items matching options.
   */
  public async getAll(schoolId: string, options?: any): Promise<any[]> {
    return UniformRepository.getAll(schoolId, options);
  }

  /**
   * Creates a new uniform item.
   */
  public async create(schoolId: string, item: any): Promise<any> {
    return UniformRepository.create(schoolId, item);
  }

  /**
   * Updates an existing uniform item.
   */
  public async update(schoolId: string, id: string, item: any): Promise<any> {
    return UniformRepository.update(schoolId, id, item);
  }

  /**
   * Deletes a uniform item.
   */
  public async delete(schoolId: string, id: string): Promise<boolean> {
    return UniformRepository.delete(schoolId, id);
  }

  /**
   * Checks if a uniform item exists.
   */
  public async exists(schoolId: string, id: string): Promise<boolean> {
    return UniformRepository.exists(schoolId, id);
  }

  /**
   * Counts uniform items matching options.
   */
  public async count(schoolId: string, options?: any): Promise<number> {
    return UniformRepository.count(schoolId, options);
  }

  // --- Static Methods ---

  /**
   * Checks if a student has any unpaid uniform fees.
   */
  public static async hasUnpaidUniform(schoolId: string, studentId: string): Promise<boolean> {
    const rows = await FallbackStorage.performRead<{ id: string }>(
      schoolId,
      'uniform_accounts.hasUnpaidUniform',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { data, error } = await supabase.from('uniform_accounts').select('id').eq('student_id', studentId).eq('status', 'unpaid');
        if (error) throw error;
        return (data || []) as { id: string }[];
      },
      () => []
    );
    return rows.length > 0;
  }

  /**
   * Retrieves a single uniform item by its unique ID.
   * @param schoolId - School enterprise tenant ID.
   * @param id - Unique uniform item ID.
   */
  public static async getById(schoolId: string, id: string): Promise<any | null> {
    const rows = await FallbackStorage.performRead<any>(
      schoolId,
      'uniforms.getById',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { data, error } = await supabase.from('uniforms').select('*').eq('school_id', schoolId).eq('id', id).maybeSingle();
        if (error) throw error;
        return data ? [data] : [];
      },
      () => FallbackStorage.getUniforms().filter(u => {
        const recordSchoolId = (u as any).schoolId ?? (u as any).school_id;
        return u.id === id && (!recordSchoolId || recordSchoolId === schoolId);
      })
    );
    return rows[0] || null;
  }

  /**
   * Retrieves all uniform items for a school.
   * @param schoolId - School enterprise tenant ID.
   * @param options - Ignored.
   */
  public static async getAll(schoolId: string, options?: any): Promise<any[]> {
    return FallbackStorage.performRead<any>(
      schoolId,
      'uniforms.getAll',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { data, error } = await supabase.from('uniforms').select('*').eq('school_id', schoolId);
        if (error) throw error;
        return data || [];
      },
      () => FallbackStorage.getUniforms().filter(u => {
        const recordSchoolId = (u as any).schoolId ?? (u as any).school_id;
        return !recordSchoolId || recordSchoolId === schoolId;
      })
    );
  }

  /**
   * Creates/inserts a new uniform item.
   */
  public static async create(schoolId: string, item: any): Promise<any> {
    return this.save(schoolId, item);
  }

  /**
   * Updates an existing uniform item.
   */
  public static async update(schoolId: string, id: string, item: any): Promise<any> {
    return this.save(schoolId, { ...item, id });
  }

  /**
   * Core helper for saving or updating a uniform item.
   */
  public static async save(schoolId: string, item: any): Promise<any> {
    const id = item.id || `uni_${Date.now()}`;
    const newItem = {
      ...item,
      id,
      school_id: schoolId
    };

    // Validate the uniform item before storing
    UniformValidator.validate(newItem);

    return FallbackStorage.performWrite<any>(
      schoolId,
      'uniforms',
      id,
      item.id ? 'UPDATE' : 'INSERT',
      newItem,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { data, error } = await supabase.from('uniforms').upsert(newItem).select().single();
        if (error) throw error;
        return data;
      },
      () => {
        const all = FallbackStorage.getUniforms();
        const idx = all.findIndex(u => u.id === id);
        if (idx > -1) all[idx] = { ...all[idx], ...item };
        else all.push({ ...item, id });
        FallbackStorage.saveUniforms(all);
      }
    );
  }

  /**
   * Deletes a uniform item.
   */
  public static async delete(schoolId: string, id: string): Promise<boolean> {
    let fallbackDeleted = true;
    await FallbackStorage.performWrite<boolean>(
      schoolId,
      'uniforms',
      id,
      'DELETE',
      true,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { error } = await supabase.from('uniforms').delete().eq('school_id', schoolId).eq('id', id);
        if (error) throw error;
        return true;
      },
      () => {
        const all = FallbackStorage.getUniforms();
        const filtered = all.filter(u => u.id !== id);
        if (filtered.length === all.length) {
          fallbackDeleted = false;
          return;
        }
        FallbackStorage.saveUniforms(filtered);
      }
    );
    return fallbackDeleted;
  }

  /**
   * Checks if uniform item exists.
   */
  public static async exists(schoolId: string, id: string): Promise<boolean> {
    const item = await this.getById(schoolId, id);
    return item !== null;
  }

  /**
   * Counts total uniform items.
   */
  public static async count(schoolId: string, options?: any): Promise<number> {
    const list = await this.getAll(schoolId, options);
    return list.length;
  }
}
