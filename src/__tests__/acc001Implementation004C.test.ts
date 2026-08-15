import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('ACC-001 IMPLEMENTATION-004C concurrency and idempotency guards', () => {
  it('serializes concurrent posting requests per school and journal', () => {
    const source = read('src/database/services/PostingEngine.ts');
    expect(source).toContain('activePostingLocks');
    expect(source).toContain('const lockKey = `${schoolId}:${entryId}`');
    expect(source).toContain('لم يثبت ترحيل القيد بعد انتظار العملية المتزامنة');
  });

  it('makes canonical status transitions conditional and rollbackable', () => {
    const repository = read('src/database/repositories/JournalRepository.ts');
    const command = read('src/database/transactions/SQLCommand.ts');
    const uow = read('src/database/UnitOfWork.ts');
    expect(repository).toContain('AND status = $4');
    expect(repository).toContain('failIfNoRows: Boolean(expectedStatus)');
    expect(command).toContain('failIfNoRows?: boolean');
    expect(uow).toContain('Atomic accounting state transition affected no rows');
  });
});
