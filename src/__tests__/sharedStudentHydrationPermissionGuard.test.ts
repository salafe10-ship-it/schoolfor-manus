import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf8');

describe('shared student hydration guard', () => {
  it('does not request student rows from Dashboard or unauthorized sections', () => {
    expect(source).toContain("activeSection !== 'students'");
    expect(source).toContain("canAccessSection(trustedSessionUser, 'students', { currentPortal })");
  });
});

