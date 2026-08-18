import { describe, expect, it } from 'vitest';
import { createTrustedStudentAuditMetadata } from '../security/TrustedStudentAuditMetadata';
import { assertTrustedStudentServerExecution } from '../security/TrustedStudentExecution';

describe('Student Affairs trusted audit metadata', () => {
  it('ignores client-shaped fields and uses authenticated identity and tenant context', () => {
    const metadata = createTrustedStudentAuditMetadata({
      user: {
        id: 'trusted-user',
        email: 'trusted@example.com',
        name: 'Trusted User',
        schoolId: 'school-1',
        role: 'SchoolAdmin'
      },
      tenantContext: {
        tenantId: 'school-1',
        schoolId: 'school-1',
        branchId: 'branch-1',
        academicYear: '2026/2027',
        userId: 'trusted-user',
        role: 'SchoolAdmin'
      },
      ip: 'spoofed-forwarded-ip',
      socket: { remoteAddress: '10.0.0.8' },
      body: {
        userId: 'spoofed-user',
        userName: 'Spoofed User',
        userRole: 'SuperAdmin',
        ipAddress: ' spoofed-ip '
      }
    } as any);

    expect(metadata).toEqual({
      userId: 'trusted-user',
      userName: 'Trusted User',
      userRole: 'SchoolAdmin',
      ipAddress: '10.0.0.8'
    });
  });

  it('accepts a trusted tenant that owns a different school without collapsing the scopes', () => {
    const metadata = createTrustedStudentAuditMetadata({
      user: {
        id: 'trusted-user',
        email: 'trusted@example.com',
        name: 'Trusted User',
        tenantId: 'tenant-1',
        schoolId: 'school-1',
        role: 'SchoolAdmin'
      },
      tenantContext: {
        tenantId: 'tenant-1',
        schoolId: 'school-1',
        branchId: 'branch-1',
        academicYear: '',
        userId: 'trusted-user',
        role: 'SchoolAdmin'
      }
    });

    expect(metadata).toMatchObject({ userId: 'trusted-user', userRole: 'SchoolAdmin' });
  });

  it('rejects an identity and tenant context mismatch', () => {
    expect(() => createTrustedStudentAuditMetadata({
      user: {
        id: 'spoofed-user',
        email: 'trusted@example.com',
        name: 'Trusted User',
        schoolId: 'school-1',
        role: 'SchoolAdmin'
      },
      tenantContext: {
        tenantId: 'school-1',
        schoolId: 'school-1',
        branchId: 'branch-1',
        academicYear: '2026/2027',
        userId: 'trusted-user',
        role: 'SchoolAdmin'
      }
    })).toThrow();
  });

  it('rejects browser-side StudentService execution before audit metadata can be used', () => {
    expect(() => assertTrustedStudentServerExecution()).toThrow();
  });
});
