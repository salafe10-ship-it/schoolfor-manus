import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const server = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');

describe('financial API server-side write lock', () => {
  it('fails closed before any financial mutation handler', () => {
    const start = server.indexOf('const financialWritesLocked = true;');
    const end = server.indexOf('// Security headers are strict by default.', start);
    const gate = server.slice(start, end);
    expect(gate).toContain("req.path.startsWith('/api/financial')");
    expect(gate).toContain("['GET', 'HEAD', 'OPTIONS']");
    expect(gate).toContain('res.status(423)');
    expect(gate).toContain('FINANCIAL_WRITES_LOCKED');
  });
});
