import { getSupabaseClient } from '../client';
import { WorkflowDefinition, WorkflowInstance, ApprovalRequest } from '../../types';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { FallbackStorage } from './FallbackStorage';
import { v4 as uuidv4 } from 'uuid';

export class WorkflowRepository {
  private assertAuthoritativePersistence(operation: string): void {
      FallbackStorage.assertCanonicalPersistence(`workflow ${operation}`);
  }

  public async getDefinitions(schoolId: string): Promise<WorkflowDefinition[]> {
      // Fetch definitions for school
      this.assertAuthoritativePersistence('definitions read');
      return FallbackStorage.getWorkflowDefinitions().filter(d => d.schoolId === schoolId);
  }

  public async getInstance(id: string): Promise<WorkflowInstance | undefined> {
      this.assertAuthoritativePersistence('instance read');
      return FallbackStorage.getWorkflowInstances().find(i => i.id === id);
  }

  public async saveInstance(instance: WorkflowInstance): Promise<void> {
      this.assertAuthoritativePersistence('instance write');
      const list = FallbackStorage.getWorkflowInstances();
      const idx = list.findIndex(i => i.id === instance.id);
      if (idx !== -1) {
          list[idx] = instance;
      } else {
          list.push(instance);
      }
      FallbackStorage.saveWorkflowInstances(list);
  }
}
