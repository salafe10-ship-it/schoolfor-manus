import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/SmartPortalGateway.tsx'), 'utf8');

describe('smart portal tenant branding evidence safety', () => {
  it('does not show a fabricated school when no tenant is loaded', () => {
    expect(source).toContain("name: 'مدرسة غير محددة'");
    expect(source).toContain("licenseNumber: 'غير متحقق'");
    expect(source).not.toContain('مدارس النور الأهلية النموذجية');
    expect(source).not.toContain("|| 'school_1'");
  });
});
