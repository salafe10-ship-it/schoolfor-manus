import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { UnitOfWork } from '../database/UnitOfWork';
import { CanonicalStudentTimelineRepository } from '../database/repositories/CanonicalStudentTimelineRepository';
import type { TenantContext } from '../tenant/TenantContext';
import type { TransactionBeginOptions, TransactionDriver, TransactionQueryResult, TransactionSession } from '../database/transactions/TransactionContracts';

const context: TenantContext = {
  tenantId: 'tenant-a',
  schoolId: 'school-a',
  branchId: 'branch-a',
  academicYear: 'year-a',
  userId: 'user-a',
  role: 'SchoolAdmin'
};

class TimelineSession implements TransactionSession {
  public readonly id = 'timeline-test';
  public readonly queries: Array<{ sql: string; parameters: readonly unknown[] }> = [];
  public committed = false;
  public rolledBack = false;
  public released = false;

  public constructor(private readonly rows: Record<string, unknown>[], private readonly fail = false) {}

  public async query<Row extends Record<string, unknown> = Record<string, unknown>>(sql: string, parameters: readonly unknown[] = []): Promise<TransactionQueryResult<Row>> {
    this.queries.push({ sql, parameters });
    if (this.fail) throw new Error('database query failed');
    return { rows: this.rows as Row[], rowCount: this.rows.length };
  }

  public async commit(): Promise<void> { this.committed = true; }
  public async rollback(): Promise<void> { this.rolledBack = true; }
  public async release(): Promise<void> { this.released = true; }
}

class TimelineDriver implements TransactionDriver {
  public readonly session: TimelineSession;
  public beginCount = 0;

  public constructor(rows: Record<string, unknown>[], fail = false) {
    this.session = new TimelineSession(rows, fail);
  }

  public async begin(_options: TransactionBeginOptions): Promise<TransactionSession> {
    this.beginCount += 1;
    return this.session;
  }
}

afterEach(async () => {
  if (UnitOfWork.isTransactionActive()) await UnitOfWork.rollback();
  UnitOfWork.configureTransactionDriver(null);
});

describe('STU-AFFAIRS-P1-006-40 canonical Student Timeline', () => {
  it('keeps authentication, permission, trusted tenant resolution, and canonical reader ordering', () => {
    const serverSource = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');
    const routeStart = serverSource.indexOf('app.get("/api/students/:id/timeline"');
    const route = serverSource.slice(routeStart, routeStart + 900);

    expect(route).toContain('authenticateRequest');
    expect(route).toContain('requirePermission(PERMISSIONS.STUDENT_READ)');
    expect(route).toContain('resolveStudentTenantMiddleware');
    expect(route).toContain('CanonicalStudentTimelineRepository.getTimeline');
    expect(route).not.toContain('AuditRepository.getAll');
  });

  it('reads only structured student audit events inside trusted tenant/school/branch scope', async () => {
    const driver = new TimelineDriver([
      { id: 'event-a', action: 'UPDATE', reason: 'تعديل موثق', actor_user_id: 'actor-a', actor_service_account_id: null, created_at: '2026-08-12T10:00:00Z' },
      { id: 'event-b', action: 'SOFT_DELETE', reason: null, actor_user_id: null, actor_service_account_id: 'service-a', created_at: '2026-08-12T09:00:00Z' }
    ]);
    UnitOfWork.configureTransactionDriver(driver);

    const result = await CanonicalStudentTimelineRepository.getTimeline(context, 'student-a');
    const query = driver.session.queries[0];

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 'event-a', type: 'UPDATE', user: 'actor-a' });
    expect(result[1]).toMatchObject({ id: 'event-b', user: 'service-a' });
    expect(query.sql).toContain("entity_type = 'student'");
    expect(query.sql).not.toContain('details');
    expect(query.parameters).toEqual(['tenant-a', 'school-a', 'branch-a', 'student-a']);
    expect(driver.session.committed).toBe(true);
    expect(driver.session.released).toBe(true);
  });

  it('returns a real empty result when no canonical events exist', async () => {
    const driver = new TimelineDriver([]);
    UnitOfWork.configureTransactionDriver(driver);

    await expect(CanonicalStudentTimelineRepository.getTimeline(context, 'student-without-events')).resolves.toEqual([]);
    expect(driver.session.committed).toBe(true);
  });

  it('fails closed on database errors instead of converting failure to empty', async () => {
    const driver = new TimelineDriver([], true);
    UnitOfWork.configureTransactionDriver(driver);

    await expect(CanonicalStudentTimelineRepository.getTimeline(context, 'student-a')).rejects.toThrow('database query failed');
    expect(driver.session.committed).toBe(false);
    expect(driver.session.rolledBack).toBe(true);
    expect(driver.session.released).toBe(true);
  });

  it('rejects missing trusted context and does not open a read transaction', async () => {
    const driver = new TimelineDriver([]);
    UnitOfWork.configureTransactionDriver(driver);

    await expect(CanonicalStudentTimelineRepository.getTimeline(undefined as unknown as TenantContext, 'student-a'))
      .rejects.toThrow('Trusted tenant context is required');
    expect(driver.beginCount).toBe(0);
  });
});
