
import { WorkflowInstance, WorkflowState, WorkflowLog } from './types';
import { ExaminationAuditor } from './audit';

export class WorkflowEngine {
  static transition(instance: WorkflowInstance, newState: WorkflowState, userId: string, action: string): WorkflowInstance {
    const log: WorkflowLog = {
      state: newState,
      timestamp: new Date().toISOString(),
      userId,
      action
    };

    instance.currentState = newState;
    instance.history.push(log);
    
    ExaminationAuditor.log(
      'workflow_transition',
      instance.id,
      userId,
      {
        tenantId: instance.tenantId,
        schoolId: instance.schoolId,
        branchId: instance.branchId,
        academicYearId: instance.academicYearId,
        sessionId: 'current_session',
        ipAddress: '127.0.0.1',
        device: 'web_client'
      },
      null,
      newState,
      `Transitioned to ${newState}`
    );
    return instance;
  }
}
