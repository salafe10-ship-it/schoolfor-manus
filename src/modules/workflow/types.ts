/**
 * Enterprise Workflow Automation Framework
 */

export type WorkflowState = string;

export interface WorkflowDefinition {
  id: string;
  name: string;
  version: number;
  initialState: WorkflowState;
  transitions: Transition[];
}

export interface Transition {
  from: WorkflowState;
  to: WorkflowState;
  action: string;
  condition?: (context: any) => boolean;
}

export interface WorkflowInstance {
  id: string;
  definitionId: string;
  currentState: WorkflowState;
  context: Record<string, any>;
  history: WorkflowLog[];
}

export interface WorkflowLog {
  state: WorkflowState;
  timestamp: string;
  userId: string;
  action: string;
}
