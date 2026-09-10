import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { analyzeRouteIntegrity } from '../../scripts/route-integrity.mjs';

const sourceRoot = path.resolve(process.cwd());
const temporaryRoots: string[] = [];

const createFixture = (mutate: (root: string) => void) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'edupro-route-contract-'));
  temporaryRoots.push(root);
  for (const relativePath of [
    'route-integrity.json',
    'src/App.tsx',
    'src/components/Sidebar.tsx',
    'src/components/TopNavigation.tsx',
    'src/components/ModernSchoolDashboard.tsx',
    'src/navigation/CanonicalSectionRoute.ts',
    'src/security/CustomerProductionPortalPolicy.ts',
  ]) {
    const target = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(sourceRoot, relativePath), target);
  }
  mutate(root);
  return root;
};

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('route integrity contract', () => {
  it('accepts the current canonical route and navigation map', () => {
    expect(analyzeRouteIntegrity(sourceRoot)).toMatchObject({ success: true, errors: [] });
  });

  it('rejects a retired route added back to the active contract', () => {
    const root = createFixture((fixtureRoot) => {
      const contractPath = path.join(fixtureRoot, 'route-integrity.json');
      const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
      contract.currentRoutes.push('permissions_admin');
      fs.writeFileSync(contractPath, JSON.stringify(contract));
    });
    expect(analyzeRouteIntegrity(root).errors).toContain('RETIRED_ROUTE_ALSO_CURRENT:permissions_admin');
  });

  it('rejects a retired route reintroduced into navigation', () => {
    const root = createFixture((fixtureRoot) => {
      const sidebarPath = path.join(fixtureRoot, 'src/components/Sidebar.tsx');
      fs.appendFileSync(sidebarPath, "\nconst legacyRoute = { id: 'permissions_admin' };\n");
    });
    expect(analyzeRouteIntegrity(root).errors).toContain('RETIRED_ROUTE_REFERENCED_BY_NAVIGATION:permissions_admin');
  });

  it('rejects a navigation item that is not part of the contract', () => {
    const root = createFixture((fixtureRoot) => {
      const dashboardPath = path.join(fixtureRoot, 'src/components/ModernSchoolDashboard.tsx');
      fs.appendFileSync(dashboardPath, "\nconst unknownQuickAction = { section: 'route_that_does_not_exist' };\n");
    });
    expect(analyzeRouteIntegrity(root).errors).toContain('NAV_ROUTE_NOT_CONTRACTED:route_that_does_not_exist');
  });

  it('rejects a route whose declared component file is missing', () => {
    const root = createFixture((fixtureRoot) => {
      const contractPath = path.join(fixtureRoot, 'route-integrity.json');
      const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
      contract.componentFiles.dashboard = 'src/components/does-not-exist.tsx';
      fs.writeFileSync(contractPath, JSON.stringify(contract));
    });
    expect(analyzeRouteIntegrity(root).errors).toContain('COMPONENT_FILE_MISSING:dashboard:src/components/does-not-exist.tsx');
  });

  it('rejects duplicate canonical compatibility cases', () => {
    const root = createFixture((fixtureRoot) => {
      const routePath = path.join(fixtureRoot, 'src/navigation/CanonicalSectionRoute.ts');
      fs.appendFileSync(routePath, "\nconst duplicateCase = () => { switch ('x') { case 'student_affairs': return 'students'; case 'student_affairs': return 'students'; } };\n");
    });
    expect(analyzeRouteIntegrity(root).errors).toContain('CANONICAL_ROUTE_CASE_DUPLICATE');
  });
});
