import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('HR form canonical persistence', () => {
  it('routes form state through the parent canonical snapshot writer', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/components/hr/OtherHRTabs.tsx'), 'utf8');
    const portal = fs.readFileSync(path.resolve(process.cwd(), 'src/components/hr/HumanResourcesPortal.tsx'), 'utf8');
    expect(file).not.toContain('localStorage');
    expect(portal).toContain("method: 'POST'");
    expect(portal).toContain('expectedVersion: canonicalVersionRef.current');
    expect(file).toContain("status: 'pending'");
  });
});
