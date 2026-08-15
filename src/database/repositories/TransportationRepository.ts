import { getSupabaseClient } from '../client';
import { FallbackStorage } from './FallbackStorage';
import { BusRoute } from '../../types';
import { TransportationValidator } from '../../validation/validators';
import { IBaseRepository } from './IBaseRepository';

/**
 * Repository class handling CRUD and data fetching operations for School Bus Routes.
 * Fully conforms to the IBaseRepository<BusRoute> enterprise interface.
 */
export class TransportationRepository implements IBaseRepository<BusRoute> {
  // Instance methods delegating to static methods for interface compliance

  /**
   * Retrieves a bus route by ID.
   */
  public async getById(schoolId: string, id: string): Promise<BusRoute | null> {
    return TransportationRepository.getById(schoolId, id);
  }

  /**
   * Retrieves all bus routes matching options.
   */
  public async getAll(schoolId: string, options?: any): Promise<BusRoute[]> {
    return TransportationRepository.getAll(schoolId, options);
  }

  /**
   * Creates a new bus route.
   */
  public async create(schoolId: string, item: Partial<BusRoute>): Promise<BusRoute> {
    return TransportationRepository.create(schoolId, item);
  }

  /**
   * Updates an existing bus route.
   */
  public async update(schoolId: string, id: string, item: Partial<BusRoute>): Promise<BusRoute> {
    return TransportationRepository.update(schoolId, id, item);
  }

  /**
   * Deletes a bus route.
   */
  public async delete(schoolId: string, id: string): Promise<boolean> {
    return TransportationRepository.delete(schoolId, id);
  }

  /**
   * Checks if a bus route exists.
   */
  public async exists(schoolId: string, id: string): Promise<boolean> {
    return TransportationRepository.exists(schoolId, id);
  }

  /**
   * Counts bus routes matching options.
   */
  public async count(schoolId: string, options?: any): Promise<number> {
    return TransportationRepository.count(schoolId, options);
  }

  // --- Static Methods ---

  /**
   * Checks if a student is registered for transportation.
   */
  public static async isRegistered(schoolId: string, studentId: string): Promise<boolean> {
    const rows = await FallbackStorage.performRead<{ id: string }>(
      schoolId,
      'student_buses.isRegistered',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { data, error } = await supabase.from('student_buses').select('id').eq('student_id', studentId);
        if (error) throw error;
        return (data || []) as { id: string }[];
      },
      () => []
    );
    return rows.length > 0;
  }

  /**
   * Retrieves a bus route by its unique ID.
   * @param schoolId - School enterprise tenant ID.
   * @param id - Unique bus route ID.
   */
  public static async getById(schoolId: string, id: string): Promise<BusRoute | null> {
    const rows = await FallbackStorage.performRead<BusRoute>(
      schoolId,
      'buses.getById',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { data, error } = await supabase
          .from('buses')
          .select('*')
          .eq('school_id', schoolId)
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return data ? [data as BusRoute] : [];
      },
      () => FallbackStorage.getBuses().filter(b => {
        const recordSchoolId = (b as any).schoolId ?? (b as any).school_id;
        return b.id === id && (!recordSchoolId || recordSchoolId === schoolId);
      })
    );
    return rows[0] || null;
  }

  /**
   * Retrieves all bus routes under tenant isolation.
   * @param schoolId - School enterprise tenant ID.
   * @param options - Filtering and searching parameters.
   */
  public static async getAll(
    schoolId: string,
    options?: { search?: string }
  ): Promise<BusRoute[]> {
    return FallbackStorage.performRead<BusRoute>(
      schoolId,
      'buses.getAll',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        let query = supabase.from('buses').select('*').eq('school_id', schoolId);
        if (options?.search) query = query.or(`route_number.ilike.%${options.search}%,driver_name.ilike.%${options.search}%`);
        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as BusRoute[];
      },
      () => {
        let buses = FallbackStorage.getBuses().filter(b => {
          const recordSchoolId = (b as any).schoolId ?? (b as any).school_id;
          return !recordSchoolId || recordSchoolId === schoolId;
        });
        if (options?.search) {
          const sLower = options.search.toLowerCase();
          buses = buses.filter(b => b.routeNumber.toLowerCase().includes(sLower) || b.driverName.toLowerCase().includes(sLower));
        }
        return buses;
      }
    );
  }

  /**
   * Creates/inserts a new bus route.
   */
  public static async create(schoolId: string, item: Partial<BusRoute>): Promise<BusRoute> {
    return this.save(schoolId, item);
  }

  /**
   * Updates an existing bus route.
   */
  public static async update(schoolId: string, id: string, item: Partial<BusRoute>): Promise<BusRoute> {
    return this.save(schoolId, { ...item, id });
  }

  /**
   * Core helper for saving or updating a bus route.
   */
  public static async save(schoolId: string, route: Partial<BusRoute>): Promise<BusRoute> {
    const id = route.id || `bus_${Date.now()}`;
    const newRoute: BusRoute = {
      ...(route as any),
      id,
      status: route.status || 'active',
      capacity: route.capacity || 30,
      currentStudents: route.currentStudents || 0
    };

    // Prevent any data from reaching database/storage before validation
    TransportationValidator.validate(newRoute);

    return FallbackStorage.performWrite<BusRoute>(
      schoolId,
      'buses',
      id,
      route.id ? 'UPDATE' : 'INSERT',
      newRoute,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { data, error } = await supabase
          .from('buses')
          .upsert({ ...newRoute, school_id: schoolId })
          .select()
          .single();
        if (error) throw error;
        return data as BusRoute;
      },
      () => {
        const all = FallbackStorage.getBuses();
        const idx = all.findIndex(b => b.id === id);
        if (idx > -1) all[idx] = { ...all[idx], ...newRoute };
        else all.push(newRoute);
        FallbackStorage.saveBuses(all);
      }
    );
  }

  /**
   * Deletes a bus route by ID.
   */
  public static async delete(schoolId: string, id: string): Promise<boolean> {
    let fallbackDeleted = true;
    await FallbackStorage.performWrite<boolean>(
      schoolId,
      'buses',
      id,
      'DELETE',
      true,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { error } = await supabase.from('buses').delete().eq('school_id', schoolId).eq('id', id);
        if (error) throw error;
        return true;
      },
      () => {
        const all = FallbackStorage.getBuses();
        const filtered = all.filter(b => b.id !== id);
        if (filtered.length === all.length) {
          fallbackDeleted = false;
          return;
        }
        FallbackStorage.saveBuses(filtered);
      }
    );
    return fallbackDeleted;
  }

  /**
   * Checks if a bus route exists.
   */
  public static async exists(schoolId: string, id: string): Promise<boolean> {
    const route = await this.getById(schoolId, id);
    return route !== null;
  }

  /**
   * Counts bus routes.
   */
  public static async count(schoolId: string, options?: any): Promise<number> {
    const list = await this.getAll(schoolId, options);
    return list.length;
  }
}
