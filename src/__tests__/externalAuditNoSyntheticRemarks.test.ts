import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('ExternalAuditProtocol authoritative audit contract', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/components/ExternalAuditProtocol.tsx'), 'utf8');

  it('starts without embedded audit remarks or executable simulation without a selected record', () => {
    expect(source).toContain('لا تُعرض ملاحظات أو اعتمادات تدقيق مزروعة');
    expect(source).toContain('const [remarks, setRemarks] = useState<AuditRemark[]>([]);');
    expect(source).toContain("if (!selectedRemark.id)");
    expect(source).not.toContain('useState<AuditRemark[]>(INITIAL_REMARKS)');
  });
});
