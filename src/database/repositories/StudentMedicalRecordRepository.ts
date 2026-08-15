import { getSupabaseClient } from '../client';
import { FallbackStorage } from './FallbackStorage';
import { StudentMedicalRecord } from '../../types';
import { IBaseRepository } from './IBaseRepository';
import { UnitOfWork } from '../UnitOfWork';
import { SQLCommandBuilder } from '../transactions/SQLCommand';

export class StudentMedicalRecordRepository implements IBaseRepository<StudentMedicalRecord> {
  // Static Helper
  public static async hasActiveCases(schoolId: string, studentId: string): Promise<boolean> {
    const rows = await FallbackStorage.performRead<{ id: string }>(
      schoolId,
      'student_medical_records.hasActiveCases',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { data, error } = await supabase
          .from('student_medical_records')
          .select('id')
          .eq('student_id', studentId);
        if (error) throw error;
        return (data || []) as { id: string }[];
      },
      () => FallbackStorage.getStudentMedicalRecords()
        .filter(record => record.studentId === studentId)
        .map(record => ({ id: record.id }))
    );
    return rows.length > 0;
  }

  public async getById(schoolId: string, id: string): Promise<StudentMedicalRecord | null> {
    const rows = await FallbackStorage.performRead<StudentMedicalRecord>(
      schoolId,
      'student_medical_records.getById',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { data, error } = await supabase
          .from('student_medical_records')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return data ? [data as StudentMedicalRecord] : [];
      },
      () => FallbackStorage.getStudentMedicalRecords().filter(med => med.id === id)
    );
    return rows[0] || null;
  }

  public async getByStudentId(schoolId: string, studentId: string): Promise<StudentMedicalRecord | null> {
    const rows = await FallbackStorage.performRead<StudentMedicalRecord>(
      schoolId,
      'student_medical_records.getByStudentId',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { data, error } = await supabase
          .from('student_medical_records')
          .select('*')
          .eq('student_id', studentId)
          .maybeSingle();
        if (error) throw error;
        return data ? [data as StudentMedicalRecord] : [];
      },
      () => FallbackStorage.getStudentMedicalRecords().filter(med => med.studentId === studentId)
    );
    return rows[0] || null;
  }

  public async getAll(schoolId: string, options?: { studentId?: string }): Promise<{ data: StudentMedicalRecord[]; count: number }> {
    const data = await FallbackStorage.performRead<StudentMedicalRecord>(
      schoolId,
      'student_medical_records.getAll',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        let query = supabase.from('student_medical_records').select('*', { count: 'exact' });
        if (options?.studentId) query = query.eq('student_id', options.studentId);
        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as StudentMedicalRecord[];
      },
      () => {
        let fallback = FallbackStorage.getStudentMedicalRecords();
        if (options?.studentId) fallback = fallback.filter(med => med.studentId === options.studentId);
        return fallback;
      }
    );
    return { data, count: data.length };
  }

  public async create(schoolId: string, item: Partial<StudentMedicalRecord>): Promise<StudentMedicalRecord> {
    const id = item.id || `med_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newRecord: StudentMedicalRecord = {
      id,
      studentId: item.studentId || '',
      bloodType: item.bloodType,
      chronicDiseases: item.chronicDiseases,
      allergies: item.allergies,
      vaccinesTaken: item.vaccinesTaken ?? false,
      emergencyContactName: item.emergencyContactName,
      emergencyContactPhone: item.emergencyContactPhone,
      medicalNotes: item.medicalNotes
    };

    return FallbackStorage.performWrite<StudentMedicalRecord>(
      schoolId,
      'student_medical_records',
      id,
      'INSERT',
      newRecord,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client");
        const { data, error } = await supabase.from('student_medical_records').insert([newRecord]).select().single();
        if (error) throw error;
        return data as StudentMedicalRecord;
      },
      () => {
        const all = FallbackStorage.getStudentMedicalRecords();
        all.unshift(newRecord);
        FallbackStorage.saveStudentMedicalRecords(all);
      }
    );
  }

  public async update(schoolId: string, id: string, item: Partial<StudentMedicalRecord>): Promise<StudentMedicalRecord> {
    const existing = await this.getById(schoolId, id);
    const updated = { ...existing, ...item } as StudentMedicalRecord;

    return FallbackStorage.performWrite<StudentMedicalRecord>(
      schoolId,
      'student_medical_records',
      id,
      'UPDATE',
      updated,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client");
        const { data, error } = await supabase.from('student_medical_records').update(item).eq('id', id).select().single();
        if (error) throw error;
        return data as StudentMedicalRecord;
      },
      () => {
        const all = FallbackStorage.getStudentMedicalRecords();
        const idx = all.findIndex(med => med.id === id);
        if (idx !== -1) {
          all[idx] = updated;
          FallbackStorage.saveStudentMedicalRecords(all);
        }
      }
    );
  }

  public async delete(schoolId: string, id: string): Promise<boolean> {
    return FallbackStorage.performWrite<boolean>(
      schoolId,
      'student_medical_records',
      id,
      'DELETE',
      true,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client");
        const { error } = await supabase.from('student_medical_records').delete().eq('id', id);
        if (error) throw error;
        return true;
      },
      () => {
        const all = FallbackStorage.getStudentMedicalRecords();
        const filtered = all.filter(med => med.id !== id);
        FallbackStorage.saveStudentMedicalRecords(filtered);
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

  public static enlistCreateStudentMedicalRecord(studentId: string, medicalId: string, medicalRecord: any) {
    const command = SQLCommandBuilder.create({
      sqlText: `INSERT INTO student_medical_records (id, student_id, blood_type, chronic_diseases, allergies, vaccines_taken, emergency_contact_name, emergency_contact_phone) VALUES ($1, $2, $3, $4, $5, true, $6, $7);`,
      parameters: [medicalId, studentId, medicalRecord.bloodType, medicalRecord.chronicDiseases, medicalRecord.allergies, medicalRecord.emergencyContactName, medicalRecord.emergencyContactPhone],
      executionContext: 'Create Medical Record'
    });
    UnitOfWork.enlistCreate('student_medical_records', medicalId, medicalRecord, command);
  }

  public static enlistDeleteStudentMedicalRecord(id: string) {
    const command = SQLCommandBuilder.create({
      sqlText: `DELETE FROM student_medical_records WHERE id = $1;`,
      parameters: [id],
      executionContext: 'Delete Medical Record'
    });
    UnitOfWork.enlistDelete('student_medical_records', id, command);
  }
}
