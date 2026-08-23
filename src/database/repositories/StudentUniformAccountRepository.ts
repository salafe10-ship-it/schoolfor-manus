import { getSupabaseClient } from '../client';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { FallbackStorage } from './FallbackStorage';
import { StudentUniformAccount } from '../../types';
import { IBaseRepository } from './IBaseRepository';
import { UnitOfWork } from '../UnitOfWork';

export class StudentUniformAccountRepository implements IBaseRepository<StudentUniformAccount> {
  public async getById(schoolId: string, id: string): Promise<StudentUniformAccount | null> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('student_uniform_accounts')
            .select('*')
            .eq('id', id)
            .single();
          if (!error && data) return data as StudentUniformAccount;
        }
      } catch (err: any) {
        EnterpriseLogger.error("Failed to fetch student uniform account by id:", "StudentUniformAccountRepository", { error: err });
      }
    }
    FallbackStorage.assertCanonicalPersistence('student uniform account by id read');
    return FallbackStorage.getStudentUniformAccounts().find(uni => uni.id === id) || null;
  }

  public async getByStudentId(schoolId: string, studentId: string): Promise<StudentUniformAccount | null> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('student_uniform_accounts')
            .select('*')
            .eq('student_id', studentId)
            .maybeSingle();
          if (!error && data) return data as StudentUniformAccount;
        }
      } catch (err: any) {
        EnterpriseLogger.error("Failed to fetch student uniform account by studentId:", "StudentUniformAccountRepository", { error: err });
      }
    }
    FallbackStorage.assertCanonicalPersistence('student uniform account by student read');
    return FallbackStorage.getStudentUniformAccounts().find(uni => uni.studentId === studentId) || null;
  }

  public async getAll(schoolId: string, options?: { studentId?: string }): Promise<{ data: StudentUniformAccount[]; count: number }> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          let query = supabase.from('student_uniform_accounts').select('*', { count: 'exact' });
          if (options?.studentId) {
            query = query.eq('student_id', options.studentId);
          }
          const { data, count, error } = await query;
          if (!error && data) {
            return { data: data as StudentUniformAccount[], count: count || data.length };
          }
        }
      } catch (err: any) {
        EnterpriseLogger.error("Failed to fetch student uniform account records:", "StudentUniformAccountRepository", { error: err });
      }
    }
    FallbackStorage.assertCanonicalPersistence('student uniform account list read');
    let data = FallbackStorage.getStudentUniformAccounts();
    if (options?.studentId) {
      data = data.filter(uni => uni.studentId === options.studentId);
    }
    return { data, count: data.length };
  }

  public async create(schoolId: string, item: Partial<StudentUniformAccount>): Promise<StudentUniformAccount> {
    const id = item.id || `uni_acc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newRecord: StudentUniformAccount = {
      id,
      studentId: item.studentId || '',
      uniformSize: item.uniformSize,
      piecesReceivedCount: item.piecesReceivedCount ?? 0,
      totalFees: item.totalFees ?? 0,
      paymentStatus: item.paymentStatus || 'unpaid'
    };

    return FallbackStorage.performWrite<StudentUniformAccount>(
      schoolId,
      'student_uniform_accounts',
      id,
      'INSERT',
      newRecord,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client");
        const { data, error } = await supabase.from('student_uniform_accounts').insert([newRecord]).select().single();
        if (error) throw error;
        return data as StudentUniformAccount;
      },
      () => {
        const all = FallbackStorage.getStudentUniformAccounts();
        all.unshift(newRecord);
        FallbackStorage.saveStudentUniformAccounts(all);
      }
    );
  }

  public async update(schoolId: string, id: string, item: Partial<StudentUniformAccount>): Promise<StudentUniformAccount> {
    const existing = await this.getById(schoolId, id);
    const updated = { ...existing, ...item } as StudentUniformAccount;

    return FallbackStorage.performWrite<StudentUniformAccount>(
      schoolId,
      'student_uniform_accounts',
      id,
      'UPDATE',
      updated,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client");
        const { data, error } = await supabase.from('student_uniform_accounts').update(item).eq('id', id).select().single();
        if (error) throw error;
        return data as StudentUniformAccount;
      },
      () => {
        const all = FallbackStorage.getStudentUniformAccounts();
        const idx = all.findIndex(uni => uni.id === id);
        if (idx !== -1) {
          all[idx] = updated;
          FallbackStorage.saveStudentUniformAccounts(all);
        }
      }
    );
  }

  public async delete(schoolId: string, id: string): Promise<boolean> {
    return FallbackStorage.performWrite<boolean>(
      schoolId,
      'student_uniform_accounts',
      id,
      'DELETE',
      true,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client");
        const { error } = await supabase.from('student_uniform_accounts').delete().eq('id', id);
        if (error) throw error;
        return true;
      },
      () => {
        const all = FallbackStorage.getStudentUniformAccounts();
        const filtered = all.filter(uni => uni.id !== id);
        FallbackStorage.saveStudentUniformAccounts(filtered);
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

  public static enlistCreateStudentUniformAccount(studentId: string, uniformId: string, uniAccount: any) {
    const sqlUniform = `INSERT INTO student_uniform_accounts (id, student_id, uniform_size, status, payment_status, total_fees) VALUES ('${uniformId}', '${studentId}', '${uniAccount.uniformSize}', 'active', 'unpaid', 350.00);`;
    UnitOfWork.enlistCreate('student_uniform_accounts', uniformId, uniAccount, { sqlText: sqlUniform, parameters: [], parameterTypes: [] } as any);
  }

  public static enlistDeleteStudentUniformAccount(id: string) {
    const sqlQuery = `DELETE FROM student_uniform_accounts WHERE id='${id}';`;
    UnitOfWork.enlistDelete('student_uniform_accounts', id, { sqlText: sqlQuery, parameters: [], parameterTypes: [] } as any);
  }
}
