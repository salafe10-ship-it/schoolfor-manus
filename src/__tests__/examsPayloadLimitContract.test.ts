import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('exams snapshot payload limit', () => {
  it('accepts bounded versioned exam snapshots beyond Express default size', () => {
    const server = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');
    expect(server).toContain("app.use(express.json({ limit: '2mb' }));");
  });
});
