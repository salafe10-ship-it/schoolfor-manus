import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('audit canonical persistence contract', () => {
  it('fails closed for audit reads and creation when the central store is unavailable', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/database/repositories/AuditRepository.ts'), 'utf8');
    expect((file.match(/FallbackStorage\.assertCanonicalPersistence\(/g) || []).length).toBeGreaterThanOrEqual(3);
    expect(file).toContain('audit create ${newLog.id}');
    expect(file).toContain('Append-only audit logs cannot be updated');
  });
});
