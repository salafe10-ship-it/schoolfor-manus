import { getSupabaseClient } from '../client';
import { Student, AuditMetadata } from '../../types';
import { StudentStatus } from '../../modules/student-admission/domain/StudentLifecycle';
import { StudentValidator } from '../../validation/validators';
import { UnitOfWork } from '../UnitOfWork';
import { AuditRepository } from './AuditRepository';
import { FinancialRepository } from './FinancialRepository';
import { AttendanceRepository } from './AttendanceRepository';
import { ExamsRepository } from './ExamsRepository';
import { LibraryRepository } from './LibraryRepository';
import { TransportationRepository } from './TransportationRepository';
import { UniformRepository } from './UniformRepository';
import { StudentAssetRepository } from './StudentAssetRepository';
import { StudentDocumentRepository } from './StudentDocumentRepository';
import { StudentMedicalRecordRepository } from './StudentMedicalRecordRepository';
import { filterStudentUpdateData } from '../dto/StudentDTO';
import { FallbackStorage } from './FallbackStorage';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { ParameterizedCommand, SQLCommandBuilder } from '../transactions/SQLCommand';

/**
 * Enterprise Student Repository.
 * Implements optimistic locking, soft deletion, audit trail, and constraint checks.
 */
export class StudentRepository {
  private static CACHE: Map<string, { data: Student; timestamp: number }> = new Map();
  private static CACHE_TTL = 300000; // 5 minutes

  private static async validateConstraints(schoolId: string, studentId: string): Promise<string[]> {
    const reasons: string[] = [];
    if (await FinancialRepository.hasOutstandingInvoices(schoolId, studentId)) reasons.push('وجود فواتير غير مسددة');
    if (await AttendanceRepository.hasActiveAttendance(schoolId, studentId)) reasons.push('وجود سجل حضور نشط');
    if (await ExamsRepository.hasActiveExams(schoolId, studentId)) reasons.push('وجود امتحانات معلقة');
    if (await LibraryRepository.hasBorrowedBooks(schoolId, studentId)) reasons.push('وجود كتب مستعارة');
    if (await TransportationRepository.isRegistered(schoolId, studentId)) reasons.push('مشترك بخدمة النقل');
    if (await UniformRepository.hasUnpaidUniform(schoolId, studentId)) reasons.push('وجود رسوم زي غير مسددة');
    if (await StudentMedicalRecordRepository.hasActiveCases(schoolId, studentId)) reasons.push('وجود سجلات طبية نشطة');
    if (await StudentAssetRepository.hasActiveAssets(schoolId, studentId)) reasons.push('وجود عهد مستلمة');
    if (await StudentDocumentRepository.hasActiveDocuments(schoolId, studentId)) reasons.push('وجود وثائق هامة');
    return reasons;
  }

  private static async withRetry<T>(operation: () => Promise<T>, retries = 3): Promise<T> {
    try {
      return await operation();
    } catch (err) {
      if (retries > 0) return this.withRetry(operation, retries - 1);
      throw err;
    }
  }

  private static async runCanonicalMutation<T>(operation: () => Promise<T>): Promise<T> {
    // Mutation retries are intentionally manual. A timeout can leave the
    // remote outcome unknown; replaying INSERT/UPDATE/DELETE here can create
    // duplicates or duplicate audit events.
    return operation();
  }

