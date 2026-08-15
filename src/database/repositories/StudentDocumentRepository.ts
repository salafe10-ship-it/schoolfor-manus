import { getSupabaseClient } from '../client';
import { FallbackStorage } from './FallbackStorage';
import { StudentDocument } from '../../types';
import { IBaseRepository } from './IBaseRepository';

export class StudentDocumentRepository implements IBaseRepository<StudentDocument> {
  // Static Helper
  public static async hasActiveDocuments(schoolId: string, studentId: string): Promise<boolean> {
    const rows = await FallbackStorage.performRead<{ id: string }>(
      schoolId,
      'student_documents.hasActiveDocuments',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { data, error } = await supabase
          .from('student_documents')
          .select('id')
          .eq('student_id', studentId);
        if (error) throw error;
        return (data || []) as { id: string }[];
      },
      () => FallbackStorage.getStudentDocuments()
        .filter(document => document.studentId === studentId)
        .map(document => ({ id: document.id }))
    );
    return rows.length > 0;
  }

  public async getById(schoolId: string, id: string): Promise<StudentDocument | null> {
    const rows = await FallbackStorage.performRead<StudentDocument>(
      schoolId,
      'student_documents.getById',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { data, error } = await supabase
          .from('student_documents')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return data ? [data as StudentDocument] : [];
      },
      () => FallbackStorage.getStudentDocuments().filter(doc => doc.id === id)
    );
    return rows[0] || null;
  }

  public async getAll(schoolId: string, options?: { studentId?: string }): Promise<{ data: StudentDocument[]; count: number }> {
    const data = await FallbackStorage.performRead<StudentDocument>(
      schoolId,
      'student_documents.getAll',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        let query = supabase.from('student_documents').select('*', { count: 'exact' });
        if (options?.studentId) query = query.eq('student_id', options.studentId);
        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as StudentDocument[];
      },
      () => {
        let fallback = FallbackStorage.getStudentDocuments();
        if (options?.studentId) fallback = fallback.filter(doc => doc.studentId === options.studentId);
        return fallback;
      }
    );
    return { data, count: data.length };
  }

  public async create(schoolId: string, item: Partial<StudentDocument>): Promise<StudentDocument> {
    const id = item.id || `doc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newRecord: StudentDocument = {
      id,
      studentId: item.studentId || '',
      category: item.category || 'national_id',
      fileName: item.fileName || '',
      fileSize: item.fileSize || '0 KB',
      fileUrl: item.fileUrl || '',
      accessPermission: item.accessPermission || 'admins',
      ocrProcessed: item.ocrProcessed ?? false,
      ocrExtractedName: item.ocrExtractedName,
      uploadedAt: item.uploadedAt || new Date().toISOString(),
      uploadedBy: item.uploadedBy || 'system',
      version: item.version || 1,
      status: item.status || 'active',
      expirationDate: item.expirationDate,
      verificationStatus: item.verificationStatus || 'pending',
      workflowStatus: item.workflowStatus || 'draft',
      auditHistory: item.auditHistory || [],
      versionHistory: item.versionHistory || []
    };

    return FallbackStorage.performWrite<StudentDocument>(
      schoolId,
      'student_documents',
      id,
      'INSERT',
      newRecord,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client");
        const { data, error } = await supabase.from('student_documents').insert([newRecord]).select().single();
        if (error) throw error;
        return data as StudentDocument;
      },
      () => {
        const all = FallbackStorage.getStudentDocuments();
        all.unshift(newRecord);
        FallbackStorage.saveStudentDocuments(all);
      }
    );
  }

  public async update(schoolId: string, id: string, item: Partial<StudentDocument>): Promise<StudentDocument> {
    const existing = await this.getById(schoolId, id);
    const updated = { ...existing, ...item } as StudentDocument;

    return FallbackStorage.performWrite<StudentDocument>(
      schoolId,
      'student_documents',
      id,
      'UPDATE',
      updated,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client");
        const { data, error } = await supabase.from('student_documents').update(item).eq('id', id).select().single();
        if (error) throw error;
        return data as StudentDocument;
      },
      () => {
        const all = FallbackStorage.getStudentDocuments();
        const idx = all.findIndex(doc => doc.id === id);
        if (idx !== -1) {
          all[idx] = updated;
          FallbackStorage.saveStudentDocuments(all);
        }
      }
    );
  }

  public async delete(schoolId: string, id: string): Promise<boolean> {
    return FallbackStorage.performWrite<boolean>(
      schoolId,
      'student_documents',
      id,
      'DELETE',
      true,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client");
        const { error } = await supabase.from('student_documents').delete().eq('id', id);
        if (error) throw error;
        return true;
      },
      () => {
        const all = FallbackStorage.getStudentDocuments();
        const filtered = all.filter(doc => doc.id !== id);
        FallbackStorage.saveStudentDocuments(filtered);
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
}
