import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSchoolPortalContext, getSchoolSubdomainFromHostname, getTrustedSchoolUrl } from '../utils/EnterpriseDomainUtils';
import { canRestoreSchoolPortalSession } from '../security/SchoolPortalSessionBoundary';
import { loadPublicSchoolPortal } from '../utils/publicSchoolPortal';

const schoolId = 'be687819-4d8d-427f-8479-81c0b70c35e1';
const otherSchoolId = '11111111-1111-4111-8111-111111111111';

afterEach(() => vi.unstubAllGlobals());

describe('school subdomain routing', () => {
  it('uses the school hostname even when a query names a different school', () => {
    expect(getSchoolPortalContext('Modern-Family-Schools.abdalsalamsoft.com', '?school=another-school'))
      .toBe('modern-family-schools');
  });

  it('preserves school links through the shared gateway and local development', () => {
    expect(getSchoolPortalContext('schoolfor-manus.salafe10.workers.dev', '?school=MODERN-FAMILY')).toBe('MODERN-FAMILY');
    expect(getSchoolPortalContext('localhost', `?schoolId=${schoolId}`)).toBe(schoolId);
    expect(getSchoolPortalContext('abdalsalamsoft.com', '')).toBe('');
  });

  it.each([
    'admin.abdalsalamsoft.com', 'www.abdalsalamsoft.com', 'api.abdalsalamsoft.com',
    'app.abdalsalamsoft.com', 'portal.abdalsalamsoft.com',
    'school.abdalsalamsoft.com.attacker.test', 'nested.school.abdalsalamsoft.com',
    '-school.abdalsalamsoft.com', 'school-.abdalsalamsoft.com',
  ])('does not treat %s as a school subdomain', hostname => {
    expect(getSchoolSubdomainFromHostname(hostname)).toBe('');
  });

  it('generates a separate school subdomain link for each school', () => {
    vi.stubGlobal('window', { location: { hostname: 'abdalsalamsoft.com', origin: 'https://abdalsalamsoft.com' } });
    expect(getTrustedSchoolUrl({ id: schoolId, subdomain: 'modern-family-schools' }))
      .toBe('https://modern-family-schools.abdalsalamsoft.com');
    expect(getTrustedSchoolUrl({ id: otherSchoolId, subdomain: 'another-school' }))
      .toBe('https://another-school.abdalsalamsoft.com');
    expect(getSchoolPortalContext('abdalsalamsoft.com', `?school=${schoolId}`)).toBe(schoolId);
  });

  it('uses school subdomains for platform domains and preserves external custom domains', () => {
    vi.stubGlobal('window', { location: { hostname: 'abdalsalamsoft.com', origin: 'https://abdalsalamsoft.com' } });
    expect(getTrustedSchoolUrl({ id: schoolId, domain: 'modern-family-schools.abdalsalamsoft.com' }))
      .toBe('https://modern-family-schools.abdalsalamsoft.com');
    expect(getTrustedSchoolUrl({ id: schoolId, domain: 'abdalsalamsoft.com' }))
      .toBe(`https://${schoolId}.abdalsalamsoft.com`);
    expect(getTrustedSchoolUrl({ subdomain: 'another-school' }))
      .toBe('https://another-school.abdalsalamsoft.com');
    expect(getTrustedSchoolUrl({ id: 'legacy-id', subdomain: 'another-school' }))
      .toBe('https://another-school.abdalsalamsoft.com');
    expect(getTrustedSchoolUrl({ domain: 'modern-family-schools.abdalsalamsoft.com' }))
      .toBe('https://modern-family-schools.abdalsalamsoft.com');
    expect(getTrustedSchoolUrl({ id: schoolId, customDomain: 'school.example.org' }))
      .toBe('https://school.example.org');
  });

  it('keeps local school links on the local server', () => {
    vi.stubGlobal('window', { location: { hostname: 'localhost', origin: 'http://localhost:3000' } });
    expect(getTrustedSchoolUrl({ id: schoolId, subdomain: 'modern-family-schools' }))
      .toBe(`http://localhost:3000/?school=${schoolId}`);
  });

  it('retains a session only after the server resolves its public alias to the same school', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ success: true, school: { id: schoolId, name: 'مدارس الأسرة الحديثة' } }),
    }));
    const portal = await loadPublicSchoolPortal('modern-family-schools');
    expect(canRestoreSchoolPortalSession(portal!.id, schoolId)).toBe(true);
    expect(canRestoreSchoolPortalSession(portal!.id, otherSchoolId)).toBe(false);
  });

  it('rejects a restored session from a different school or without a verified alias', () => {
    expect(canRestoreSchoolPortalSession('another-school', schoolId)).toBe(false);
    expect(canRestoreSchoolPortalSession('modern-family-schools', otherSchoolId)).toBe(false);
    expect(canRestoreSchoolPortalSession('modern-family-schools', schoolId)).toBe(false);
    expect(canRestoreSchoolPortalSession('modern-family-schools', undefined)).toBe(false);
    expect(canRestoreSchoolPortalSession(otherSchoolId, schoolId)).toBe(false);
  });
});
