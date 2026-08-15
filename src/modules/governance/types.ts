/**
 * Enterprise Analytics Governance Framework
 */

export interface KPIDefinition {
  id: string;
  name: string;
  formula: string; // The canonical calculation definition
  owner: string; // Department/Person responsible
  source: string; // Canonical data source
  refreshPolicy: 'real-time' | 'hourly' | 'daily' | 'weekly';
  validationRules: string;
  securityClassification: 'public' | 'internal' | 'restricted';
  trackHistory: boolean;
}

export interface KPIRegistry {
  register(definition: KPIDefinition): void;
  getDefinition(id: string): KPIDefinition | undefined;
}
