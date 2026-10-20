import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadPublicSchoolPortal } from '../utils/publicSchoolPortal';

afterEach(() => vi.unstubAllGlobals());

describe('public school portal loading', () => {
  it('reads the canonical school name and id without accepting additional fields', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ success: true, school: { id: 'school-id', name: 'مدارس الأسرة الحديثة', permissions: ['*'] } }),
    });
    vi.stubGlobal('fetch', fetch);
    await expect(loadPublicSchoolPortal('modern-family-schools')).resolves.toEqual({ id: 'school-id', name: 'مدارس الأسرة الحديثة' });
    expect(fetch).toHaveBeenCalledWith('/api/public/school-portal?school=modern-family-schools');
  });

  it('distinguishes an unknown school from a temporary directory failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(loadPublicSchoolPortal('unknown')).resolves.toBeNull();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(loadPublicSchoolPortal('modern-family-schools')).rejects.toThrow('SCHOOL_PORTAL_UNAVAILABLE');
  });
});
