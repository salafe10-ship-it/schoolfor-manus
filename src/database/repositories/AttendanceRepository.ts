import { getSupabaseClient } from '../client';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { FallbackStorage } from './FallbackStorage';
import { Attendance } from '../../types';
import { AttendanceValidator } from '../../validation/validators';
import { IBaseRepository } from './IBaseRepository';
import { UnitOfWork } from '../UnitOfWork';
import { SQLCommandBuilder } from '../transactions/SQLCommand';

/**
 * Repository class handling CRUD and data fetching operations for Attendance.
 * Fully conforms to the IBaseRepository<Attendance> enterprise interface.
 */
export class AttendanceRepository implements IBaseRepository<Attendance> {
  // Instance methods delegating to static methods for interface compliance
  
  /**
   * Retrieves an attendance record by ID.
   */
  public async getById(schoolId: string, id: string): Promise<Attendance | null> {
    return AttendanceRepository.getById(schoolId, id);
  }

  /**
   * Retrieves all attendance records matching search criteria.
   */
  public async getAll(schoolId: string, options?: any): Promise<Attendance[]> {
    return AttendanceRepository.getAll(schoolId, options);
  }

  /**
   * Creates a new attendance record.
   */
  public async create(schoolId: string, item: Partial<Attendance>): Promise<Attendance> {
    return AttendanceRepository.create(schoolId, item);
  }

  /**
   * Updates an existing attendance record.
   */
  public async update(schoolId: string, id: string, item: Partial<Attendance>): Promise<Attendance> {
    return AttendanceRepository.update(schoolId, id, item);
  }

  /**
   * Deletes an attendance record.
   */
  public async delete(schoolId: string, id: string): Promise<boolean> {
    return AttendanceRepository.delete(schoolId, id);
  }

  /**
   * Checks if an attendance record exists.
   */
  public async exists(schoolId: string, id: string): Promise<boolean> {
    return AttendanceRepository.exists(schoolId, id);
  }

  /**
   * Counts attendance records matching the criteria.
   */
  public async count(schoolId: string, options?: any): Promise<number> {
    return AttendanceRepository.count(schoolId, options);
  }

  // --- Static Methods ---

  private static mapRow(row: any): Attendance {
    return {
      id: String(row.id),
      studentId: row.student_id ?? row.studentId ?? '',
      studentName: row.student_name ?? row.studentName ?? '',
      classroom: row.classroom ?? row.class_reference ?? '',
      date: row.date ?? row.attendance_date ?? '',
      status: row.status ?? row.attendance_status ?? 'present'
    } as Attendance;
  }

  private static toDbRecord(schoolId: string, record: Partial<Attendance>) {
    return {
      id: record.id,
      school_id: schoolId,
      student_id: record.studentId,
      student_name: record.studentName,
      classroom: record.classroom,
      date: record.date,
      status: record.status
    };
  }

