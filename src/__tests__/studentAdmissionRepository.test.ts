import { describe, expect, it, vi } from 'vitest';
import { SupabaseAdmissionInquiryRepository } from '../modules/student-admission/repository/SupabaseAdmissionInquiryRepository';

vi.mock('../database/client', () => ({
  getSupabaseClient: vi.fn(() => null)
}));

const scope = { tenantId: 'tenant-a', schoolId: 'school-a', branchId: 'branch-a' };

describe('Supabase admission repository safety', () => {
  it('fails closed when canonical Supabase persistence is unavailable', async () => {
    const repository = new SupabaseAdmissionInquiryRepository(null);
    await expect(repository.findByScope(scope)).rejects.toThrow('Canonical admission persistence requires a configured request-scoped Supabase client.');
  });

  it('rejects unscoped lookup and deletion methods', async () => {
    const repository = new SupabaseAdmissionInquiryRepository(null);
    await expect(repository.findById('inquiry-a')).rejects.toThrow('explicit tenant, school and branch scope');
    await expect(repository.delete('inquiry-a')).rejects.toThrow('explicit scoped workflow');
  });
});
