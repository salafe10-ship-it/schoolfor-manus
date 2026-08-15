// src/modules/background-jobs/domain/Job.ts
export enum JobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface Job {
  id: string;
  type: string;
  payload: Record<string, any>;
  status: JobStatus;
  retryCount: number;
  maxRetries: number;
}
