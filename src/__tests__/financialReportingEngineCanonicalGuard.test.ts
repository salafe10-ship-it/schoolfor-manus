import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('financial reporting engine canonical guard', () => {
  it('blocks report generation before returning fallback-derived headers', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/database/services/FinancialReportingEngine.ts'), 'utf8');
    expect(file).toContain('assertAuthoritativeReporting');
    expect(file).toContain('this.assertAuthoritativeReporting(reportName);');
  });
});
