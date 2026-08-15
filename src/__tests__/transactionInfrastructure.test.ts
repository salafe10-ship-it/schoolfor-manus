import { afterEach, describe, expect, it } from 'vitest';
import { UnitOfWork } from '../database/UnitOfWork';
import type {
  TransactionBeginOptions,
  TransactionDriver,
  TransactionQueryResult,
  TransactionSession,
} from '../database/transactions/TransactionContracts';
import { SQLCommandBuilder } from '../database/transactions/SQLCommand';

class FakeSession implements TransactionSession {
  public readonly id: string;
  public readonly staged: string[] = [];
  public committed = false;
  public rolledBack = false;
  public released = false;
  private queryCount = 0;

  public constructor(private readonly failAt?: number, id = 'fake-tx') {
    this.id = id;
  }

  public async query<Row extends Record<string, unknown> = Record<string, unknown>>(
    sqlText: string,
    _parameters: readonly unknown[] = []
  ): Promise<TransactionQueryResult<Row>> {
    this.queryCount += 1;
    if (this.failAt === this.queryCount) {
      throw new Error('simulated database failure');
    }
    this.staged.push(sqlText);
    return { rows: [], rowCount: 1 } as TransactionQueryResult<Row>;
  }

  public async commit(): Promise<void> {
    if (this.rolledBack || this.released) throw new Error('session is not active');
    this.committed = true;
  }

  public async rollback(): Promise<void> {
    if (this.committed || this.released) throw new Error('session is not active');
    this.rolledBack = true;
    this.staged.length = 0;
  }

  public async release(): Promise<void> {
    this.released = true;
  }
}

class FakeDriver implements TransactionDriver {
  public readonly sessions: FakeSession[] = [];
  public constructor(private readonly failAt?: number, private readonly failBegin = false) {}

  public async begin(options: TransactionBeginOptions): Promise<TransactionSession> {
    if (this.failBegin) throw new Error('connection failure');
    const session = new FakeSession(this.failAt, options.transactionId);
    this.sessions.push(session);
    return session;
  }
}

const metadata = {
  operationName: 'INF-001 infrastructure test',
  userId: 'test-user',
  userName: 'Test User',
  ipAddress: '127.0.0.1',
  affectedTables: ['students'],
  tenantId: 'tenant-1',
};

const command = (step: number) => SQLCommandBuilder.create({
  sqlText: `INSERT INTO test_steps (step_number) VALUES ($1)`,
  parameters: [step],
  executionContext: `INF-001 test step ${step}`,
});

afterEach(async () => {
  if (UnitOfWork.isTransactionActive()) {
    await UnitOfWork.rollback();
  }
  UnitOfWork.configureTransactionDriver(null);
});

describe('INF-001 transaction infrastructure', () => {
  it('commits all commands once and releases the session', async () => {
    const driver = new FakeDriver();
    UnitOfWork.configureTransactionDriver(driver);

    await UnitOfWork.runInTransaction('school-1', metadata, async () => {
      UnitOfWork.enlistCreate('test_steps', 'one', { id: 'one' }, command(1));
      UnitOfWork.enlistCreate('test_steps', 'two', { id: 'two' }, command(2));
    });

    expect(driver.sessions).toHaveLength(1);
    expect(driver.sessions[0].committed).toBe(true);
    expect(driver.sessions[0].rolledBack).toBe(false);
    expect(driver.sessions[0].released).toBe(true);
  });

  it.each([1, 2, 3])('rolls back after persistence step %s with no committed rows', async failAt => {
    const driver = new FakeDriver(failAt);
    UnitOfWork.configureTransactionDriver(driver);

    await expect(UnitOfWork.runInTransaction('school-1', metadata, async () => {
      UnitOfWork.enlistCreate('test_steps', 'one', { id: 'one' }, command(1));
      UnitOfWork.enlistCreate('test_steps', 'two', { id: 'two' }, command(2));
      UnitOfWork.enlistCreate('test_steps', 'three', { id: 'three' }, command(3));
    })).rejects.toThrow('simulated database failure');

    expect(driver.sessions[0].committed).toBe(false);
    expect(driver.sessions[0].rolledBack).toBe(true);
    expect(driver.sessions[0].staged).toHaveLength(0);
  });

  it('rolls back when repository work throws before commit', async () => {
    const driver = new FakeDriver();
    UnitOfWork.configureTransactionDriver(driver);

    await expect(UnitOfWork.runInTransaction('school-1', metadata, async () => {
      UnitOfWork.enlistCreate('test_steps', 'one', { id: 'one' }, command(1));
      throw new Error('repository exception');
    })).rejects.toThrow('repository exception');

    expect(driver.sessions[0].rolledBack).toBe(true);
    expect(driver.sessions[0].committed).toBe(false);
  });

  it('rejects a connection failure without creating a session', async () => {
    const driver = new FakeDriver(undefined, true);
    UnitOfWork.configureTransactionDriver(driver);

    await expect(UnitOfWork.runInTransaction('school-1', metadata, async () => undefined))
      .rejects.toThrow('connection failure');
    expect(driver.sessions).toHaveLength(0);
    expect(UnitOfWork.isTransactionActive()).toBe(false);
  });

  it('keeps concurrent requests on independent sessions', async () => {
    const driver = new FakeDriver();
    UnitOfWork.configureTransactionDriver(driver);

    await Promise.all([
      UnitOfWork.runInTransaction('school-1', metadata, async () => {
        UnitOfWork.enlistCreate('test_steps', 'one', { id: 'one' }, command(1));
        await Promise.resolve();
      }),
      UnitOfWork.runInTransaction('school-2', { ...metadata, tenantId: 'tenant-2' }, async () => {
        UnitOfWork.enlistCreate('test_steps', 'two', { id: 'two' }, command(2));
        await Promise.resolve();
      }),
    ]);

    expect(driver.sessions).toHaveLength(2);
    expect(new Set(driver.sessions.map(session => session.id)).size).toBe(2);
  });

  it('rejects nested, repeated commit, and repeated rollback operations', async () => {
    const driver = new FakeDriver();
    UnitOfWork.configureTransactionDriver(driver);

    await expect(UnitOfWork.runInTransaction('school-1', metadata, async () => {
      await UnitOfWork.runInTransaction('school-1', metadata, async () => undefined);
    })).rejects.toThrow('Nested UnitOfWork is prohibited');

    await expect(UnitOfWork.commit()).rejects.toThrow('No active transaction');
    await expect(UnitOfWork.rollback()).rejects.toThrow('No active transaction');
  });

  it('requires parameterized repository commands in a database transaction', async () => {
    const driver = new FakeDriver();
    UnitOfWork.configureTransactionDriver(driver);

    await expect(UnitOfWork.runInTransaction('school-1', metadata, async () => {
      UnitOfWork.enlistCreate('test_steps', 'unsafe', { id: 'unsafe' });
    })).rejects.toThrow('requires a parameterized command');
    expect(driver.sessions[0].rolledBack).toBe(true);
  });
});
