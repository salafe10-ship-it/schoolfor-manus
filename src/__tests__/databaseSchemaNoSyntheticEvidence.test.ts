import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/DatabaseSchemaAuditor.tsx'), 'utf8');

describe('database schema auditor evidence safety', () => {
  it('does not expose illustrative schema or index claims without a live connector', () => {
    expect(source).toContain('const verifiedTablesSchema: TableSchemaInfo[] = [];');
    expect(source).toContain('const verifiedMissingIndexes: typeof missingIndexes = [];');
    expect(source).toContain('خدمة مخطط قاعدة البيانات المركزية غير متاحة');
  });
});
