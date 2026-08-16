// src/modules/student-admission/repository/SupabaseAdmissionInquiryRepository.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { AdmissionInquiry, AdmissionStatus } from '../domain/AdmissionInquiry';
import type { AdmissionInquiryRepository, AdmissionInquiryScope } from './AdmissionInquiryRepository';

interface AdmissionInquiryRow {
  id: string;
  tenant_id: string;
  school_id: string;
  branch_id: string;
  student_name: string;
  date_of_birth: string;
  status: string;
  created_at: string;
}

export class SupabaseAdmissionInquiryRepository implements AdmissionInquiryRepository {
  constructor(private readonly client: SupabaseClient | null) {}

  private requireClient(): SupabaseClient {
    if (!this.client) {
      throw new Error('Canonical admission persistence requires a configured request-scoped Supabase client.');
    }
    return this.client;
  }
  private toDomain(row: AdmissionInquiryRow): AdmissionInquiry {
    return new AdmissionInquiry({
      tenantId: row.tenant_id,
      schoolId: row.school_id,
      branchId: row.branch_id,
      studentName: row.student_name,
      dateOfBirth: new Date(row.date_of_birth),
      status: row.status as AdmissionStatus,
      createdAt: new Date(row.created_at)
    }, row.id);
  }

  async findByScope(scope: AdmissionInquiryScope): Promise<AdmissionInquiry[]> {
    const { data, error } = await this.requireClient()
      .from('admission_inquiries')
      .select('*')
      .eq('tenant_id', scope.tenantId)
      .eq('school_id', scope.schoolId)
      .eq('branch_id', scope.branchId)
      .order('created_at', { ascending: false });
    if (error) throw new Error('Failed to read admission inquiries: ' + error.message);
    return ((data ?? []) as AdmissionInquiryRow[]).map((row) => this.toDomain(row));
  }

  async findByIdInScope(id: string, scope: AdmissionInquiryScope): Promise<AdmissionInquiry | null> {
    const { data, error } = await this.requireClient()
      .from('admission_inquiries')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', scope.tenantId)
      .eq('school_id', scope.schoolId)
      .eq('branch_id', scope.branchId)
      .maybeSingle();
    if (error) throw new Error('Failed to read admission inquiry: ' + error.message);
    return data ? this.toDomain(data as AdmissionInquiryRow) : null;
  }

  async save(entity: AdmissionInquiry): Promise<void> {
    const { error } = await this.requireClient().from('admission_inquiries').upsert({
      id: entity.id,
      tenant_id: entity.props.tenantId,
      school_id: entity.props.schoolId,
      branch_id: entity.props.branchId,
      student_name: entity.props.studentName,
      date_of_birth: entity.props.dateOfBirth.toISOString().slice(0, 10),
      status: entity.props.status,
      created_at: entity.props.createdAt.toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    if (error) throw new Error('Failed to persist admission inquiry: ' + error.message);
  }

  async delete(_id: string): Promise<void> {
    throw new Error('Admission deletion requires an explicit scoped workflow and is not available through an unscoped repository method.');
  }

  async findById(_id: string): Promise<AdmissionInquiry | null> {
    throw new Error('Admission lookup requires an explicit tenant, school and branch scope.');
  }
}
