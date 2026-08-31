import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('central school partial update safety', () => {
  it('merges only profile keys explicitly supplied by the central caller', () => {
    const server = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');
    const start = server.indexOf("if (operation === 'update')");
    const end = server.indexOf("} else if (operation === 'status')", start);
    const updateRoute = server.slice(start, end);
    expect(updateRoute).toContain('Object.prototype.hasOwnProperty.call(requestedProfile, key)');
    expect(updateRoute).toContain('requestedProfile[key] ??');
    expect(updateRoute).not.toContain("String(requestedProfile[key] || '').trim()" );
  });
});
