// src/modules/workflow/domain/WorkflowEngine.ts
export interface WorkflowTask {
  id: string;
  status: string;
  assignedTo: string;
}

/**
 * Enterprise Workflow Platform.
 * Orchestrates business processes across modules.
 */
export interface WorkflowEngine {
  start(workflowType: string, context: Record<string, any>): Promise<string>;
  completeTask(taskId: string, outcome: string): Promise<void>;
}
