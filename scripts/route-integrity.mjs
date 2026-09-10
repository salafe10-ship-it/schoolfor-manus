import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDirectory, '..');
const contractPath = path.join(workspaceRoot, 'route-integrity.json');
const unique = (values) => [...new Set(values)];
const literalMatches = (source, pattern) => [...source.matchAll(pattern)].map((match) => match[1]);

export function analyzeRouteIntegrity(root = workspaceRoot) {
  const contract = JSON.parse(fs.readFileSync(path.join(root, 'route-integrity.json'), 'utf8'));
  const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
  const sidebar = fs.readFileSync(path.join(root, 'src/components/Sidebar.tsx'), 'utf8');
  const topNavigation = fs.readFileSync(path.join(root, 'src/components/TopNavigation.tsx'), 'utf8');
  const dashboard = fs.readFileSync(path.join(root, 'src/components/ModernSchoolDashboard.tsx'), 'utf8');
  const routeModule = fs.readFileSync(path.join(root, 'src/navigation/CanonicalSectionRoute.ts'), 'utf8');
  const centralPolicy = fs.readFileSync(path.join(root, 'src/security/CustomerProductionPortalPolicy.ts'), 'utf8');

  const currentRoutes = contract.currentRoutes;
  const retiredRoutes = new Set(contract.retiredRoutes);
  const aliases = new Set(contract.compatibilityAliases);
  const currentSet = new Set(currentRoutes);
  const errors = [];

  if (unique(currentRoutes).length !== currentRoutes.length) {
    errors.push('CURRENT_ROUTE_DUPLICATE');
  }
  if (unique(contract.retiredRoutes).length !== contract.retiredRoutes.length) {
    errors.push('RETIRED_ROUTE_DUPLICATE');
  }
  for (const route of contract.retiredRoutes) {
    if (currentSet.has(route)) errors.push(`RETIRED_ROUTE_ALSO_CURRENT:${route}`);
  }

  const appReferences = unique([
    ...literalMatches(app, /activeSection\s*===\s*['"]([^'"]+)['"]/g),
    ...literalMatches(app, /setActiveSection\(\s*['"]([^'"]+)['"]\s*\)/g),
  ]);
  const navigationReferences = unique([
    ...literalMatches(sidebar, /\bid:\s*['"]([^'"]+)['"]/g),
    ...literalMatches(topNavigation, /\bid:\s*['"]([^'"]+)['"]/g),
    ...literalMatches(dashboard, /\bsection:\s*['"]([^'"]+)['"]/g),
  ]);
  const centralRoutes = new Set(literalMatches(centralPolicy, /['"](super_[a-z0-9_]+|system_health|db_schema|core_certification|business_logic_audit|accounting_integrity|security_permissions_cert|uiux_golden_standard_cert|performance_stability_cert|maintainability_scalability_cert|zero_regression_cert|production_readiness_gate|docs_hardening|wave1_certification|core_system_cert|operational_excellence_cert|user_trust_cert|commercial_release|commercial_competitiveness|product_maturity|golden_release_exec|ddd_reconstruction|fixed_assets_cert|procurement_cert)['"]/g));

  for (const route of appReferences) {
    if (!currentSet.has(route) && !aliases.has(route)) errors.push(`APP_ROUTE_NOT_CONTRACTED:${route}`);
    if (retiredRoutes.has(route)) errors.push(`RETIRED_ROUTE_REFERENCED_BY_APP:${route}`);
  }
  for (const route of navigationReferences) {
    if (!currentSet.has(route)) errors.push(`NAV_ROUTE_NOT_CONTRACTED:${route}`);
    if (retiredRoutes.has(route)) errors.push(`RETIRED_ROUTE_REFERENCED_BY_NAVIGATION:${route}`);
  }
  for (const route of currentRoutes) {
    if (route === 'login' || centralRoutes.has(route)) continue;
    if (!appReferences.includes(route)) errors.push(`CURRENT_ROUTE_NOT_RENDERED:${route}`);
  }

  const caseRoutes = literalMatches(routeModule, /case\s+['"]([^'"]+)['"]\s*:/g);
  if (unique(caseRoutes).length !== caseRoutes.length) errors.push('CANONICAL_ROUTE_CASE_DUPLICATE');
  const redirectTargets = literalMatches(routeModule, /return\s+['"]([^'"]+)['"]/g);
  for (const route of redirectTargets) {
    if (!currentSet.has(route)) errors.push(`REDIRECT_TARGET_NOT_CURRENT:${route}`);
  }

  for (const [route, relativeFile] of Object.entries(contract.componentFiles)) {
    if (!currentSet.has(route)) errors.push(`COMPONENT_ROUTE_NOT_CURRENT:${route}`);
    const absoluteFile = path.join(root, relativeFile);
    if (!fs.existsSync(absoluteFile)) errors.push(`COMPONENT_FILE_MISSING:${route}:${relativeFile}`);
  }

  return {
    success: errors.length === 0,
    currentRouteCount: currentRoutes.length,
    appReferenceCount: appReferences.length,
    navigationReferenceCount: navigationReferences.length,
    errors,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = analyzeRouteIntegrity();
  console.log(JSON.stringify(result, null, 2));
  if (!result.success) process.exitCode = 1;
}
