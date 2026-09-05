import { getSupabaseClient } from '../client';
import { FallbackStorage } from './FallbackStorage';
import { StudentLibraryAccount } from '../../types';
import { IBaseRepository } from './IBaseRepository';
import { UnitOfWork } from '../UnitOfWork';
import { SQLCommandBuilder } from '../transactions/SQLCommand';

export class StudentLibraryAccountRepository implements IBaseRepository<StudentLibraryAccount> {
  private static mapRow(row: any): StudentLibraryAccount {
    return {
      id: String(row.id),
      studentId: row.student_id ?? row.studentId ?? '',
      libraryCardNumber: row.library_card_number ?? row.libraryCardNumber ?? '',
      status: row.status ?? 'active',
      booksBorrowedCount: Number(row.books_borrowed_count ?? row.booksBorrowedCount ?? 0),
      unpaidFines: Number(row.unpaid_fines ?? row.unpaidFines ?? 0)
    } as StudentLibraryAccount;
  }

  private static belongsToSchool(record: any, schoolId: string): boolean {
    if (record.schoolId === schoolId || record.school_id === schoolId) return true;
    const student = FallbackStorage.getStudents().find(item => item.id === record.studentId || item.id === record.student_id);
    return (student as any)?.schoolId === schoolId || (student as any)?.school_id === schoolId;
  }

  public async getById(schoolId: string, id: string): Promise<StudentLibraryAccount | null> {
    const rows = await FallbackStorage.performRead<StudentLibraryAccount>(
      schoolId,
      'student_library_accounts.getById',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { data, error } = await supabase
          .from('student_library_accounts')
          .select('*, students!inner(school_id)')
          .eq('students.school_id', schoolId)
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return data ? [StudentLibraryAccountRepository.mapRow(data)] : [];
      },
      () => FallbackStorage.getStudentLibraryAccounts().filter(lib => lib.id === id && StudentLibraryAccountRepository.belongsToSchool(lib, schoolId))
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
          .select('*, students!inner(school_id)')
          .eq('students.school_id', schoolId)
          .eq('student_id', studentId)
          .maybeSingle();
        if (error) throw error;
        return data ? [StudentLibraryAccountRepository.mapRow(data)] : [];
      },
      () => FallbackStorage.getStudentLibraryAccounts().filter(lib => lib.studentId === studentId && StudentLibraryAccountRepository.belongsToSchool(lib, schoolId))
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
        let query = supabase.from('student_library_accounts').select('*, students!inner(school_id)', { count: 'exact' }).eq('students.school_id', schoolId);
        if (options?.studentId) query = query.eq('student_id', options.studentId);
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(StudentLibraryAccountRepository.mapRow);
      },
      () => {
        let fallback = FallbackStorage.getStudentLibraryAccounts().filter(lib => StudentLibraryAccountRepository.belongsToSchool(lib, schoolId));
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
        const { data, error } = await supabase.from('student_library_accounts').insert([{
          id,
          student_id: newRecord.studentId,
          library_card_number: newRecord.libraryCardNumber,
          status: newRecord.status,
          books_borrowed_count: newRecord.booksBorrowedCount,
          unpaid_fines: newRecord.unpaidFines
        }]).select().single();
        if (error) throw error;
        return StudentLibraryAccountRepository.mapRow(data);
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
        const dbItem: Record<string, unknown> = {};
        if (item.studentId !== undefined) dbItem.student_id = item.studentId;
        if (item.libraryCardNumber !== undefined) dbItem.library_card_number = item.libraryCardNumber;
        if (item.status !== undefined) dbItem.status = item.status;
        if (item.booksBorrowedCount !== undefined) dbItem.books_borrowed_count = item.booksBorrowedCount;
        if (item.unpaidFines !== undefined) dbItem.unpaid_fines = item.unpaidFines;
        const { data, error } = await supabase.from('student_library_accounts').update(dbItem).eq('id', id).select().single();
        if (error) throw error;
        return StudentLibraryAccountRepository.mapRow(data);
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
        const existing = await this.getById(schoolId, id);
        if (!existing) return false;
        const { error } = await supabase.from('student_library_accounts').delete().eq('id', id);
        if (error) throw error;
        return true;
      },
      () => {
        const all = FallbackStorage.getStudentLibraryAccounts();
        const filtered = all.filter(lib => !(lib.id === id && StudentLibraryAccountRepository.belongsToSchool(lib, schoolId)));
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
