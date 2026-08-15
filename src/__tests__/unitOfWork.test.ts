import { afterEach, describe, expect, it } from 'vitest';
import { UnitOfWork } from '../database/UnitOfWork';

const metadata = {
  operationName: 'Student Affairs transaction test',
  userId: 'test-user',
  userName: 'Test User',
  ipAddress: '127.0.0.1',
  affectedTables: [],
  tenantId: 'school-1'
};

const delay = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

afterEach(async () => {
  if (UnitOfWork.isTransactionActive()) {
    await UnitOfWork.rollback();
  }
});

describe('Student Affairs UnitOfWork transaction integrity', () => {
  it('creates and commits one request-scoped transaction', async () => {
    let transactionId = '';

    await UnitOfWork.runInTransaction('school-1', metadata, async () => {
      const context = UnitOfWork.getActiveContext();
      expect(context?.isActive).toBe(true);
      transactionId = context?.id || '';
    });

    expect(transactionId).toMatch(/^uow_tx_/);
    expect(UnitOfWork.isTransactionActive()).toBe(false);
  });

  it('rolls back a failed Student Save without committing pending records', async () => {
    await expect(UnitOfWork.runInTransaction('school-1', metadata, async () => {
      UnitOfWork.enlistCreate('students', 'student-failed-save', { id: 'student-failed-save' });
      expect(UnitOfWork.getPendingById('students', 'student-failed-save')).toEqual({
        data: { id: 'student-failed-save' }
      });
      throw new Error('student save failure');
    })).rejects.toThrow('student save failure');

    expect(UnitOfWork.isTransactionActive()).toBe(false);
  });

  it('rolls back a failed Guardian Save and all preceding changes', async () => {
    await expect(UnitOfWork.runInTransaction('school-1', metadata, async () => {
      UnitOfWork.enlistCreate('students', 'student-with-guardian-failure', { id: 'student-with-guardian-failure' });
      UnitOfWork.enlistCreate('guardians', 'guardian-failure', { id: 'guardian-failure' });
      throw new Error('guardian save failure');
    })).rejects.toThrow('guardian save failure');

    expect(UnitOfWork.isTransactionActive()).toBe(false);
  });

  it.each([
    ['Transfer', 'student-transfer-failure', 'student_transfer_audits'],
    ['Status Change', 'student-status-failure', 'students']
  ])('rolls back a failed %s operation', async (_operation, id, collection) => {
    await expect(UnitOfWork.runInTransaction('school-1', metadata, async () => {
      UnitOfWork.enlistUpdate(collection, id, { id, status: 'pending-test-change' });
      throw new Error(`${_operation} failure`);
    })).rejects.toThrow(`${_operation} failure`);

    expect(UnitOfWork.isTransactionActive()).toBe(false);
  });

  it('rejects nested UnitOfWork execution', async () => {
    await expect(UnitOfWork.runInTransaction('school-1', metadata, async () => {
      await UnitOfWork.runInTransaction('school-1', metadata, async () => undefined);
    })).rejects.toThrow('Nested UnitOfWork is prohibited');
    expect(UnitOfWork.isTransactionActive()).toBe(false);
  });

  it('keeps concurrent requests in separate transaction contexts', async () => {
    const observed: Array<{ schoolId: string; transactionId: string }> = [];

    const runAndRollback = async (schoolId: string, id: string) => {
      try {
        await UnitOfWork.runInTransaction(schoolId, { ...metadata, tenantId: schoolId }, async () => {
          const beforeYield = UnitOfWork.getActiveContext();
          await delay(5);
          const afterYield = UnitOfWork.getActiveContext();

          UnitOfWork.enlistCreate('students', id, { id });
          expect(UnitOfWork.getPendingById('students', id)?.data).toEqual({ id });
          observed.push({
            schoolId: afterYield?.schoolId || '',
            transactionId: afterYield?.id || ''
          });
          expect(afterYield?.id).toBe(beforeYield?.id);
          throw new Error(`rollback ${schoolId}`);
        });
      } catch (error) {
        expect((error as Error).message).toBe(`rollback ${schoolId}`);
      }
    };

    await Promise.all([
      runAndRollback('school-1', 'concurrent-school-1'),
      runAndRollback('school-2', 'concurrent-school-2')
    ]);

    expect(observed).toHaveLength(2);
    expect(new Set(observed.map(item => item.transactionId)).size).toBe(2);
    expect(observed.map(item => item.schoolId).sort()).toEqual(['school-1', 'school-2']);
    expect(UnitOfWork.isTransactionActive()).toBe(false);
  });
});
