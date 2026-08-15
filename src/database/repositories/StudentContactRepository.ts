import { getSupabaseClient } from '../client';
import { FallbackStorage } from './FallbackStorage';
import { StudentContact } from '../../types';
import { IBaseRepository } from './IBaseRepository';
import { UnitOfWork } from '../UnitOfWork';
import { SQLCommandBuilder } from '../transactions/SQLCommand';

export class StudentContactRepository implements IBaseRepository<StudentContact> {
  public async getById(schoolId: string, id: string): Promise<StudentContact | null> {
    const rows = await FallbackStorage.performRead<StudentContact>(
      schoolId,
      'student_contacts.getById',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { data, error } = await supabase.from('student_contacts').select('*').eq('id', id).maybeSingle();
        if (error) throw error;
        return data ? [data as StudentContact] : [];
      },
      () => FallbackStorage.getStudentContacts().filter(cont => cont.id === id)
    );
    return rows[0] || null;
  }

  public async getAll(schoolId: string, options?: { studentId?: string }): Promise<{ data: StudentContact[]; count: number }> {
    const data = await FallbackStorage.performRead<StudentContact>(
      schoolId,
      'student_contacts.getAll',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        let query = supabase.from('student_contacts').select('*', { count: 'exact' });
        if (options?.studentId) query = query.eq('student_id', options.studentId);
        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as StudentContact[];
      },
      () => {
        let fallback = FallbackStorage.getStudentContacts();
        if (options?.studentId) fallback = fallback.filter(cont => cont.studentId === options.studentId);
        return fallback;
      }
    );
    return { data, count: data.length };
  }

  public async create(schoolId: string, item: Partial<StudentContact>): Promise<StudentContact> {
    const id = item.id || `cont_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newRecord: StudentContact = {
      id,
      studentId: item.studentId || '',
      contactName: item.contactName || '',
      contactPhone: item.contactPhone || '',
      contactRelation: item.contactRelation || '',
      isEmergency: item.isEmergency ?? false
    };

    return FallbackStorage.performWrite<StudentContact>(
      schoolId,
      'student_contacts',
      id,
      'INSERT',
      newRecord,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client");
        const { data, error } = await supabase.from('student_contacts').insert([newRecord]).select().single();
        if (error) throw error;
        return data as StudentContact;
      },
      () => {
        const all = FallbackStorage.getStudentContacts();
        all.unshift(newRecord);
        FallbackStorage.saveStudentContacts(all);
      }
    );
  }

  public async update(schoolId: string, id: string, item: Partial<StudentContact>): Promise<StudentContact> {
    const existing = await this.getById(schoolId, id);
    const updated = { ...existing, ...item } as StudentContact;

    return FallbackStorage.performWrite<StudentContact>(
      schoolId,
      'student_contacts',
      id,
      'UPDATE',
      updated,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client");
        const { data, error } = await supabase.from('student_contacts').update(item).eq('id', id).select().single();
        if (error) throw error;
        return data as StudentContact;
      },
      () => {
        const all = FallbackStorage.getStudentContacts();
        const idx = all.findIndex(cont => cont.id === id);
        if (idx !== -1) {
          all[idx] = updated;
          FallbackStorage.saveStudentContacts(all);
        }
      }
    );
  }

  public async delete(schoolId: string, id: string): Promise<boolean> {
    return FallbackStorage.performWrite<boolean>(
      schoolId,
      'student_contacts',
      id,
      'DELETE',
      true,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client");
        const { error } = await supabase.from('student_contacts').delete().eq('id', id);
        if (error) throw error;
        return true;
      },
      () => {
        const all = FallbackStorage.getStudentContacts();
        const filtered = all.filter(cont => cont.id !== id);
        FallbackStorage.saveStudentContacts(filtered);
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

  public static enlistDeleteStudentContact(id: string) {
    const command = SQLCommandBuilder.create({
      sqlText: `DELETE FROM student_contacts WHERE id=$1;`,
      parameters: [id],
      executionContext: 'Delete Student Contact'
    });
    UnitOfWork.enlistDelete('student_contacts', id, command);
  }
}