  public static async create(schoolId: string, data: Partial<Student>, meta: AuditMetadata): Promise<Student> {
    // 1. Duplicate Detection
    const existing = await this.findDuplicate(schoolId, data);
    if (existing) throw new Error(`سجل مكرر موجود مسبقاً: ${existing.id}`);

    const newStudent: Student = {
      ...data,
      id: data.id || `stud_${Date.now()}`,
      schoolId,
      version: 1,
      isDeleted: false,
      status: 'active',
      registrationDate: data.registrationDate || new Date().toISOString()
    } as Student;

    StudentValidator.validate(newStudent);

    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        return await this.runCanonicalMutation(async () => {
          const supabase = getSupabaseClient();
          if (!supabase) throw new Error("No Supabase client available");
          const { data: created, error } = await supabase.from('students').insert(newStudent).select().single();
          if (error) throw error;
          
          await AuditRepository.log(
            schoolId, 
            meta.userId, 
            meta.userName, 
            meta.userRole, 
            'CREATE', 
            'STUDENT', 
            meta.ipAddress, 
            `إنشاء طالب جديد: ${newStudent.id}`,
            { affectedRecord: newStudent.id, valuesAfter: created }
          );
          return created;
        });
      } catch (err: any) {
        EnterpriseLogger.error("Supabase create student failed; canonical outcome is unknown:", "StudentRepository", { error: err?.message || err });
        FallbackStorage.assertCanonicalPersistence('student create');
      }
    }

    FallbackStorage.assertCanonicalPersistence('student create');

    // Local Fallback Storage implementation
    const currentStudents = FallbackStorage.getStudents();
    currentStudents.push(newStudent);
    FallbackStorage.saveStudents(currentStudents);

    await AuditRepository.log(
      schoolId, 
      meta.userId, 
      meta.userName, 
      meta.userRole, 
      'CREATE', 
      'STUDENT', 
      meta.ipAddress, 
      `إنشاء طالب جديد محلياً (طوارئ): ${newStudent.id}`,
      { affectedRecord: newStudent.id, valuesAfter: newStudent }
    );
    return newStudent;
  }

  public static async update(schoolId: string, id: string, data: Partial<Student>, meta: AuditMetadata): Promise<Student> {
    const existing = await this.getById(schoolId, id);
    if (!existing) throw new Error('الطالب غير موجود');
    if (existing.isDeleted) throw new Error('الطالب محذوف');

    // Filter data to prevent Mass Assignment
    const filteredData = filterStudentUpdateData(data);

    // Optimistic Locking
    if (data.version !== undefined && data.version !== existing.version) {
      throw new Error('تعارض في التعديل: تم تحديث السجل من قبل مستخدم آخر');
    }

    const updated: Student = {
      ...existing,
      ...filteredData,
      version: existing.version + 1
    };

    StudentValidator.validate(updated);

    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        return await this.runCanonicalMutation(async () => {
          const supabase = getSupabaseClient();
          if (!supabase) throw new Error("No Supabase client available");
          const { data: res, error } = await supabase
            .from('students')
            .update(updated)
            .eq('id', id)
            .eq('school_id', schoolId)
            .eq('version', existing.version) // Optimistic Locking
            .select()
            .single();
          
          if (error) throw error;

          await AuditRepository.log(
            schoolId, 
            meta.userId, 
            meta.userName, 
            meta.userRole, 
            'UPDATE', 
            'STUDENT', 
            meta.ipAddress, 
            `تعديل الطالب: ${id}`,
            { affectedRecord: id, valuesBefore: existing, valuesAfter: res }
          );
          this.CACHE.delete(id);
          return res;
        });
      } catch (err: any) {
        EnterpriseLogger.error("Supabase update student failed; canonical outcome is unknown:", "StudentRepository", { error: err?.message || err });
        FallbackStorage.assertCanonicalPersistence('student update');
      }
    }

    FallbackStorage.assertCanonicalPersistence('student update');

    // Local Fallback Storage implementation
    const currentStudents = FallbackStorage.getStudents();
    const updatedStudents = currentStudents.map(s => (s.id === id && s.schoolId === schoolId) ? updated : s);
    FallbackStorage.saveStudents(updatedStudents);

    await AuditRepository.log(
      schoolId, 
      meta.userId, 
      meta.userName, 
      meta.userRole, 
      'UPDATE', 
      'STUDENT', 
      meta.ipAddress, 
      `تعديل الطالب محلياً (طوارئ): ${id}`,
      { affectedRecord: id, valuesBefore: existing, valuesAfter: updated }
    );
    this.CACHE.delete(id);
    return updated;
  }

  public static async delete(schoolId: string, id: string, meta: AuditMetadata, reason: string): Promise<void> {
    const constraints = await this.validateConstraints(schoolId, id);
    if (constraints.length > 0) throw new Error(`لا يمكن حذف الطالب: ${constraints.join(', ')}`);

    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        return await this.runCanonicalMutation(async () => {
          const supabase = getSupabaseClient();
          if (!supabase) throw new Error("No Supabase client available");
          const { error } = await supabase
            .from('students')
            .update({
              isDeleted: true,
              deletedAt: new Date().toISOString(),
              deletedBy: meta.userId,
              deleteReason: reason
            })
            .eq('id', id)
            .eq('school_id', schoolId);
          
          if (error) throw error;
          await AuditRepository.log(
            schoolId, 
            meta.userId, 
            meta.userName, 
            meta.userRole, 
            'SOFT_DELETE', 
            'STUDENT', 
            meta.ipAddress, 
            `حذف الطالب: ${id}`,
            { affectedRecord: id, valuesAfter: { reason } }
          );
          this.CACHE.delete(id);
        });
      } catch (err: any) {
        EnterpriseLogger.error("Supabase delete student failed; canonical outcome is unknown:", "StudentRepository", { error: err?.message || err });
        FallbackStorage.assertCanonicalPersistence('student delete');
      }
    }

    FallbackStorage.assertCanonicalPersistence('student delete');

    // Local Fallback Storage implementation
    const currentStudents = FallbackStorage.getStudents();
    const updatedStudents = currentStudents.map(s => (s.id === id && s.schoolId === schoolId) ? {
      ...s,
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: meta.userId,
      deleteReason: reason
    } : s);
    FallbackStorage.saveStudents(updatedStudents);

    await AuditRepository.log(
      schoolId, 
      meta.userId, 
      meta.userName, 
      meta.userRole, 
      'SOFT_DELETE', 
      'STUDENT', 
      meta.ipAddress, 
      `حذف الطالب محلياً (طوارئ): ${id}`,
      { affectedRecord: id, valuesAfter: { reason } }
    );
    this.CACHE.delete(id);
  }

  public static async restore(schoolId: string, id: string, meta: AuditMetadata): Promise<void> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        return await this.runCanonicalMutation(async () => {
          const supabase = getSupabaseClient();
          if (!supabase) throw new Error("No Supabase client available");
          const { error } = await supabase
            .from('students')
            .update({ isDeleted: false, deletedAt: null, deletedBy: null, deleteReason: null })
            .eq('id', id)
            .eq('school_id', schoolId);
          
          if (error) throw error;
          await AuditRepository.log(
            schoolId, 
            meta.userId, 
            meta.userName, 
            meta.userRole, 
            'RESTORE', 
            'STUDENT', 
            meta.ipAddress, 
            `استعادة الطالب: ${id}`,
            { affectedRecord: id }
          );
          this.CACHE.delete(id);
        });
      } catch (err: any) {
        EnterpriseLogger.error("Supabase restore student failed; canonical outcome is unknown:", "StudentRepository", { error: err?.message || err });
        FallbackStorage.assertCanonicalPersistence('student restore');
      }
    }

    FallbackStorage.assertCanonicalPersistence('student restore');

    // Local Fallback Storage implementation
    const currentStudents = FallbackStorage.getStudents();
    const updatedStudents = currentStudents.map(s => (s.id === id && s.schoolId === schoolId) ? {
      ...s,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      deleteReason: null
    } : s);
    FallbackStorage.saveStudents(updatedStudents);

    await AuditRepository.log(
      schoolId, 
      meta.userId, 
      meta.userName, 
      meta.userRole, 
      'RESTORE', 
      'STUDENT', 
      meta.ipAddress, 
      `استعادة الطالب محلياً (طوارئ): ${id}`,
      { affectedRecord: id }
    );
    this.CACHE.delete(id);
  }

  public static async getById(schoolId: string, id: string): Promise<Student | null> {
    if (this.CACHE.has(id)) {
      const cached = this.CACHE.get(id)!;
      if (Date.now() - cached.timestamp < this.CACHE_TTL) return cached.data;
    }

    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const student = await this.withRetry(async () => {
          const supabase = getSupabaseClient();
          if (!supabase) return null;
          const { data, error } = await supabase.from('students').select('*').eq('id', id).eq('school_id', schoolId).single();
          if (error) return null;
          return data as Student;
        });

        if (student) {
          this.CACHE.set(id, { data: student, timestamp: Date.now() });
          return student;
        }
      } catch (err: any) {
        EnterpriseLogger.error("Supabase getById student failed; canonical read is unavailable:", "StudentRepository", { error: err?.message || err });
        FallbackStorage.assertCanonicalPersistence('student read');
      }
    }

    FallbackStorage.assertCanonicalPersistence('student read');

    // Local Fallback Storage implementation
    const localStudent = FallbackStorage.getStudents().find(s => s.id === id && s.schoolId === schoolId) || null;
    if (localStudent) {
      this.CACHE.set(id, { data: localStudent, timestamp: Date.now() });
    }
    return localStudent;
  }

  public static async bulkCreate(schoolId: string, students: Partial<Student>[], meta: AuditMetadata): Promise<Student[]> {
    throw new Error('Student bulk create is blocked until an explicit PostgreSQL transaction-aware workflow is used.');
  }

  public static async bulkUpdate(schoolId: string, updates: { id: string, data: Partial<Student> }[], meta: AuditMetadata): Promise<Student[]> {
    throw new Error('Student bulk update is blocked until an explicit PostgreSQL transaction-aware workflow is used.');
  }

  public static async bulkDelete(schoolId: string, ids: string[], meta: AuditMetadata, reason: string): Promise<void> {
    throw new Error('Student bulk delete is blocked until an explicit PostgreSQL transaction-aware workflow is used.');
  }

  public static async search(schoolId: string, params: {
    query?: string,
    status?: string,
    stageId?: string,
    classroom?: string,
    branchId?: string,
    guardianId?: string,
    page?: number,
    pageSize?: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  }): Promise<{ data: Student[], total: number }> {
    const { page = 1, pageSize = 20, sortBy = 'created_at', sortOrder = 'desc' } = params;

    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          let query = supabase.from('students').select('*', { count: 'exact' }).eq('school_id', schoolId).eq('is_deleted', false);

          if (params.query) {
            query = query.or(`name.ilike.%${params.query}%,national_id.ilike.%${params.query}%,student_code.ilike.%${params.query}%`);
          }
          if (params.status) query = query.eq('status', params.status);
          if (params.stageId) query = query.eq('stage_id', params.stageId);
          if (params.classroom) query = query.eq('classroom', params.classroom);
          if (params.branchId) query = query.eq('branch_id', params.branchId);

          const { data, error, count } = await query
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range((page - 1) * pageSize, page * pageSize - 1);

          if (!error) {
            return { data: (data || []) as Student[], total: count || 0 };
          }
          throw error;
        }
      } catch (err: any) {
        EnterpriseLogger.error("Supabase search students failed; canonical read is unavailable:", "StudentRepository", { error: err?.message || err });
        FallbackStorage.assertCanonicalPersistence('student search');
      }
    }

    FallbackStorage.assertCanonicalPersistence('student search');

    // Local Fallback Storage implementation
    let list = FallbackStorage.getStudents().filter(s => s.schoolId === schoolId && !s.isDeleted);
    if (params.query) {
      const q = params.query.toLowerCase();
      list = list.filter(s => 
        (s.name || '').toLowerCase().includes(q) || 
        (s.nationalId || '').toLowerCase().includes(q) || 
        (s.studentCode && s.studentCode.toLowerCase().includes(q))
      );
    }
    if (params.status) list = list.filter(s => s.status === params.status);
    if (params.stageId) list = list.filter(s => s.stageId === params.stageId);
    if (params.classroom) list = list.filter(s => s.classroom === params.classroom);
    if (params.branchId) list = list.filter(s => s.branchId === params.branchId);

    // Sorting
    list.sort((a: any, b: any) => {
      const fieldA = (a as any)[sortBy] || '';
      const fieldB = (b as any)[sortBy] || '';
      if (fieldA < fieldB) return sortOrder === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = list.length;
    const paginated = list.slice((page - 1) * pageSize, page * pageSize);
    return { data: paginated, total };
  }

  public static async bulkRestore(schoolId: string, ids: string[], meta: AuditMetadata): Promise<void> {
    throw new Error('Student bulk restore is blocked until an explicit PostgreSQL transaction-aware workflow is used.');
  }

  public static async bulkPromote(schoolId: string, students: { id: string, targetClass: string, targetStage: string }[], meta: AuditMetadata): Promise<void> {
    throw new Error('Student bulk promotion is blocked until an explicit PostgreSQL transaction-aware workflow is used.');
  }

  public static async bulkTransfer(schoolId: string, students: { id: string, targetClass: string, targetSection: string }[], meta: AuditMetadata): Promise<void> {
    throw new Error('Student bulk transfer is blocked until an explicit PostgreSQL transaction-aware workflow is used.');
  }

  public static async permanentDelete(schoolId: string, id: string, meta: AuditMetadata): Promise<void> {
    const constraints = await this.validateConstraints(schoolId, id);
    if (constraints.length > 0) throw new Error(`لا يمكن حذف الطالب نهائياً: ${constraints.join(', ')}`);

    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        return await this.runCanonicalMutation(async () => {
          const supabase = getSupabaseClient();
          if (!supabase) throw new Error("No Supabase client available");
          const { error } = await supabase.from('students').delete().eq('id', id).eq('school_id', schoolId);
          if (error) throw error;
          await AuditRepository.log(
            schoolId, 
            meta.userId, 
            meta.userName, 
            meta.userRole, 
            'PERMANENT_DELETE', 
            'STUDENT', 
            meta.ipAddress, 
            `حذف نهائي للطالب: ${id}`,
            { affectedRecord: id }
          );
          this.CACHE.delete(id);
        });
      } catch (err: any) {
        EnterpriseLogger.error("Supabase permanentDelete student failed; canonical outcome is unknown:", "StudentRepository", { error: err?.message || err });
        FallbackStorage.assertCanonicalPersistence('student permanent delete');
      }
    }

    FallbackStorage.assertCanonicalPersistence('student permanent delete');

    // Local Fallback Storage implementation
    const currentStudents = FallbackStorage.getStudents();
    const updatedStudents = currentStudents.filter(s => !(s.id === id && s.schoolId === schoolId));
    FallbackStorage.saveStudents(updatedStudents);

    await AuditRepository.log(
      schoolId, 
      meta.userId, 
      meta.userName, 
      meta.userRole, 
      'PERMANENT_DELETE', 
      'STUDENT', 
      meta.ipAddress, 
      `حذف نهائي للطالب محلياً (طوارئ): ${id}`,
      { affectedRecord: id }
    );
    this.CACHE.delete(id);
  }

  private static async findDuplicate(schoolId: string, data: Partial<Student>): Promise<Student | null> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const query = supabase.from('students').select('*').eq('school_id', schoolId);
          
          // Check multiple fields
          const orParts: string[] = [];
          if (data.nationalId) orParts.push(`national_id.eq.${data.nationalId}`);
          if (data.studentCode) orParts.push(`student_code.eq.${data.studentCode}`);
          if (data.email) orParts.push(`email.eq.${data.email}`);
          
          if (orParts.length === 0) return null;

          const { data: res } = await query.or(orParts.join(','));
          return (res && res.length > 0) ? res[0] : null;
        }
      } catch (err: any) {
        EnterpriseLogger.error("Supabase findDuplicate student failed; canonical duplicate check is unavailable:", "StudentRepository", { error: err?.message || err });
        FallbackStorage.assertCanonicalPersistence('student duplicate detection');
      }
    }

    FallbackStorage.assertCanonicalPersistence('student duplicate detection');

    // Local Fallback Storage implementation
    const students = FallbackStorage.getStudents().filter(s => s.schoolId === schoolId && !s.isDeleted);
    for (const s of students) {
      if (data.nationalId && s.nationalId === data.nationalId) return s;
      if (data.studentCode && s.studentCode === data.studentCode) return s;
      if (data.email && s.email === data.email) return s;
    }
    return null;
  }

  /**
   * Enterprise-grade advanced multi-column query and search.
   * Completely encapsulates SQL / Supabase construction from Application Services.
   */
  public static async advancedSearch(
    schoolId: string,
    params: {
      quickSearch?: string;
      classroom?: string;
      status?: string;
      gender?: string;
      feesOutstandingOnly?: boolean;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    }
  ): Promise<{ data: Student[]; totalCount: number; page: number; limit: number }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const sortBy = params.sortBy || 'registrationDate';
    const sortOrder = params.sortOrder || 'desc';

    // 1. Real PostgreSQL FTS and multi-column query (If Supabase is healthy)
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          let query = supabase
            .from('students')
            .select('*', { count: 'exact' })
            .eq('school_id', schoolId);

          if (params.quickSearch) {
            query = query.or(`name.ilike.%${params.quickSearch}%,national_id.ilike.%${params.quickSearch}%,parent_name.ilike.%${params.quickSearch}%`);
          }
          if (params.classroom) {
            query = query.eq('classroom', params.classroom);
          }
          if (params.status) {
            query = query.eq('status', params.status);
          }
          if (params.gender) {
            query = query.eq('gender', params.gender);
          }
          if (params.feesOutstandingOnly) {
            query = query.gt('fees_remaining', 0);
          }

          const from = (page - 1) * limit;
          const to = from + limit - 1;
          query = query.order(sortBy === 'registrationDate' ? 'registration_date' : sortBy, { ascending: sortOrder === 'asc' })
                       .range(from, to);

          const { data, count, error } = await query;
          if (error) throw error;

          return {
            data: data as Student[],
            totalCount: count || data.length,
            page,
            limit
          };
        }
      } catch (err: any) {
        EnterpriseLogger.error("SQL Search Engine failed, routing to local Fallback:", "StudentRepository", { error: err?.message || err });
      }
    }

    // 2. Robust Fallback client-side matching engine
    let students = FallbackStorage.getStudents().filter(s => s.schoolId === schoolId);

    if (params.quickSearch) {
      const q = params.quickSearch.toLowerCase();
      students = students.filter(s => 
        s.name.toLowerCase().includes(q) ||
        s.nationalId.includes(q) ||
        (s.parentName && s.parentName.toLowerCase().includes(q))
      );
    }
    if (params.classroom) {
      students = students.filter(s => s.classroom === params.classroom);
    }
    if (params.status) {
      students = students.filter(s => s.status === params.status);
    }
    if (params.gender) {
      students = students.filter(s => s.gender === params.gender);
    }
    if (params.feesOutstandingOnly) {
      students = students.filter(s => s.feesRemaining > 0);
    }

    // Sorting
    students.sort((a: any, b: any) => {
      const valA = a[sortBy] || '';
      const valB = b[sortBy] || '';
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const totalCount = students.length;
    const from = (page - 1) * limit;
    const paginatedData = students.slice(from, from + limit);

    return {
      data: paginatedData,
      totalCount,
      page,
      limit
    };
  }

  public static async updateStatus(schoolId: string, studentId: string, status: StudentStatus): Promise<void> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
        const supabase = getSupabaseClient();
        if (supabase) {
            const { error } = await supabase
                .from('students')
                .update({ status })
                .eq('id', studentId)
                .eq('school_id', schoolId);
            if (error) throw error;
        }
    }
    // Fallback logic
    const currentStudents = FallbackStorage.getStudents();
    const updated = currentStudents.map(s => (s.id === studentId && s.schoolId === schoolId) ? {...s, status} : s);
    FallbackStorage.saveStudents(updated as any);
    this.CACHE.delete(studentId);
  }

  /**
   * Enterprise-grade static transaction enlistment for Student creation.
   * Completely encapsulates SQL construction from Application Services.
   */
  public static enlistCreateStudent(schoolId: string, studentId: string, student: Student) {
    const command = SQLCommandBuilder.create({
      sqlText: `INSERT INTO students (id, school_id, branch_id, name, national_id, classroom, section, parent_name, parent_phone, registration_date, status, fees_paid, fees_remaining, student_code, academic_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', 0, 1500, $11, $12);`,
      parameters: [student.id, schoolId, student.branchId, student.name, student.nationalId, student.classroom, student.section, student.parentName, student.parentPhone, student.registrationDate, student.studentCode, student.academicId],
      parameterTypes: ['string', 'string', 'string', 'string', 'string', 'string', 'string', 'string', 'string', 'string', 'string', 'string'],
      executionContext: 'Create Student Lifecycle'
    });
    UnitOfWork.enlistCreate('students', studentId, student, command);
  }
}
