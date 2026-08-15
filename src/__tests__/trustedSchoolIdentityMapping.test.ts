import { describe, expect, it, vi } from 'vitest';
import {
  resolveTrustedSchoolPresentation,
  toTrustedSchoolPresentation
} from '../middleware/trustedSchoolIdentity';

describe('IDMAP-001 trusted school identity mapping', () => {
  it('keeps the server-resolved UUID as the application school id', async () => {
    const schoolId = 'c4060060-0600-4600-8600-600600600603';
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: schoolId,
                school_code: 'P003',
                legal_name: 'PERF003 Test Tenant',
                display_name: 'PERF003 Test School',
                status: 'active'
              },
              error: null
            })
          }))
        }))
      }))
    } as any;

    await expect(resolveTrustedSchoolPresentation(supabase, schoolId)).resolves.toMatchObject({
      id: schoolId,
      name: 'PERF003 Test School',
      licenseNumber: 'P003',
      status: 'active'
    });
  });

  it('rejects an empty trusted school id and never creates a legacy alias', async () => {
    const supabase = { from: vi.fn() } as any;
    await expect(resolveTrustedSchoolPresentation(supabase, '')).resolves.toBeNull();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('fails closed when the returned school id differs from the trusted scope', () => {
    expect(() => toTrustedSchoolPresentation({
      id: '',
      display_name: 'Invalid',
      status: 'active'
    })).toThrow();
  });
});
