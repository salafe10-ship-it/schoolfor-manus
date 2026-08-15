import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');
const serviceSource = source('src/database/services/StudentService.ts');
const serverSource = source('server.ts');

function bulkServiceBlock(): string {
  const start = serviceSource.indexOf('public static async executeBulkOperation');
  expect(start).toBeGreaterThan(-1);
  return serviceSource.slice(start, serviceSource.indexOf('\n  }\n}', start) + 5);
}

function bulkRouteBlock(): string {
  const start = serverSource.indexOf('app.post("/api/students/bulk"');
  const end = serverSource.indexOf('app.delete("/api/students/:id"', start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return serverSource.slice(start, end);
}

describe('STU-AFFAIRS-P1-006-26 unknown Bulk operation fail-closed contract', () => {
  it('validates the operation before opening a transaction or processing items', () => {
    const block = bulkServiceBlock();
    const validation = block.indexOf('supportedOperations.has(operation)');
    const transaction = block.indexOf('UnitOfWork.runInTransaction');
    const itemProcessing = block.indexOf('for (const item of items)');
    const successAudit = block.indexOf('await AuditRepository.log');

    expect(validation).toBeGreaterThan(-1);
    expect(validation).toBeLessThan(transaction);
    expect(validation).toBeLessThan(itemProcessing);
    expect(validation).toBeLessThan(successAudit);
  });

  it.each(['restore', 'foo', '', 'null'])('rejects unsupported operation %j with the existing validation contract', (operation) => {
    const block = bulkServiceBlock();
    expect(block).toContain("throw new ValidationError(\"نوع العملية الجماعية غير مدعوم.\"");
    expect(block).toContain("errorCode: 'STU-API-UNKNOWN-OPERATION'");
    expect(operation).not.toBe('insert');
  });

  it('keeps the current supported operation contract explicit', () => {
    const block = bulkServiceBlock();
    for (const operation of ['insert', 'update', 'delete', 'transfer', 'promote', 'archive']) {
      expect(block).toContain(`'${operation}'`);
    }
    expect(block).not.toContain("'restore'");
  });

  it('does not wrap the fail-closed validation error as a database 500', () => {
    const route = bulkRouteBlock();
    const validationCatch = route.indexOf('if (err instanceof ValidationError)');
    const databaseWrap = route.indexOf('new DatabaseError("Bulk insert rolled back. Transaction aborted."');
    expect(validationCatch).toBeGreaterThan(-1);
    expect(validationCatch).toBeLessThan(databaseWrap);
    expect(route).toContain('return next(err);');
  });

  it('does not provide a success envelope for unknown operations', () => {
    const block = bulkServiceBlock();
    const validation = block.indexOf('supportedOperations.has(operation)');
    const success = block.indexOf('success: true');
    expect(success).toBeGreaterThan(validation);
    expect(block.slice(validation, success)).toContain('throw new ValidationError');
  });
});
