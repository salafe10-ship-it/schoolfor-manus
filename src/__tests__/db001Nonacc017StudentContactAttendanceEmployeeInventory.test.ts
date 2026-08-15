import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StudentContactRepository } from '../database/repositories/StudentContactRepository';
import { AttendanceRepository } from '../database/repositories/AttendanceRepository';
import { EmployeeRepository } from '../database/repositories/EmployeeRepository';
import { InventoryRepository } from '../database/repositories/InventoryRepository';

const mocks = vi.hoisted(() => ({
  getSupabaseClient: vi.fn(),
  performRead: vi.fn(),
  getStudentContacts: vi.fn(),
  getAttendance: vi.fn(),
  getEmployees: vi.fn(),
  getTeachers: vi.fn(),
  getInventory: vi.fn()
}));

vi.mock('../database/client', () => ({ getSupabaseClient: mocks.getSupabaseClient }));
vi.mock('../database/repositories/FallbackStorage', () => ({
  FallbackStorage: {
    performRead: mocks.performRead,
    performWrite: vi.fn(),
    getStudentContacts: mocks.getStudentContacts,
    getAttendance: mocks.getAttendance,
    getEmployees: mocks.getEmployees,
    getTeachers: mocks.getTeachers,
    getInventory: mocks.getInventory
  }
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getStudentContacts.mockReturnValue([{ id: 'stale-contact' }]);
  mocks.getAttendance.mockReturnValue([{ id: 'stale-attendance', studentId: 'student-1' }]);
  mocks.getEmployees.mockReturnValue([{ id: 'stale-employee', schoolId: 'school-a' }]);
  mocks.getTeachers.mockReturnValue([{ id: 'stale-teacher', schoolId: 'school-a', name: 'Stale' }]);
  mocks.getInventory.mockReturnValue([{ id: 'stale-inventory', schoolId: 'school-a' }]);
});

describe('DB-001-NONACC-017 remaining legacy read fail-safe', () => {
  it('propagates canonical failures for all four families', async () => {
    mocks.performRead.mockRejectedValue(new Error('PERSISTENCE_UNKNOWN'));

    await expect(new StudentContactRepository().getById('school-a', 'contact-1')).rejects.toThrow('PERSISTENCE_UNKNOWN');
    await expect(AttendanceRepository.getById('school-a', 'attendance-1')).rejects.toThrow('PERSISTENCE_UNKNOWN');
    await expect(EmployeeRepository.getById('school-a', 'employee-1')).rejects.toThrow('PERSISTENCE_UNKNOWN');
    await expect(InventoryRepository.getById('school-a', 'inventory-1')).rejects.toThrow('PERSISTENCE_UNKNOWN');
    expect(mocks.getStudentContacts).not.toHaveBeenCalled();
    expect(mocks.getAttendance).not.toHaveBeenCalled();
    expect(mocks.getEmployees).not.toHaveBeenCalled();
    expect(mocks.getInventory).not.toHaveBeenCalled();
  });

  it('returns canonical success and preserves the supplied school scope', async () => {
    mocks.performRead
      .mockResolvedValueOnce([{ id: 'canonical-contact' }])
      .mockResolvedValueOnce([{ id: 'canonical-attendance' }])
      .mockResolvedValueOnce([{ id: 'canonical-employee' }])
      .mockResolvedValueOnce([{ id: 'canonical-inventory' }]);

    await expect(new StudentContactRepository().getById('school-a', 'contact-1')).resolves.toMatchObject({ id: 'canonical-contact' });
    await expect(AttendanceRepository.getById('school-a', 'attendance-1')).resolves.toMatchObject({ id: 'canonical-attendance' });
    await expect(EmployeeRepository.getById('school-a', 'employee-1')).resolves.toMatchObject({ id: 'canonical-employee' });
    await expect(InventoryRepository.getById('school-a', 'inventory-1')).resolves.toMatchObject({ id: 'canonical-inventory' });

    expect(mocks.performRead).toHaveBeenNthCalledWith(1, 'school-a', 'student_contacts.getById', expect.any(Function), expect.any(Function));
    expect(mocks.performRead).toHaveBeenNthCalledWith(2, 'school-a', 'attendance.getById', expect.any(Function), expect.any(Function));
    expect(mocks.performRead).toHaveBeenNthCalledWith(3, 'school-a', 'employees.getById', expect.any(Function), expect.any(Function));
    expect(mocks.performRead).toHaveBeenNthCalledWith(4, 'school-a', 'inventory.getById', expect.any(Function), expect.any(Function));
  });

  it('preserves canonical empty semantics and never consults stale fallback data', async () => {
    mocks.performRead.mockResolvedValue([]);

    await expect(new StudentContactRepository().getById('school-a', 'missing')).resolves.toBeNull();
    await expect(AttendanceRepository.getAll('school-a')).resolves.toEqual([]);
    await expect(EmployeeRepository.getAll('school-a')).resolves.toEqual([]);
    await expect(InventoryRepository.getAll('school-a')).resolves.toEqual([]);
    await expect(AttendanceRepository.hasActiveAttendance('school-a', 'student-1')).resolves.toBe(false);
    expect(mocks.getStudentContacts).not.toHaveBeenCalled();
    expect(mocks.getAttendance).not.toHaveBeenCalled();
    expect(mocks.getEmployees).not.toHaveBeenCalled();
    expect(mocks.getInventory).not.toHaveBeenCalled();
  });

  it('keeps the fail-closed boundary in each audited repository source', async () => {
    const sourceFiles = [
      'StudentContactRepository.ts',
      'AttendanceRepository.ts',
      'EmployeeRepository.ts',
      'InventoryRepository.ts'
    ];
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    for (const file of sourceFiles) {
      const source = readFileSync(resolve(process.cwd(), 'src/database/repositories', file), 'utf8');
      expect(source).toContain('FallbackStorage.performRead');
    }
  });
});
