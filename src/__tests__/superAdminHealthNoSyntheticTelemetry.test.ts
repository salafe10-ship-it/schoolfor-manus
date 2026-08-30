import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('SuperAdminHealth authoritative telemetry contract', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/components/super-admin/SuperAdminHealth.tsx'), 'utf8');

  it('starts unverified and does not run random telemetry updates', () => {
    expect(source).toContain('useState(0)');
    expect(source).toContain('القياس الحي لا يثبت إلا من موصل مراقبة مركزي موثق');
    expect(source).toContain('setHistoryData([]);');
    expect(source).not.toContain('const [cpuUsage, setCpuUsage] = useState(42)');
  });
});
