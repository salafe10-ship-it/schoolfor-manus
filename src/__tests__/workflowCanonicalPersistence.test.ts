import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('workflow canonical persistence contract', () => {
  it('fails closed for workflow definitions, instances, and saves', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/database/repositories/WorkflowRepository.ts'), 'utf8');
    expect((file.match(/assertAuthoritativePersistence\(/g) || []).length).toBeGreaterThanOrEqual(4);
    expect(file).toContain("this.assertAuthoritativePersistence('instance write');");
  });
});
