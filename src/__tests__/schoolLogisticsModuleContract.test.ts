import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const appSource = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf8');
const sidebarSource = readFileSync(resolve(process.cwd(), 'src/components/Sidebar.tsx'), 'utf8');
const authorizationSource = readFileSync(resolve(process.cwd(), 'src/authorization/ClientAuthorization.ts'), 'utf8');
const transportSource = readFileSync(resolve(process.cwd(), 'src/components/SchoolTransportManagement.tsx'), 'utf8');

describe('school logistics module contract', () => {
  it('exposes the requested school-uniform, transportation, and reserved review entry points', () => {
    expect(sidebarSource).toContain("id: 'school_uniform', label: 'إدارة الزي المدرسي'");
    expect(sidebarSource).toContain("id: 'school_transport', label: 'إدارة النقل والترحيل المدرسي'");
    expect(sidebarSource).toContain("id: 'general_review', label: 'المراجعة العامة — قيد التجهيز'");
    expect(appSource).toContain("activeSection === 'general_review'");
  });

  it('keeps the new navigation aliases behind the established permissions', () => {
    expect(authorizationSource).toContain("school_uniform: 'Uniform_management.View'");
    expect(authorizationSource).toContain("school_transport: 'Buses.View'");
    expect(authorizationSource).toContain('general_review: PERMISSIONS.AUDIT_READ');
  });

  it('uses canonical route and student-transport repositories without synthetic records', () => {
    expect(transportSource).toContain('new TransportationRepository()');
    expect(transportSource).toContain('new StudentTransportationRepository()');
    expect(transportSource).toContain('getAll(selectedSchoolId)');
    expect(transportSource).toContain('studentTransportationRepository.create');
    expect(transportSource).not.toContain('busRoutesSeed');
    expect(transportSource).not.toContain('initialTransport');
  });
});
