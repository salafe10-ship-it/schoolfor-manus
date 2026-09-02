/**
 * Customer-production portal policy.
 *
 * A school receives this profile only when it is provisioned by the canonical
 * central-school route.  This is deliberately a server-resolved presentation
 * attribute, never a browser preference or a query-string switch.
 */
export const CUSTOMER_PRODUCTION_PORTAL_PROFILE = 'customer_production' as const;

export type CustomerProductionPortalIdentity = {
  platformPermissions?: string[];
  school?: {
    portalProfile?: string;
  };
};

export const CENTRAL_SECTION_IDS = new Set([
  'system_health', 'db_schema', 'super_dashboard', 'super_stats', 'super_schools', 'super_domains', 'super_operations', 'super_license',
  'super_databases', 'super_users', 'super_settings', 'super_audit', 'super_system_governance', 'super_deployment', 'super_rbac',
  'super_security', 'super_backups', 'super_finance', 'super_infra', 'core_certification', 'business_logic_audit', 'accounting_integrity',
  'security_permissions_cert', 'uiux_golden_standard_cert', 'performance_stability_cert', 'maintainability_scalability_cert',
  'zero_regression_cert', 'production_readiness_gate', 'docs_hardening', 'wave1_certification', 'core_system_cert',
  'operational_excellence_cert', 'user_trust_cert', 'commercial_release', 'commercial_competitiveness', 'product_maturity',
  'golden_release_exec', 'ddd_reconstruction', 'fixed_assets_cert', 'procurement_cert'
]);

// These pages either expose platform implementation detail or presently rely
// on non-canonical demonstration data.  They stay available to the internal
// workspace but never form part of a newly provisioned customer workspace.
export const CUSTOMER_PRODUCTION_HIDDEN_SECTION_IDS = new Set([
  ...CENTRAL_SECTION_IDS,
  'ai_assistant',
  'audit_logs',
  'general_review',
  'permissions_admin',
  'settings',
]);

export function hasExplicitPlatformAdminPermission(identity: CustomerProductionPortalIdentity | null | undefined): boolean {
  return Array.isArray(identity?.platformPermissions)
    && identity.platformPermissions.includes('Platform.Admin');
}

export function isCustomerProductionPortal(identity: CustomerProductionPortalIdentity | null | undefined): boolean {
  return !hasExplicitPlatformAdminPermission(identity)
    && identity?.school?.portalProfile === CUSTOMER_PRODUCTION_PORTAL_PROFILE;
}

export function canAccessCustomerProductionSection(sectionId: string): boolean {
  return !CUSTOMER_PRODUCTION_HIDDEN_SECTION_IDS.has(sectionId);
}

export function customerProductionLandingSection(sectionId: string): string {
  return canAccessCustomerProductionSection(sectionId) ? sectionId : 'dashboard';
}