  /**
   * Checks if a student has any attendance records.
   */
  public static async hasActiveAttendance(schoolId: string, studentId: string): Promise<boolean> {
    const rows = await FallbackStorage.performRead<{ id: string }>(
      schoolId,
      'attendance.hasActiveAttendance',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { data, error } = await supabase.from('attendance').select('id').eq('school_id', schoolId).eq('student_id', studentId);
        if (error) throw error;
        return (data || []) as { id: string }[];
      },
      () => FallbackStorage.getAttendance()
        .filter(record => record.studentId === studentId)
        .map(record => ({ id: record.id }))
    );
    return rows.length > 0;
  }

  /**
   * Retrieves an attendance record by its ID.
   * @param schoolId - School enterprise tenant ID.
   * @param id - Attendance record ID.
   */
  public static async getById(schoolId: string, id: string): Promise<Attendance | null> {
    const rows = await FallbackStorage.performRead<Attendance>(
      schoolId,
      'attendance.getById',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { data, error } = await supabase
          .from('attendance')
          .select('*')
          .eq('school_id', schoolId)
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return data ? [AttendanceRepository.mapRow(data)] : [];
      },
      () => FallbackStorage.getAttendance().filter(record => record.id === id && ((record as any).schoolId === schoolId || (record as any).school_id === schoolId))
    );
    return rows[0] || null;
  }

  /**
   * Retrieves all attendance records for a school with optional filters.
   * @param schoolId - School enterprise tenant ID.
   * @param options - Filtering parameters.
   */
  public static async getAll(
    schoolId: string,
    options?: { date?: string; classroom?: string }
  ): Promise<Attendance[]> {
    return FallbackStorage.performRead<Attendance>(
      schoolId,
      'attendance.getAll',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        let query = supabase
          .from('attendance')
          .select('*')
          .eq('school_id', schoolId);
        if (options?.date) query = query.eq('date', options.date);
        if (options?.classroom) query = query.eq('classroom', options.classroom);
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(AttendanceRepository.mapRow);
      },
      () => {
        let records = FallbackStorage.getAttendance().filter(r => ((r as any).schoolId === schoolId || (r as any).school_id === schoolId));
        if (options?.date) records = records.filter(r => r.date === options.date);
        if (options?.classroom) records = records.filter(r => r.classroom === options.classroom);
        return records;
      }
    );
  }

  /**
   * Creates a new single attendance record in the database.
   * @param schoolId - School enterprise tenant ID.
   * @param item - Attendance record attributes.
   */
  public static async create(schoolId: string, item: Partial<Attendance>): Promise<Attendance> {
    const id = item.id || `att_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newRecord: Attendance = {
      id,
      studentId: item.studentId || '',
      studentName: item.studentName || '',
      classroom: item.classroom || '',
      date: item.date || new Date().toISOString().split('T')[0],
      status: item.status || 'present'
    };

    AttendanceValidator.validateBulk([newRecord]);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('attendance')
          .insert([AttendanceRepository.toDbRecord(schoolId, newRecord)])
          .select()
          .single();
        if (!error && data) return AttendanceRepository.mapRow(data);
      } catch (err: any) {
        EnterpriseLogger.error("Failed to insert attendance into Supabase:", "AttendanceRepository", { error: err });
      }
    }

    FallbackStorage.assertCanonicalPersistence(`attendance create ${id}`);

    const all = FallbackStorage.getAttendance();
    all.unshift({ ...newRecord, schoolId } as Attendance);
    FallbackStorage.saveAttendance(all);
    return newRecord;
  }

  /**
   * Updates an existing attendance record.
   * @param schoolId - School enterprise tenant ID.
   * @param id - Attendance record ID.
   * @param item - Partial attendance updates.
   */
  public static async update(schoolId: string, id: string, item: Partial<Attendance>): Promise<Attendance> {
    const existing = await this.getById(schoolId, id);
    if (!existing) {
      throw new Error(`Attendance record with ID ${id} not found.`);
    }

    const updated = { ...existing, ...item };
    AttendanceValidator.validateBulk([updated]);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('attendance')
          .update(AttendanceRepository.toDbRecord(schoolId, { ...item, id }))
          .eq('school_id', schoolId)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return AttendanceRepository.mapRow(data);
      } catch (err: any) {
        EnterpriseLogger.error("Failed to update attendance in Supabase:", "AttendanceRepository", { error: err });
      }
    }

    FallbackStorage.assertCanonicalPersistence(`attendance update ${id}`);

    const all = FallbackStorage.getAttendance();
    const idx = all.findIndex(r => r.id === id && ((r as any).schoolId === schoolId || (r as any).school_id === schoolId));
    if (idx > -1) {
      all[idx] = updated;
      FallbackStorage.saveAttendance(all);
    }
    return updated;
  }

  /**
   * Deletes an attendance record from the database.
   * @param schoolId - School enterprise tenant ID.
   * @param id - Attendance record ID.
   */
  public static async delete(schoolId: string, id: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase
          .from('attendance')
          .delete()
          .eq('school_id', schoolId)
          .eq('id', id);
        if (!error) return true;
      } catch (err: any) {
        EnterpriseLogger.error("Failed to delete attendance from Supabase:", "AttendanceRepository", { error: err });
      }
    }

    FallbackStorage.assertCanonicalPersistence(`attendance delete ${id}`);

    const all = FallbackStorage.getAttendance();
    const filtered = all.filter(r => !(r.id === id && ((r as any).schoolId === schoolId || (r as any).school_id === schoolId)));
    if (filtered.length === all.length) return false;
    FallbackStorage.saveAttendance(filtered);
    return true;
  }

  /**
   * Verifies if an attendance record exists.
   * @param schoolId - School enterprise tenant ID.
   * @param id - Attendance record ID.
   */
  public static async exists(schoolId: string, id: string): Promise<boolean> {
    const record = await this.getById(schoolId, id);
    return record !== null;
  }

  /**
   * Counts attendance records under tenant isolation with optional criteria.
   * @param schoolId - School enterprise tenant ID.
   * @param options - Filtering parameters.
   */
  public static async count(schoolId: string, options?: any): Promise<number> {
    const records = await this.getAll(schoolId, options);
    return records.length;
  }

  /**
   * Saves bulk attendance records (helper).
   */
  public static async saveBulk(schoolId: string, records: Partial<Attendance>[]): Promise<number> {
    const prepared = records.map(r => ({
      ...r,
      id: r.id || `att_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    }));

    AttendanceValidator.validateBulk(prepared);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('attendance')
          .insert(prepared.map(record => AttendanceRepository.toDbRecord(schoolId, record)))
          .select();
        if (!error && data) return data.length;
      } catch (err: any) {
        EnterpriseLogger.error("Failed to save attendance bulk in Supabase:", "AttendanceRepository", { error: err });
      }
    }

    FallbackStorage.assertCanonicalPersistence(`attendance bulk save ${prepared.length}`);

    const all = FallbackStorage.getAttendance();
    FallbackStorage.saveAttendance([...prepared.map(record => ({ ...record, schoolId } as Attendance)), ...all]);
    return prepared.length;
  }

  public static enlistCreateAttendance(schoolId: string, attendanceId: string, attendance: any) {
    const command = SQLCommandBuilder.create({
      sqlText: `INSERT INTO attendance (id, school_id, student_id, student_name, date, status, notes) VALUES ($1, $2, $3, $4, $5, 'present', 'تهيئة حضور تلقائي عند التسجيل الجديد');`,
      parameters: [attendanceId, schoolId, attendance.studentId, attendance.studentName, attendance.date],
      executionContext: 'Create Attendance'
    });
    UnitOfWork.enlistCreate('attendance', attendanceId, attendance, command);
  }

  public static enlistUpdateStudentName(attendanceId: string, studentName: string, updatedAtt: any) {
    const command = SQLCommandBuilder.create({
      sqlText: `UPDATE attendance SET student_name = $1 WHERE id = $2;`,
      parameters: [studentName, attendanceId],
      executionContext: 'Update Attendance Student Name'
    });
    UnitOfWork.enlistUpdate('attendance', attendanceId, updatedAtt, command);
  }
}
