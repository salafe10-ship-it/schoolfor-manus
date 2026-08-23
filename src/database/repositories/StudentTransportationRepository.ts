import { getSupabaseClient } from '../client';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { FallbackStorage } from './FallbackStorage';
import { StudentTransportation } from '../../types';
import { IBaseRepository } from './IBaseRepository';
import { UnitOfWork } from '../UnitOfWork';
import { SQLCommandBuilder } from '../transactions/SQLCommand';

export class StudentTransportationRepository implements IBaseRepository<StudentTransportation> {
  public async getById(schoolId: string, id: string): Promise<StudentTransportation | null> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('student_transportation')
            .select('*')
            .eq('id', id)
            .single();
          if (!error && data) return data as StudentTransportation;
        }
      } catch (err: any) {
        EnterpriseLogger.error("Failed to fetch student transportation by id:", "StudentTransportationRepository", { error: err });
      }
    }
    FallbackStorage.assertCanonicalPersistence('student transportation by id read');
    return FallbackStorage.getStudentTransportation().find(trans => trans.id === id) || null;
  }

  public async getByStudentId(schoolId: string, studentId: string): Promise<StudentTransportation | null> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('student_transportation')
            .select('*')
            .eq('student_id', studentId)
            .maybeSingle();
          if (!error && data) return data as StudentTransportation;
        }
      } catch (err: any) {
        EnterpriseLogger.error("Failed to fetch student transportation by studentId:", "StudentTransportationRepository", { error: err });
      }
    }
    FallbackStorage.assertCanonicalPersistence('student transportation by student read');
    return FallbackStorage.getStudentTransportation().find(trans => trans.studentId === studentId) || null;
  }

  public async getAll(schoolId: string, options?: { studentId?: string }): Promise<{ data: StudentTransportation[]; count: number }> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          let query = supabase.from('student_transportation').select('*', { count: 'exact' });
          if (options?.studentId) {
            query = query.eq('student_id', options.studentId);
          }
          const { data, count, error } = await query;
          if (!error && data) {
            return { data: data as StudentTransportation[], count: count || data.length };
          }
        }
      } catch (err: any) {
        EnterpriseLogger.error("Failed to fetch student transportation records:", "StudentTransportationRepository", { error: err });
      }
    }
    FallbackStorage.assertCanonicalPersistence('student transportation list read');
    let data = FallbackStorage.getStudentTransportation();
    if (options?.studentId) {
      data = data.filter(trans => trans.studentId === options.studentId);
    }
    return { data, count: data.length };
  }

  public async create(schoolId: string, item: Partial<StudentTransportation>): Promise<StudentTransportation> {
    const id = item.id || `trans_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newRecord: StudentTransportation = {
      id,
      studentId: item.studentId || '',
      routeNumber: item.routeNumber,
      pickupPoint: item.pickupPoint,
      dropoffPoint: item.dropoffPoint,
      monthlyFees: item.monthlyFees ?? 0,
      status: item.status || 'active'
    };

    return FallbackStorage.performWrite<StudentTransportation>(
      schoolId,
      'student_transportation',
      id,
      'INSERT',
      newRecord,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client");
        const { data, error } = await supabase.from('student_transportation').insert([newRecord]).select().single();
        if (error) throw error;
        return data as StudentTransportation;
      },
      () => {
        const all = FallbackStorage.getStudentTransportation();
        all.unshift(newRecord);
        FallbackStorage.saveStudentTransportation(all);
      }
    );
  }

  public async update(schoolId: string, id: string, item: Partial<StudentTransportation>): Promise<StudentTransportation> {
    const existing = await this.getById(schoolId, id);
    const updated = { ...existing, ...item } as StudentTransportation;

    return FallbackStorage.performWrite<StudentTransportation>(
      schoolId,
      'student_transportation',
      id,
      'UPDATE',
      updated,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client");
        const { data, error } = await supabase.from('student_transportation').update(item).eq('id', id).select().single();
        if (error) throw error;
        return data as StudentTransportation;
      },
      () => {
        const all = FallbackStorage.getStudentTransportation();
        const idx = all.findIndex(trans => trans.id === id);
        if (idx !== -1) {
          all[idx] = updated;
          FallbackStorage.saveStudentTransportation(all);
        }
      }
    );
  }

  public async delete(schoolId: string, id: string): Promise<boolean> {
    return FallbackStorage.performWrite<boolean>(
      schoolId,
      'student_transportation',
      id,
      'DELETE',
      true,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client");
        const { error } = await supabase.from('student_transportation').delete().eq('id', id);
        if (error) throw error;
        return true;
      },
      () => {
        const all = FallbackStorage.getStudentTransportation();
        const filtered = all.filter(trans => trans.id !== id);
        FallbackStorage.saveStudentTransportation(filtered);
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

  public static enlistCreateStudentTransportation(studentId: string, transportId: string, transProfile: any) {
    const command = SQLCommandBuilder.create({
      sqlText: `INSERT INTO student_transportation (id, student_id, route_number, pickup_point, drop_off_point, status, monthly_fees) VALUES ($1, $2, $3, $4, $5, 'active', 250.00);`,
      parameters: [transportId, studentId, transProfile.routeNumber, transProfile.pickupPoint, transProfile.dropOffPoint],
      executionContext: 'Create Transportation'
    });
    UnitOfWork.enlistCreate('student_transportation', transportId, transProfile, command);
  }

  public static enlistDeleteStudentTransportation(id: string) {
    const command = SQLCommandBuilder.create({
      sqlText: `DELETE FROM student_transportation WHERE id = $1;`,
      parameters: [id],
      executionContext: 'Delete Transportation'
    });
    UnitOfWork.enlistDelete('student_transportation', id, command);
  }
}
