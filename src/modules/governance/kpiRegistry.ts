import { KPIDefinition, KPIRegistry } from './types';

export class KPIRegistryImpl implements KPIRegistry {
  private static definitions: Map<string, KPIDefinition> = new Map();

  static register(definition: KPIDefinition) {
    this.definitions.set(definition.id, definition);
    console.log(`[KPIRegistry] Registered KPI: ${definition.name}`);
  }

  static getDefinition(id: string): KPIDefinition | undefined {
    return this.definitions.get(id);
  }

  register(definition: KPIDefinition): void {
    KPIRegistryImpl.register(definition);
  }

  getDefinition(id: string): KPIDefinition | undefined {
    return KPIRegistryImpl.getDefinition(id);
  }
}
