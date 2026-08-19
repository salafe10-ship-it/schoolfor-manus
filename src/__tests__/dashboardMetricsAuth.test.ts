import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const repositorySource = readFileSync('src/components/dashboard/repository/DashboardRepository.ts', 'utf8');

describe('Dashboard metrics trusted authorization', () => {
  it('uses the shared trusted access-token resolver', () => {
    expect(repositorySource).toContain("import { getTrustedAccessToken } from '../../../utils/auth'");
    expect(repositorySource).toContain('const token = getTrustedAccessToken();');
    expect(repositorySource).not.toContain("localStorage.getItem('edupro_token')");
    expect(repositorySource).toContain("fetch('/api/dashboard/metrics'");
    expect(repositorySource).toContain('Authorization: token ? `Bearer ${token}` : \'\'');
  });
});
