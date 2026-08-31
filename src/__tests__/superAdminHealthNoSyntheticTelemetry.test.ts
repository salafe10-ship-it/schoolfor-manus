import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('SuperAdminHealth authoritative telemetry contract', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/components/super-admin/SuperAdminHealth.tsx'), 'utf8');

  it('starts unverified and does not run random telemetry updates', () => {
    expect(source).toContain('const historyData: any[] = [];');
    expect(source).toContain('موصل القياس المركزي غير متصل');
    expect(source).toContain('غير متحقق');
    expect(source).not.toContain('Math.random');
    expect(source).not.toContain('setInterval');
    expect(source).not.toContain('const [cpuUsage, setCpuUsage] = useState(42)');
  });
});
