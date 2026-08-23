import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.resolve(process.cwd(), 'src/components/SystemHealthCenter.tsx'),
  'utf8',
);

describe('system health action evidence safety', () => {
  it('does not simulate health checks or local index optimization', () => {
    expect(source).toContain('خدمة مراقبة صحة النظام المركزية غير متاحة');
    expect(source).toContain('خدمة تحسين النظام المركزية غير متاحة');
    expect(source).not.toContain('نسبة كفاءة النظام الحالية 100%');
  });
});
