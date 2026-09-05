import { getSupabaseClient } from '../client';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { FallbackStorage } from './FallbackStorage';
import { StudentUniformAccount } from '../../types';
import { IBaseRepository } from './IBaseRepository';
import { UnitOfWork } from '../UnitOfWork';

export class StudentUniformAccountRepository implements IBaseRepository<StudentUniformAccount> {
  private static mapRow(row: any): StudentUniformAccount {
    return {
      id: String(row.id),
      studentId: row.student_id ?? row.studentId ?? '',
      uniformSize: row.uniform_size ?? row.uniformSize,
      piecesReceivedCount: Number(row.pieces_received_count ?? row.piecesReceivedCount ?? 0),
      totalFees: Number(row.total_fees ?? row.totalFees ?? 0),
      paymentStatus: row.payment_status ?? row.paymentStatus ?? 'unpaid'
    } as StudentUniformAccount;
  }

  private static belongsToSchool(record: any, schoolId: string): boolean {
    if (record.schoolId === schoolId || record.school_id === schoolId) return true;
    const student = FallbackStorage.getStudents().find(item => item.id === record.studentId || item.id === record.student_id);
    return (student as any)?.schoolId === schoolId || (student as any)?.school_id === schoolId;
  }

  public async getById(schoolId: string, id: string): Promise<StudentUniformAccount | null> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('student_uniform_accounts')
            .select('*, students!inner(school_id)')
            .eq('students.school_id', schoolId)
            .eq('id', id)
            .single();
          if (!error && data) return StudentUniformAccountRepository.mapRow(data);
        }
      } catch (err: any) {
        EnterpriseLogger.error("Failed to fetch student uniform account by id:", "StudentUniformAccountRepository", { error: err });
      }
    }
    FallbackStorage.assertCanonicalPersistence('student uniform account by id read');
    return FallbackStorage.getStudentUniformAccounts().find(uni => uni.id === id && StudentUniformAccountRepository.belongsToSchool(uni, schoolId)) || null;
  }

  public async getByStudentId(schoolId: string, studentId: string): Promise<StudentUniformAccount | null> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('student_uniform_accounts')
            .select('*, students!inner(school_id)')
            .eq('students.school_id', schoolId)
            .eq('student_id', studentId)
            .maybeSingle();
          if (!error && data) return StudentUniformAccountRepository.mapRow(data);
        }
      } catch (err: any) {
        EnterpriseLogger.error("Failed to fetch student uniform account by studentId:", "StudentUniformAccountRepository", { error: err });
      }
    }
    FallbackStorage.assertCanonicalPersistence('student uniform account by student read');
    return FallbackStorage.getStudentUniformAccounts().find(uni => uni.studentId === studentId && StudentUniformAccountRepository.belongsToSchool(uni, schoolId)) || null;
  }

  public async getAll(schoolId: string, options?: { studentId?: string }): Promise<{ data: StudentUniformAccount[]; count: number }> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          let query = supabase.from('student_uniform_accounts').select('*, students!inner(school_id)', { count: 'exact' }).eq('students.school_id', schoolId);
          if (options?.studentId) {
            query = query.eq('student_id', options.studentId);
          }
          const { data, count, error } = await query;
          if (!error && data) {
            return { data: data.map(StudentUniformAccountRepository.mapRow), count: count || data.length };
          }
        }
      } catch (err: any) {
        EnterpriseLogger.error("Failed to fetch student uniform account records:", "StudentUniformAccountRepository", { error: err });
      }
    }
    FallbackStorage.assertCanonicalPersistence('student uniform account list read');
    let data = FallbackStorage.getStudentUniformAccounts().filter(uni => StudentUniformAccountRepository.belongsToSchool(uni, schoolId));
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
        const { data, error } = await supabase.from('student_uniform_accounts').insert([{
          id,
          student_id: newRecord.studentId,
          uniform_size: newRecord.uniformSize,
          pieces_received_count: newRecord.piecesReceivedCount,
          total_fees: newRecord.totalFees,
          payment_status: newRecord.paymentStatus,
          status: 'active'
        }]).select().single();
        if (error) throw error;
        return StudentUniformAccountRepository.mapRow(data);
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
        const dbItem: Record<string, unknown> = {};
        if (item.studentId !== undefined) dbItem.student_id = item.studentId;
        if (item.uniformSize !== undefined) dbItem.uniform_size = item.uniformSize;
        if (item.piecesReceivedCount !== undefined) dbItem.pieces_received_count = item.piecesReceivedCount;
        if (item.totalFees !== undefined) dbItem.total_fees = item.totalFees;
        if (item.paymentStatus !== undefined) dbItem.payment_status = item.paymentStatus;
        const { data, error } = await supabase.from('student_uniform_accounts').update(dbItem).eq('id', id).select().single();
        if (error) throw error;
        return StudentUniformAccountRepository.mapRow(data);
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
        const existing = await this.getById(schoolId, id);
        if (!existing) return false;
        const { error } = await supabase.from('student_uniform_accounts').delete().eq('id', id);
        if (error) throw error;
        return true;
      },
      () => {
        const all = FallbackStorage.getStudentUniformAccounts();
        const filtered = all.filter(uni => !(uni.id === id && StudentUniformAccountRepository.belongsToSchool(uni, schoolId)));
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
