// src/modules/background-jobs/domain/JobProcessor.ts
import { Job, JobStatus } from './Job';

/**
 * Enterprise Job Processor.
 * Manages queueing and execution of asynchronous background tasks.
 */
export interface JobProcessor {
  enqueue(job: Job): Promise<void>;
  process(job: Job): Promise<void>;
}
