import { getSupabaseClient } from '../client';
import { FallbackStorage } from './FallbackStorage';
import { StudentLibraryAccount } from '../../types';
import { IBaseRepository } from './IBaseRepository';
import { UnitOfWork } from '../UnitOfWork';
import { SQLCommandBuilder } from '../transactions/SQLCommand';

export class StudentLibraryAccountRepository implements IBaseRepository<StudentLibraryAccount> {
  public async getById(schoolId: string, id: string): Promise<StudentLibraryAccount | null> {
    const rows = await FallbackStorage.performRead<StudentLibraryAccount>(
      schoolId,
      'student_library_accounts.getById',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { data, error } = await supabase
          .from('student_library_accounts')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return data ? [data as StudentLibraryAccount] : [];
      },
      () => FallbackStorage.getStudentLibraryAccounts().filter(lib => lib.id === id)
    );
    return rows[0] || null;
  }

  public async getByStudentId(schoolId: string, studentId: string): Promise<StudentLibraryAccount | null> {
    const rows = await FallbackStorage.performRead<StudentLibraryAccount>(
      schoolId,
      'student_library_accounts.getByStudentId',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { data, error } = await supabase
          .from('student_library_accounts')
          .select('*')
          .eq('student_id', studentId)
          .maybeSingle();
        if (error) throw error;
        return data ? [data as StudentLibraryAccount] : [];
      },
      () => FallbackStorage.getStudentLibraryAccounts().filter(lib => lib.studentId === studentId)
    );
    return rows[0] || null;
  }

  public async getAll(schoolId: string, options?: { studentId?: string }): Promise<{ data: StudentLibraryAccount[]; count: number }> {
    const data = await FallbackStorage.performRead<StudentLibraryAccount>(
      schoolId,
      'student_library_accounts.getAll',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        let query = supabase.from('student_library_accounts').select('*', { count: 'exact' });
        if (options?.studentId) query = query.eq('student_id', options.studentId);
        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as StudentLibraryAccount[];
      },
      () => {
        let fallback = FallbackStorage.getStudentLibraryAccounts();
        if (options?.studentId) fallback = fallback.filter(lib => lib.studentId === options.studentId);
        return fallback;
      }
    );
    return { data, count: data.length };
  }

  public async create(schoolId: string, item: Partial<StudentLibraryAccount>): Promise<StudentLibraryAccount> {
    const id = item.id || `lib_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newRecord: StudentLibraryAccount = {
      id,
      studentId: item.studentId || '',
      libraryCardNumber: item.libraryCardNumber || `LC-${Math.floor(10000 + Math.random() * 90000)}`,
      status: item.status || 'active',
      booksBorrowedCount: item.booksBorrowedCount ?? 0,
      unpaidFines: item.unpaidFines ?? 0
    };

    return FallbackStorage.performWrite<StudentLibraryAccount>(
      schoolId,
      'student_library_accounts',
      id,
      'INSERT',
      newRecord,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client");
        const { data, error } = await supabase.from('student_library_accounts').insert([newRecord]).select().single();
        if (error) throw error;
        return data as StudentLibraryAccount;
      },
      () => {
        const all = FallbackStorage.getStudentLibraryAccounts();
        all.unshift(newRecord);
        FallbackStorage.saveStudentLibraryAccounts(all);
      }
    );
  }

  public async update(schoolId: string, id: string, item: Partial<StudentLibraryAccount>): Promise<StudentLibraryAccount> {
    const existing = await this.getById(schoolId, id);
    const updated = { ...existing, ...item } as StudentLibraryAccount;

    return FallbackStorage.performWrite<StudentLibraryAccount>(
      schoolId,
      'student_library_accounts',
      id,
      'UPDATE',
      updated,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client");
        const { data, error } = await supabase.from('student_library_accounts').update(item).eq('id', id).select().single();
        if (error) throw error;
        return data as StudentLibraryAccount;
      },
      () => {
        const all = FallbackStorage.getStudentLibraryAccounts();
        const idx = all.findIndex(lib => lib.id === id);
        if (idx !== -1) {
          all[idx] = updated;
          FallbackStorage.saveStudentLibraryAccounts(all);
        }
      }
    );
  }

  public async delete(schoolId: string, id: string): Promise<boolean> {
    return FallbackStorage.performWrite<boolean>(
      schoolId,
      'student_library_accounts',
      id,
      'DELETE',
      true,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client");
        const { error } = await supabase.from('student_library_accounts').delete().eq('id', id);
        if (error) throw error;
        return true;
      },
      () => {
        const all = FallbackStorage.getStudentLibraryAccounts();
        const filtered = all.filter(lib => lib.id !== id);
        FallbackStorage.saveStudentLibraryAccounts(filtered);
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

  public static enlistCreateStudentLibraryAccount(studentId: string, libraryId: string, libAccount: any) {
    const command = SQLCommandBuilder.create({
      sqlText: `INSERT INTO student_library_accounts (id, student_id, library_card_number, status, books_borrowed_count, unpaid_fines) VALUES ($1, $2, $3, 'active', 0, 0.00);`,
      parameters: [libraryId, studentId, libAccount.libraryCardNumber],
      executionContext: 'Create Library Account'
    });
    UnitOfWork.enlistCreate('student_library_accounts', libraryId, libAccount, command);
  }

  public static enlistDeleteStudentLibraryAccount(id: string) {
    const command = SQLCommandBuilder.create({
      sqlText: `DELETE FROM student_library_accounts WHERE id = $1;`,
      parameters: [id],
      executionContext: 'Delete Library Account'
    });
    UnitOfWork.enlistDelete('student_library_accounts', id, command);
  }
}
