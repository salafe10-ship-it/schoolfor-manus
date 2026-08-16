import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = (file: string) => resolve(process.cwd(), file);
const source = (file: string) => readFileSync(root(file), 'utf8');

describe('DB-002 persistence source-of-truth boundary', () => {
  it('fails closed for canonical persistence instead of treating local fallback as success', () => {
    const fallback = source('src/database/repositories/FallbackStorage.ts');
    const student = source('src/database/repositories/StudentRepository.ts');

    expect(fallback).toContain("PERSISTENCE_UNKNOWN");
    expect(fallback).toContain('isCanonicalPersistenceRequired');
    expect(fallback).toContain("this.assertCanonicalPersistence(`write ${operation} ${table}/${recordId}`)");
    expect(student).toContain('runCanonicalMutation');
    expect(student).toContain("FallbackStorage.assertCanonicalPersistence('student create')");
    expect(student).toContain("FallbackStorage.assertCanonicalPersistence('student update')");
    expect(student).toContain("FallbackStorage.assertCanonicalPersistence('student delete')");
    expect(student).toContain("FallbackStorage.assertCanonicalPersistence('student restore')");
    expect(student).toContain("FallbackStorage.assertCanonicalPersistence('student permanent delete')");
  });

  it('does not automatically replay student mutations after an unknown remote outcome', () => {
    const student = source('src/database/repositories/StudentRepository.ts');
    const mutationBlock = student.slice(student.indexOf('private static async runCanonicalMutation'), student.indexOf('public static async getById'));

    expect(mutationBlock).toContain('return operation();');
    expect(mutationBlock).not.toContain('this.withRetry(async () =>');
    expect(mutationBlock).toContain('timeout');
    expect(mutationBlock).toContain('duplicate');
  });

  it('blocks legacy bulk operations from partial completion', () => {
    const student = source('src/database/repositories/StudentRepository.ts');
    for (const operation of ['bulkCreate', 'bulkUpdate', 'bulkDelete', 'bulkRestore', 'bulkPromote', 'bulkTransfer']) {
      const start = student.indexOf(`public static async ${operation}`);
      const end = student.indexOf('\n  public static async', start + 10);
      const block = student.slice(start, end === -1 ? undefined : end);
      expect(block).toContain('blocked until an explicit PostgreSQL transaction-aware workflow');
    }
  });

  it('blocks the legacy financial localStorage payment path when Supabase is canonical', () => {
    const app = source('src/App.tsx');
    const start = app.indexOf('const handleStudentPaymentSubmit');
    const guard = app.slice(start, app.indexOf('const student = students.find', start));

    expect(guard).toContain('FallbackStorage.isCanonicalPersistenceRequired()');
    expect(guard).toContain('canonical Supabase persistence');
  });

  it('keeps audit records append-only and stops migration/seed on write errors', () => {
    const audit = source('src/database/repositories/AuditRepository.ts');
    const migration = source('src/database/migrations/init.ts');
    const auxiliaryMigration = source('src/database/migrations/student_affairs_tables.ts');
    const seed = source('src/database/seed/init.ts');

    expect(audit).toContain('Append-only audit logs cannot be updated');
    expect(audit).toContain('Append-only audit logs cannot be deleted');
    expect(audit).not.toContain(".from('audit_logs')\n          .update");
    expect(migration).toContain('UnitOfWork.runInTransaction');
    expect(migration).toContain('transaction will be rolled back');
    expect(migration).toContain('success: false');
    expect(auxiliaryMigration).toContain('throw err');
    expect(seed).toContain('insertOrThrow');
    expect(seed).toContain('A PostgreSQL transaction driver is required');
    expect(seed).toContain('success: false');
  });
});
