import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const repositorySource = readFileSync('src/components/dashboard/repository/DashboardRepository.ts', 'utf8');

describe('Dashboard metrics trusted authorization', () => {
  it('uses the shared trusted access-token resolver', () => {
    expect(repositorySource).toContain("import { authenticatedRequest } from '../../../utils/authenticatedRequest'");
    expect(repositorySource).not.toContain("localStorage.getItem('edupro_token')");
    expect(repositorySource).toContain("authenticatedRequest('/api/dashboard/metrics'");
  });
});
