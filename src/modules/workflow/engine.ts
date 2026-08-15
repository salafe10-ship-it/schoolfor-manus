import { WorkflowDefinition, WorkflowInstance, WorkflowState, WorkflowLog } from './types';
import { AuditEngine } from '../audit/auditEngine';

export class WorkflowEngine {
  private static definitions: Map<string, WorkflowDefinition> = new Map();

  static registerDefinition(definition: WorkflowDefinition) {
    this.definitions.set(definition.id, definition);
  }

  static transition(
    instance: WorkflowInstance,
    action: string,
    userId: string,
    contextUpdate: Record<string, any>
  ): WorkflowInstance {
    const definition = this.definitions.get(instance.definitionId);
    if (!definition) throw new Error('Definition not found');

    const transition = definition.transitions.find(
      t => t.from === instance.currentState && t.action === action
    );
    if (!transition) throw new Error('Invalid transition');

    // Update state
    instance.currentState = transition.to;
    instance.context = { ...instance.context, ...contextUpdate };
    
    const log: WorkflowLog = {
      state: instance.currentState,
      timestamp: new Date().toISOString(),
      userId,
      action
    };
    instance.history.push(log);

    // Audit
    AuditEngine.log({
        correlationId: `wf_${instance.id}_${Date.now()}`,
        tenantId: instance.context.tenantId || 'system',
        schoolId: 'system',
        branchId: 'system',
        academicYearId: 'system',
        module: 'workflow',
        operation: 'transition',
        userId,
        sessionId: 'system',
        reason: action,
        source: 'workflow_engine',
        ipAddress: '0.0.0.0',
        device: 'server',
        newState: { state: instance.currentState }
    });

    return instance;
  }
}
