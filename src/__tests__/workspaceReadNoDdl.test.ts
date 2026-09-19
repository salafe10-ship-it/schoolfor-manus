import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('tenant workspace read path', () => {
  it('does not execute schema DDL during an authenticated read', () => {
    const source = readFileSync('server.ts', 'utf8');
    const routeStart = source.indexOf("app.get('/api/school/workspace'");
    const routeEnd = source.indexOf("app.get('/api/admin/central/health'", routeStart);
    expect(routeStart).toBeGreaterThanOrEqual(0);
    expect(routeEnd).toBeGreaterThan(routeStart);
    const route = source.slice(routeStart, routeEnd);
    expect(route).not.toContain('ensureOwnerWorkspaceReleaseSchema()');
    expect(route).not.toContain('CREATE TABLE');
  });
});
